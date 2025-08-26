"""
Database abstraction layer for RAG system

This module provides a clean interface for vector database operations,
making it easy to switch between different vector stores (Chroma, Pinecone, etc.)
"""

from typing import List, Dict, Any, Optional
from pathlib import Path

from langchain_openai import OpenAIEmbeddings
from langchain_chroma import Chroma
from langchain.schema import Document
from langchain.schema.embeddings import Embeddings

from utils import LOG
from config import EMBEDDING_MODEL, RETRIEVER_K


class VectorDatabase:
    """Abstract interface for vector database operations"""
    
    def __init__(self, db_dir: str = ".chroma", embedding_model: str = None):
        self.db_dir = db_dir
        self.embedding_model = embedding_model or EMBEDDING_MODEL
        self._embeddings = None
        self._vectorstore = None
    
    @property
    def embeddings(self) -> Embeddings:
        """Get or create embeddings instance"""
        if self._embeddings is None:
            self._embeddings = OpenAIEmbeddings(model=self.embedding_model)
        return self._embeddings
    
    @property
    def vectorstore(self) -> Chroma:
        """Get or create vector store instance"""
        if self._vectorstore is None:
            self._vectorstore = Chroma(
                persist_directory=self.db_dir,
                embedding_function=self.embeddings,
            )
        return self._vectorstore
    
    def add_documents(self, documents: List[Document]) -> None:
        """Add documents to the vector store"""
        if not documents:
            LOG.warning("No documents to add")
            return
        
        LOG.info(f"Adding {len(documents)} documents to vector store")
        self.vectorstore.add_documents(documents)
        LOG.info("Documents added successfully")
    
    def similarity_search(self, query: str, k: int = None) -> List[Document]:
        """Perform similarity search"""
        k = k or RETRIEVER_K
        LOG.debug(f"Performing similarity search with k={k}")
        return self.vectorstore.similarity_search(query, k=k)
    
    def similarity_search_with_score(self, query: str, k: int = None) -> List[tuple]:
        """Perform similarity search with scores"""
        k = k or RETRIEVER_K
        LOG.debug(f"Performing similarity search with scores, k={k}")
        return self.vectorstore.similarity_search_with_score(query, k=k)
    
    def get_retriever(self, search_kwargs: Optional[Dict[str, Any]] = None) -> Any:
        """Get a retriever instance"""
        kwargs = {"k": RETRIEVER_K}
        if search_kwargs:
            kwargs.update(search_kwargs)
        
        LOG.debug(f"Creating retriever with kwargs: {kwargs}")
        return self.vectorstore.as_retriever(search_kwargs=kwargs)
    
    def clear(self) -> None:
        """Clear all documents from the vector store"""
        LOG.info("Clearing vector store")
        # For Chroma, we need to delete the collection and recreate it
        # This is a simple approach - in production you might want more sophisticated clearing
        import shutil
        if Path(self.db_dir).exists():
            shutil.rmtree(self.db_dir)
            LOG.info(f"Removed database directory: {self.db_dir}")
    
    def get_collection_info(self) -> Dict[str, Any]:
        """Get information about the vector store collection"""
        try:
            collection = self.vectorstore._collection
            count = collection.count()
            return {
                "name": collection.name,
                "document_count": count,
                "embedding_dimension": collection.metadata.get("hnsw:space", "unknown"),
                "database_type": "Chroma"
            }
        except Exception as e:
            LOG.warning(f"Could not get collection info: {e}")
            return {"error": str(e)}


# Convenience function for creating database instances
def create_database(db_dir: str = ".chroma", embedding_model: str = None) -> VectorDatabase:
    """Create a new vector database instance"""
    return VectorDatabase(db_dir=db_dir, embedding_model=embedding_model)
