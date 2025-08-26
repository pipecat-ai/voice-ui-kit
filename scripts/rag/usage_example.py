"""
Usage Example for RAG System

This file demonstrates how to use the RAG system to query your codebase.
"""

import os
from pathlib import Path
from run import ingest
from retrieve import make_chain
from db import create_database
from config import (
    LLM_MODEL, EMBEDDING_MODEL, RETRIEVER_K, DEFAULT_REPO_PATHS, DEFAULT_DOCS_PATHS,
    DEFAULT_INCLUDE_EXTS, DEFAULT_EXCLUDE_DIRS, DEFAULT_EXCLUDE_EXTS,
    DEFAULT_CHUNK_CHARS, DEFAULT_CHUNK_OVERLAP
)

def main():
    # Set up your OpenAI API key
    os.environ["OPENAI_API_KEY"] = "your-api-key-here"
    
    # Show current configuration
    print(f"Using LLM model: {LLM_MODEL}")
    print(f"Using embedding model: {EMBEDDING_MODEL}")
    print(f"Retrieving {RETRIEVER_K} documents per query")
    
    # Ingest your codebase (run once)
    project_root = Path(".")
    ingest(
        repos=DEFAULT_REPO_PATHS,
        docs_dirs=DEFAULT_DOCS_PATHS,
        db_dir=".chroma",
        include_exts=DEFAULT_INCLUDE_EXTS,
        exclude_dirs=DEFAULT_EXCLUDE_DIRS,
        exclude_exts=DEFAULT_EXCLUDE_EXTS,
        chunk_chars=DEFAULT_CHUNK_CHARS,
        chunk_overlap=DEFAULT_CHUNK_OVERLAP,
        verbose=False,
        dry_run=False
    )
    
    # Create a chain for querying
    chain = make_chain()
    
    # Example 1: Query about a specific component
    print("=== Example 1: Component Information ===")
    response = chain.invoke({
        "question": "What is the PipecatAppBase component and how do I use it?"
    })
    print(response["answer"])
    print("\n" + "="*50 + "\n")
    
    # Example 2: Query with specific filters (CSS properties)
    print("=== Example 2: CSS Properties ===")
    response = chain.invoke({
        "question": "Show me all CSS custom properties for the Button component"
    })
    print(response["answer"])
    print("\n" + "="*50 + "\n")
    
    # Example 3: Query component props
    print("=== Example 3: Component Props ===")
    response = chain.invoke({
        "question": "What props does the AudioOutput component accept?"
    })
    print(response["answer"])
    print("\n" + "="*50 + "\n")
    
    # Example 4: Query about hooks
    print("=== Example 4: Hooks ===")
    response = chain.invoke({
        "question": "What hooks are available and how do I use them?"
    })
    print(response["answer"])
    print("\n" + "="*50 + "\n")
    
    # Example 5: Query about templates
    print("=== Example 5: Templates ===")
    response = chain.invoke({
        "question": "What templates are available and how do I use them?"
    })
    print(response["answer"])

if __name__ == "__main__":
    main()
