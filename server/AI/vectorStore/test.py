from fastapi import UploadFile
import fitz
import psycopg2
from psycopg2.extras import execute_values
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain.schema import Document
from dotenv import load_dotenv 
import re
load_dotenv()
# conn = psycopg2.connect(
#     dbname = "webFinalProject" , 
#     user = "postgres" , 
#     password = "root" , 
#     host = "localhost" , 
#     port = 5432
# )

# cursor = conn.cursor()

# cursor.execute(
# """
# CREATE TABLE IF NOT EXISTS book_chunks (
#     id SERIAL PRIMARY KEY,
#     book_id INTEGER,
#     page_number INTEGER,
#     content TEXT
# );
# """
# )
# conn.commit()

def load_pdf (uploadFile: UploadFile , cursor , conn , teacher_id , subject , description , author) :
    doc = fitz.open(stream=uploadFile.file.read() , filetype="pdf")
    cursor.execute(
        "INSERT INTO books (title , teacher_id , subject , description , pages , author) VALUES (%s , %s , %s , %s , %s , %s) RETURNING id",
        (uploadFile.filename, teacher_id , subject , description , len(doc) , author)
    )
    book_id = cursor.fetchone()[0]
    records = []
    for page_num in range(len(doc)):
        page_text = doc[page_num].get_text()
        cleaned_text = re.sub(r'[\x00-\x08\x0B-\x0C\x0E-\x1F]', '', page_text).strip()
        if cleaned_text:
            records.append((book_id, page_num + 1, cleaned_text))
    execute_values(cursor,
        "INSERT INTO book_chunks (book_id, page_number, content) VALUES %s",
        records
    )
    conn.commit()
    print(f"{len(records)} pages inserted.")

def fetch_chunks(book_id , cursor , conn):
    cursor.execute("SELECT page_number, content FROM book_chunks WHERE book_id = %s ORDER BY page_number", (book_id,))
    rows = cursor.fetchall()
    docs = []
    for page_number, content in rows:
        metadata = {"page": page_number, "book_id": book_id}
        docs.append(Document(page_content=content, metadata=metadata))
    return docs

def store_to_chroma(book_id, persist_directory="chroma_db"):
    documents = fetch_chunks(book_id)
    if not documents:
        print("No content found for book_id", book_id)
        return

    embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
    vectordb = Chroma.from_documents(documents, embeddings, persist_directory=persist_directory)
    vectordb.persist()
    print(f"Stored {len(documents)} chunks into ChromaDB.")

# store_to_chroma(book_id=1)
# load_pdf("F:/My_Projects/web-final/server/AI/vectorStore/Grokking Algorithms.pdf", book_id=1)

# cursor.close()
# conn.close()