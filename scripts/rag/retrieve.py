"""
Retrieval functionality for RAG system

This module contains the SelfQueryRetriever setup, chain creation, and query functionality.
"""

import os
from typing import Dict, Any

from langchain_openai import ChatOpenAI
from langchain.retrievers.self_query.base import SelfQueryRetriever
from langchain.chains.query_constructor.schema import AttributeInfo
from langchain.prompts import ChatPromptTemplate
from langchain.schema.runnable import RunnableMap

from utils import LOG
from config import (
    LLM_MODEL, LLM_TEMPERATURE, RETRIEVER_K,
    SYSTEM_PROMPT, HUMAN_PROMPT, SELF_QUERY_VERBOSE
)
from db import create_database



# ----------------------------
# Document Formatting
# ----------------------------
def format_docs(docs):
    """Format documents for the prompt with citations and content"""
    lines = []
    for i, d in enumerate(docs, 1):
        rel = d.metadata.get("relpath", "unknown")
        start = d.metadata.get("start_line", "?")
        end = d.metadata.get("end_line", "?")
        kind = d.metadata.get("kind", "unknown")
        ext = d.metadata.get("ext", "")
        component = d.metadata.get("component", "")
        
        # Build tag with metadata
        tag_parts = [kind]
        if ext:
            tag_parts.append(ext)
        if component:
            tag_parts.append(f"component={component}")
        
        # Add example-specific metadata
        if kind == "example":
            example_type = d.metadata.get("example_type", "")
            build_tool = d.metadata.get("build_tool", "")
            framework = d.metadata.get("framework", "")
            complexity = d.metadata.get("complexity", "")
            file_type = d.metadata.get("file_type", "")
            key_features = d.metadata.get("key_features", [])
            
            if example_type:
                tag_parts.append(f"example={example_type}")
            if build_tool:
                tag_parts.append(f"build={build_tool}")
            if framework:
                tag_parts.append(f"framework={framework}")
            if complexity:
                tag_parts.append(f"complexity={complexity}")
            if file_type:
                tag_parts.append(f"file_type={file_type}")
            if key_features:
                # key_features is now a string, so just show first part
                features_str = key_features.split(", ")[:3]  # Show first 3 features
                tag_parts.append(f"features={','.join(features_str)}")
        
        tag = f"[{', '.join(tag_parts)}]"
        
        # Include the actual document content
        lines.append(f"- {rel}{tag}]")
        lines.append(f"Content:\n{d.page_content}")
        lines.append("-" * 80)
    return "\n".join(lines)

# ----------------------------
# Chain Creation
# ----------------------------
def make_chain(db_dir: str = ".chroma"):
    """Create a RAG chain with SelfQueryRetriever"""
    
    # Initialize database
    database = create_database(db_dir=db_dir)
    
    # Metadata field information for SelfQueryRetriever
    metadata_field_info = [
        AttributeInfo(name="kind", description="Source type: 'code' (implementation files), 'docs' (documentation files), or 'example' (working example projects). Code files contain the actual component implementations, interfaces, and styling. Docs files contain usage examples and explanations. Example files contain complete working implementations with different build tools and complexity levels.", type="string"),
        AttributeInfo(name="ext", description="File extension: .tsx/.ts (TypeScript components), .css/.scss (styling), .md/.mdx (documentation), .jsx/.js (JavaScript), .html (HTML templates). CSS files contain design tokens and component styles. TypeScript files contain component definitions and interfaces.", type="string"),
        AttributeInfo(name="relpath", description="File path relative to the project root. Use this to identify specific files and their location in the project structure.", type="string"),
        AttributeInfo(name="component", description="The primary component name associated with this chunk. Use this to find all files related to a specific component (e.g., 'Button' will find Button component files, CSS, and docs).", type="string"),
        AttributeInfo(name="title", description="Document title or section heading for documentation files. Helps identify specific sections of documentation.", type="string"),
        AttributeInfo(name="start_line", description="Starting line number of this chunk in the source file (1-based).", type="integer"),
        AttributeInfo(name="end_line", description="Ending line number of this chunk in the source file (1-based).", type="integer"),
        AttributeInfo(name="example_type", description="For examples: 'console', 'components', 'tailwind', 'vite', 'themes', etc. Use this to find examples of specific implementation patterns.", type="string"),
        AttributeInfo(name="build_tool", description="Build tool used: 'next', 'vite', 'webpack', 'rollup', etc. Use this to find examples using specific build tools.", type="string"),
        AttributeInfo(name="framework", description="Framework used: 'react', 'next', 'vue', 'svelte', etc. Use this to find examples using specific frameworks.", type="string"),
        AttributeInfo(name="complexity", description="Complexity level: 1 (simple) to 5 (advanced). Use this to find examples matching the desired complexity level.", type="integer"),
        AttributeInfo(name="file_type", description="Type of file: 'dependencies', 'implementation', 'stylesheet', 'configuration', 'documentation', 'html'. Use this to find specific types of files within examples.", type="string"),
        AttributeInfo(name="key_features", description="Comma-separated list of key features this example demonstrates. Use this to find examples with specific functionality.", type="string"),
    ]
    
    # Document content description for SelfQueryRetriever
    document_content_description = (
        "A comprehensive collection of project files including React component implementations, TypeScript interfaces, CSS styling files, documentation, and working example projects. "
        "When searching for component information, return ALL relevant files: component implementation files (.tsx/.ts), CSS files with styling and design tokens, "
        "and documentation files (.md/.mdx) with usage examples. CSS files contain the authoritative styling information including custom properties and design tokens. "
        "TypeScript files contain component definitions, prop interfaces, and variant definitions. Documentation files contain usage examples and explanations. "
        "Example projects contain complete working implementations with different build tools (Next.js, Vite, etc.) and complexity levels (1-5). "
        "For code generation questions, prefer examples that match the user's build tool and complexity requirements. "
        "For complete information about a component, you need both the implementation (code) and the styling (CSS) files."
    )
    
    # Create SelfQueryRetriever with optimized settings
    llm = ChatOpenAI(
        model=LLM_MODEL, 
        temperature=LLM_TEMPERATURE,
        request_timeout=10,  # 10 second timeout
        max_retries=1  # Reduce retries
    )
    retriever = SelfQueryRetriever.from_llm(
        llm,
        database.vectorstore,
        document_contents=document_content_description,
        metadata_field_info=metadata_field_info,
        verbose=SELF_QUERY_VERBOSE,
        search_kwargs={"k": RETRIEVER_K},
        enable_limit=True,  # Enable query limits
        max_llm_queries_per_chain=1,  # Limit LLM calls
    )
    
    LOG.info("SelfQueryRetriever initialized successfully")
    
    # Create prompt template
    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        ("human", HUMAN_PROMPT),
    ])
    
    # Create the chain
    chain = RunnableMap({
        "sources": lambda x: format_docs(retriever.invoke(x["question"])),
        "question": lambda x: x["question"],
    }) | prompt | llm
    
    return chain

# ----------------------------
# Query Function
# ----------------------------
def query(question: str, db_dir: str = ".chroma", debug_retrieval: bool = False, use_fast_search: bool = False) -> Dict[str, Any]:
    """Query the RAG system with a question"""
    
    if use_fast_search:
        # Use simple similarity search for faster results
        database = create_database(db_dir=db_dir)
        docs = database.similarity_search(question, k=RETRIEVER_K)
        
        if debug_retrieval:
            print("\n=== RETRIEVED DOCUMENTS (Fast Search) ===")
            print(f"Retrieved {len(docs)} documents:")
            for i, doc in enumerate(docs):
                print(f"\n--- Document {i+1} ---")
                print(f"File: {doc.metadata.get('relpath', 'unknown')}")
                print(f"Kind: {doc.metadata.get('kind', 'unknown')}")
                print(f"Ext: {doc.metadata.get('ext', 'unknown')}")
                print(f"Component: {doc.metadata.get('component', 'none')}")
                print(f"Lines: {doc.metadata.get('start_line', '?')}-{doc.metadata.get('end_line', '?')}")
                print(f"Content length: {len(doc.page_content)} chars")
                print(f"Content preview: {doc.page_content[:200]}...")
                print("-" * 50)
            print("\n" + "="*80 + "\n")
        
        sources = format_docs(docs)
        
        # Create simple chain without SelfQueryRetriever
        llm = ChatOpenAI(
            model=LLM_MODEL, 
            temperature=LLM_TEMPERATURE,
            request_timeout=15
        )
        prompt = ChatPromptTemplate.from_messages([
            ("system", SYSTEM_PROMPT),
            ("human", HUMAN_PROMPT),
        ])
        
        response = prompt.invoke({
            "question": question,
            "sources": sources
        }) | llm
        
        return {
            "question": question,
            "answer": response.content,
            "method": "fast_similarity_search"
        }
    else:
        # Use SelfQueryRetriever for more accurate results
        chain = make_chain(db_dir)
        response = chain.invoke({"question": question})
        
        return {
            "question": question,
            "answer": response.content,
            "method": "self_query_retriever"
        }
