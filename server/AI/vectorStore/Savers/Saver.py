from abc import ABC , abstractmethod
from typing import List
from langchain_community.vectorstores import Chroma
from langchain_google_genai import GoogleGenerativeAIEmbeddings
import logging
from langchain.embeddings.base import Embeddings
from langchain.docstore.document import Document
from dotenv import load_dotenv 
load_dotenv()
class VectorStoreSaver:
    def __init__(self, book_id: int, persist_directory: str, embeddings):
        self.book_id = book_id
        self.persist_directory = persist_directory
        self.embeddings = embeddings

    def save(self, documents):
        if not documents:
            logging.warning(f"No content found for book_id: {self.book_id}")
            return

        # Ensure each document has book_id metadata
        for doc in documents:
            doc.metadata = doc.metadata or {}
            doc.metadata["book_id"] = self.book_id

        try:
            # Load existing Chroma collection or create if doesn't exist
            vectordb = Chroma(
                persist_directory=self.persist_directory,
                embedding_function=self.embeddings
            )
            vectordb.add_documents(documents)
            vectordb.persist()
            logging.info(f"Stored {len(documents)} chunks into ChromaDB with book_id {self.book_id}.")
        except Exception as e:
            logging.error(f"Failed to save documents for book_id {self.book_id}: {e}")