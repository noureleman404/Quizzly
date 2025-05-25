from abc import ABC , abstractmethod
from typing import List
from langchain_community.vectorstores import Chroma
from langchain_google_genai import GoogleGenerativeAIEmbeddings
import logging
from langchain.embeddings.base import Embeddings
from langchain.docstore.document import Document
from dotenv import load_dotenv 
load_dotenv()
class Retriever(ABC):
    @abstractmethod
    def retrieve(self, query: str) -> List[str]:
        pass


class ChromaDbRetriever(Retriever):
    def __init__(self, book_id: int, persist_directory: str = "chroma_db"):
        self.book_id = book_id
        self.persist_directory = persist_directory
        self.embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
        self.vectordb = Chroma(
            persist_directory=self.persist_directory,
            embedding_function=self.embeddings
        )

    def retrieve(self, query: str) -> List[str]:
        try:
            docs = self.vectordb.similarity_search(query, filter={"book_id": self.book_id}, k=3)
            return [doc.page_content for doc in docs]
        except Exception as e:
            print(f"Error during retrieval for book_id {self.book_id}: {e}")
            return []

ret = ChromaDbRetriever(book_id="26")
print(ret.retrieve(query="Deep leaning"))
