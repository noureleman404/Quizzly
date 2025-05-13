from datetime import date
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, File, Request, UploadFile , Form , HTTPException , status
from psycopg2 import Date
from pydantic import BaseModel
from enum import Enum
from utilities.verifyToken import verify_token
from vectorStore.test import load_pdf
from utilities.get_db import get_db
from fastapi.middleware.cors import CORSMiddleware
from workflow.workflow import generate_quiz , print_quiz , store_quizzes
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
                      quizzes=quizzes)
        #-> Assign Quiz to the ClassRoom
        
        #->   
        print_quiz(quizzes)
        
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    cursor , conn = db
    return {"status": f"hmmm"}

