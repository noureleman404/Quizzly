from datetime import date
import datetime
import json
from typing import Dict, List
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, File, Request, UploadFile , Form , HTTPException , status
from psycopg2 import Date
from pydantic import BaseModel
from enum import Enum
from utilities.verifyToken import get_current_user_id, verify_token
from vectorStore.utils import load_pdf
from utilities.get_db import get_db
from fastapi.middleware.cors import CORSMiddleware
from workflow.workflow import generate_quiz , print_quiz , store_quizzes
from workflow.shortAnswer_evaluation import evaluate_short_answer
from vectorStore.Retreivers.Retriever import ChromaDbRetriever
load_dotenv()

origins=["*"]

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # or ["POST", "GET", "OPTIONS"] etc.
    allow_headers=["*"],
)

class Difficulty(Enum):
    hard = "hard"
    normal = "normal"
    easy = "easy"


class generateRequest(BaseModel):
    """
    Request model for /generateQuiz endpoint
    """
    # teacher_id : int
    book_id : int
    number_of_questions: int 
    difficulty: Difficulty
    classroom_id: int 
    startPage: int 
    endPage: int
    title:str
    deadline_date:date
    personalized:bool
    duration: int
    

@app.post("/UploadBook")
async def uploadBook(
    request: Request,
    book: UploadFile = File(...) ,
    subject: str = Form(...),
    description: str = Form(...),
    author: str = Form(...),
    db=Depends(get_db)
):
    print(subject , description)
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authorization header missing or invalid.")
    token = auth_header.split(" ")[1]
    try:
        payload = verify_token(token)
        teacher_id = payload["id"]
        
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    cursor , conn = db
    load_pdf(uploadFile=book ,
            conn=conn ,
            cursor=cursor ,
            teacher_id=teacher_id ,
            description=description ,
            subject=subject , 
            author=author) 
    
    return {"status": f"Book '{book.filename}' uploaded successfully"}
    


@app.post("/GenerateQuiz")
async def generateQuiz(
    request: Request,
    requestData : generateRequest,
    db=Depends(get_db)
):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authorization header missing or invalid.")
    token = auth_header.split(" ")[1]
    try:
        payload = verify_token(token)
        teacher_id = payload["id"]
        print(requestData)
        quizzes = generate_quiz(requestData.book_id,
                                requestData.startPage,
                                requestData.endPage, 
                                num_quizzes=1 ,
                                questionsNum=requestData.number_of_questions)
        #-> Save Quiz
        cursor , conn = db
        store_quizzes(conn=conn ,
                      book_id=requestData.book_id , 
                      classroom_id=requestData.classroom_id ,
                      numOfVersions=1 , 
                      page_end=requestData.endPage , 
                      page_start=requestData.startPage ,
                      teacher_id=payload["id"] , 
                      title=requestData.title , 
                      deadline_date=requestData.deadline_date , 
                      quizzes=quizzes, 
                      duration=requestData.duration)

        # print_quiz(quizzes)
        
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    cursor , conn = db
    return {"status": f"hmmm"}


class SubmitQuizAnswersRequest(BaseModel):
    quiz_id: int 
    version_id: int 
    answers: Dict[int, str]  # keys as string indices, values as choice indices

@app.post("/student/quiz")
async def submitQuiz(
    body: SubmitQuizAnswersRequest,
    student_id: int = Depends(get_current_user_id),
    db=Depends(get_db)
):
    quiz_id = body.quiz_id
    version_id = body.version_id
    answers = body.answers  # e.g., {"0": 1, "1": 2}
    cursor, conn = db

    with conn.cursor() as cur:
        # Step 1: Check enrollment
        cur.execute("""
            SELECT 1
            FROM classroom_students cs
            JOIN quizzes q ON q.classroom_id = cs.classroom_id
            WHERE cs.student_id = %s AND q.quiz_id = %s
        """, (student_id, quiz_id))
        enrolled =  cur.fetchone()
        if not enrolled:
            raise HTTPException(status_code=403, detail="Not enrolled in this quiz's classroom.")

        # Step 2: Fetch quiz version
        cur.execute("""
            SELECT questions
            FROM quiz_versions
            WHERE version_id = %s AND quiz_id = %s
        """, (version_id, quiz_id))
        row =  cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Invalid quiz version.")
        
        quiz_questions = row[0]  # assuming JSON type, e.g. list of dicts

        cur.execute("""
            SELECT book_id
            FROM quizzes
            WHERE quiz_id = %s
        """, (quiz_id,))
        row =  cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Invalid quiz version.")
        
        book_id = row[0]  # assuming JSON type, e.g. list of dicts
        # print(book_id)
        score = 0

        # Step 3: Calculate score
        for i, question in enumerate(quiz_questions):
            print(question.get("correct_answer"))
            correct = question.get("correct_answer")
            options = question.get("options")
            student_answer = answers.get(i)  # Either "A"/"B" for MCQ or text for SAQ

            if options and isinstance(options, dict) and len(options) > 0:
                # It's a Multiple Choice Question
                print(student_answer)
                if student_answer and student_answer.upper() == correct.upper():
                    score += 1
            else:
                ret = ChromaDbRetriever(book_id=book_id)
                similar_context = ret.retrieve(query=question.get("question"))
                print("Similar con :" , similar_context)
                result = evaluate_short_answer(context=correct , maximum_grade= 1 , similar_context=similar_context, user_answer= student_answer)
                score += result["score"]
                

            

        score_percent = (score / len(quiz_questions)) * 100 if quiz_questions else 0
        # Step 4: Insert or update attempt
        cur.execute("""
            INSERT INTO student_quiz_attempts
            (student_id, quiz_id, version_id, completed_at, score, answers)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT (student_id, quiz_id) DO UPDATE SET
                version_id = EXCLUDED.version_id,
                completed_at = EXCLUDED.completed_at,
                score = EXCLUDED.score,
                answers = EXCLUDED.answers
        """, (
            student_id,
            quiz_id,
            version_id,
            datetime.datetime.utcnow(),
            score_percent,
            json.dumps(answers)
        ))
        conn.commit()

    return {
        "message": "Quiz submitted successfully",
        "totalQuestions": len(quiz_questions),
        "correctAnswers": score,
        "scorePercent": f"{score_percent:.2f}"
    }