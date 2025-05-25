import re
import logging
import psycopg2
from dotenv import load_dotenv
from langchain.prompts import PromptTemplate
from langchain.schema import Document
from langchain_community.vectorstores import Chroma
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.chains.retrieval import create_retrieval_chain
from psycopg2.extras import Json

load_dotenv()

logging.basicConfig(level=logging.INFO)

conn = psycopg2.connect(
    dbname="webFinalProject",
    user="postgres",
    password="root",
    host="localhost",
    port=5432
)
cursor = conn.cursor()

def load_chroma_vectorStore(dir='chroma_db'):
    try:
        vectorDb = Chroma(persist_directory=dir)
        logging.info("Chroma vector store loaded successfully.")
        return vectorDb
    except Exception as e:
        logging.error(f"Error loading Chroma vector store: {e}")
        return None

def query_chroma_vector_store(vectorDb: Chroma, q, n_results):
    try:
        result = vectorDb.similarity_search(q, n_results)
        logging.info(f"Retrieved {len(result)} results for query: {q}")
        return result
    except Exception as e:
        logging.error(f"Error querying Chroma vector store: {e}")
        return []

def fetch_chunks_in_range(book_id, start_page, end_page):
    try:
        cursor.execute(
            "SELECT page_number, content FROM book_chunks WHERE book_id = %s AND page_number BETWEEN %s AND %s ORDER BY page_number",
            (book_id, start_page, end_page)
        )
        rows = cursor.fetchall()
        docs = [Document(page_content=content, metadata={"page": page, "book_id": book_id}) for page, content in rows]
        logging.info(f"Fetched {len(docs)} pages for book_id {book_id} from page {start_page} to {end_page}.")
        return docs
    except Exception as e:
        logging.error(f"Error fetching chunks from database: {e}")
        return []

def generate_quiz_from_content(content , num_questions):
    
    prompt_template = """
You are a highly skilled AI assistant. Your task is to generate exactly {num_questions} multiple-choice questions (MCQs) and 2 short answer questions based on the following content.

-- START OF CONTENT --
{text}
-- END OF CONTENT --

Generate {num_questions} MCQs using this strict format for each question:

1. **Question:** Your question here  
2. **A.** Option A  
3. **B.** Option B  
4. **C.** Option C  
5. **D.** Option D  
6. **Correct Answer:** A/B/C/D

Generate 2 SAQs using this strict format for each question:

1. **Question:** Your question here  
6. **Correct Answer:** your correct answer

Rules:
- Do not include anything outside this format.
- All answers should be plausible but only one correct.
- Return exactly {num_questions} MCQs.
"""

    try:
        model = ChatGoogleGenerativeAI(model='gemini-1.5-flash')
        response = model.invoke(prompt_template.format(text=content.strip() , num_questions = num_questions))
        if not response or not hasattr(response, 'content'):
            raise ValueError("Invalid model response format.")
        logging.info("Quiz generated successfully.")
        # print(response)
        return response.content.strip()
    except Exception as e:
        logging.error(f"Error generating quiz: {e}")
        return None

def parse_and_save_quiz(quiz_content):
    # print(quiz_content)
    pattern = re.compile(r"""
        (?P<number>\d+)\.\s*\*\*Question:\*\*\s*(?P<question>.*?)\n
        (?:
            (?:\d+\.\s*\*\*A\.\*\*\s*(?P<A>.*?)\n)?
            (?:\d+\.\s*\*\*B\.\*\*\s*(?P<B>.*?)\n)?
            (?:\d+\.\s*\*\*C\.\*\*\s*(?P<C>.*?)\n)?
            (?:\d+\.\s*\*\*D\.\*\*\s*(?P<D>.*?)\n)?
        )?
        \d+\.\s*\*\*Correct\s*Answer:\*\*\s*(?P<answer>.*?)(?=\n\d+\.|\Z)
    """, re.VERBOSE | re.DOTALL)

    quizzes = []

    try:
        matches = pattern.finditer(quiz_content)
        
        for match in matches:
            data = match.groupdict()
            question = data['question'].strip()
            answer = data['answer'].strip()

            # Determine if it's multiple-choice or open-ended
            if all(data.get(opt) for opt in ['A', 'B', 'C', 'D']):
                quizzes.append({
                    'question': question,
                    'options': {
                        'A': data['A'].strip(),
                        'B': data['B'].strip(),
                        'C': data['C'].strip(),
                        'D': data['D'].strip(),
                    },
                    'correct_answer': answer
                })
            else:
                quizzes.append({
                    'question': question,
                    'correct_answer': answer
                })

        if not quizzes:
            raise ValueError("No valid quizzes parsed from the content.")
        return quizzes

    except Exception as e:
        logging.error(f"Error parsing quiz content: {e}")
        return []

def generate_quiz(book_id, start_page, end_page, num_quizzes , questionsNum):
    #-> Fetch Chunks
    documents = fetch_chunks_in_range(book_id, start_page, end_page)
    if not documents:
        logging.warning(f"No content found for pages {start_page}-{end_page} of book_id {book_id}")
        return []

    combined_content = "\n".join(doc.page_content for doc in documents)
    quizzes = []

    for _ in range(num_quizzes):
        quiz_content = generate_quiz_from_content(combined_content , questionsNum)
        if quiz_content:
            parsed_quiz = parse_and_save_quiz(quiz_content)
            if parsed_quiz:
                quizzes.append(parsed_quiz)
            else:
                logging.warning("Generated quiz could not be parsed. Skipping.")
        else:
            logging.warning("No quiz content generated. Skipping.")

    logging.info(f"Generated {len(quizzes)} quizzes for book_id {book_id}, pages {start_page}-{end_page}.")
    return quizzes
def print_quiz(quizzes):
    for quiz_index, quiz_set in enumerate(quizzes, start=1):
        print(f"\n=== Quiz Set {quiz_index} ===\n")
        for q_num, quiz in enumerate(quiz_set, start=1):
            print(f"Q{q_num}: {quiz['question']}")
            if(quiz.get('options')):
                print(f"  A. {quiz['options']['A']}")
                print(f"  B. {quiz['options']['B']}")
                print(f"  C. {quiz['options']['C']}")
                print(f"  D. {quiz['options']['D']}")
            print(f"  [Correct Answer: {quiz['correct_answer']}]\n")

def store_quizzes(
    conn,
    book_id,
    classroom_id,
    deadline_date,
    numOfVersions,
    page_start,
    page_end,
    teacher_id,
    title,
    quizzes  ,
    duration
):
    try:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO quizzes (book_id, classroom_id, deadline_date, num_versions, page_end, page_start, teacher_id, title , duration)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s , %s)
                RETURNING quiz_id
            """, (book_id, classroom_id, deadline_date, numOfVersions, page_end, page_start, teacher_id, title , duration))
            quiz_id = cur.fetchone()[0]

            for version_number , quiestions in enumerate(quizzes , start=1):
                cur.execute("""
                INSERT INTO quiz_versions (quiz_id , version_number , questions)
                            VALUES(%s , %s , %s)
                    """ , (quiz_id , version_number , Json(quiestions)))
            conn.commit()
            print("Quiz and versions stored successfully.")
            return quiz_id
    except Exception as e:
        conn.rollback()
        print("Error storing quiz:", e)
        raise
if __name__ == "__main__":
    # book_id = 16
    # start_page = 10
    # end_page = 50
    # quizzes = generate_quiz(book_id, start_page, end_page, num_quizzes=1 ,questionsNum=7)
    # print_quiz(quizzes)

    # cursor.close()
    # conn.close()
    model = ChatGoogleGenerativeAI(model='gemini-1.5-flash')
    response = model.invoke("hello")
    print(response)