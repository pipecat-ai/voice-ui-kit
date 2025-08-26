"""
Example project processor for RAG system

This module processes example projects with enhanced metadata to improve code generation
quality by providing real working implementations with different build tools and complexity levels.
"""

from pathlib import Path
from typing import List, Dict, Any, Set
import json

from langchain.schema import Document
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate

from utils import LOG
from config import EXAMPLE_CHUNK_CHARS, EXAMPLE_CHUNK_OVERLAP, DEFAULT_INCLUDE_EXTS, LLM_MODEL, LLM_TEMPERATURE


def analyze_example_with_llm(example_path: Path) -> Dict[str, Any]:
    """Use LLM to analyze example project and extract metadata"""
    # Read key files
    readme_content = ""
    package_json_content = ""
    
    readme_path = example_path / "README.md"
    if readme_path.exists():
        with open(readme_path, 'r', encoding='utf-8') as f:
            readme_content = f.read()
    
    package_json_path = example_path / "package.json"
    if package_json_path.exists():
        with open(package_json_path, 'r', encoding='utf-8') as f:
            package_json_content = f.read()
    
    if not readme_content and not package_json_content:
        raise ValueError(f"No README.md or package.json found in {example_path}")
    
    # Create LLM prompt
    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are an expert at analyzing React/JavaScript projects. 
        Analyze the provided README.md and package.json files to extract key metadata about the project.
        
        You MUST return ONLY a valid JSON object with the following exact structure:
        {{
            "description": "A concise 1-2 sentence description of what this example demonstrates",
            "framework": "The main framework used (react, next, vue, svelte, etc.)",
            "build_tool": "The build tool used (vite, webpack, next, rollup, etc.)",
            "complexity": 1-5,
            "example_type": "A short category name (console, components, themes, etc.)",
            "key_features": ["feature1", "feature2", "feature3"]
        }}
        
        Do not include any text before or after the JSON. Return ONLY the JSON object.
        Base your analysis on the actual content, not assumptions."""),
        ("human", """Analyze this example project:

README.md:
{readme_content}

package.json:
{package_json_content}

Project name: {project_name}

Return ONLY the JSON object, no other text."""),
    ])
    
    # Initialize LLM
    llm = ChatOpenAI(model=LLM_MODEL, temperature=LLM_TEMPERATURE)
    
    # Get analysis
    response = llm.invoke(prompt.format_messages(
        readme_content=readme_content or "No README found",
        package_json_content=package_json_content or "No package.json found",
        project_name=example_path.name
    ))
    
    # Parse JSON response
    if not response.content.strip():
        raise ValueError(f"LLM returned empty response for {example_path}")
    
    try:
        analysis = json.loads(response.content)
    except json.JSONDecodeError as e:
        LOG.error(f"Failed to parse LLM response for {example_path}: {response.content}")
        raise ValueError(f"LLM returned invalid JSON for {example_path}: {e}")
    
    return {
        "description": analysis.get("description", ""),
        "framework": analysis.get("framework", "unknown"),
        "build_tool": analysis.get("build_tool", "unknown"),
        "complexity": analysis.get("complexity", 1),
        "example_type": analysis.get("example_type", ""),
        "key_features": analysis.get("key_features", [])
    }


def process_example_project(example_path: Path, project_root: Path) -> List[Document]:
    """Process an example project with enhanced metadata"""
    docs: List[Document] = []
    
    if not example_path.exists():
        LOG.warning(f"Example path does not exist: {example_path}")
        return docs
    
    # Extract metadata using LLM analysis
    LOG.info(f"Analyzing example {example_path.name} with LLM...")
    analysis = analyze_example_with_llm(example_path)
    
    # Enhanced metadata
    base_metadata = {
        "kind": "example",
        "example_type": analysis.get("example_type", ""),
        "build_tool": analysis.get("build_tool", "unknown"),
        "framework": analysis.get("framework", "unknown"),
        "complexity": analysis.get("complexity", 1),
        "description": analysis.get("description", ""),
        "key_features": ", ".join(analysis.get("key_features", [])),  # Convert list to string
        "relpath": str(example_path.relative_to(project_root)),
        "ext": ".example",
        "component": "none",
    }
    
    # Store analysis for use in file processing
    example_type = analysis.get("example_type", "")
    
    # Process key files using include extensions
    files_to_process = [
        "package.json",
        "README.md",
        "*.config.*",
    ]
    
    # Add patterns for all included extensions
    for ext in DEFAULT_INCLUDE_EXTS:
        if ext == ".json":
            continue  # Already handled by package.json above
        files_to_process.extend([
            f"src/**/*{ext}",
            f"*{ext}",
        ])
    
    for pattern in files_to_process:
        for file_path in example_path.glob(pattern):
            if file_path.is_file() and not file_path.name.startswith('.'):
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    if content.strip():  # Only process non-empty files
                        # Create metadata for this file
                        file_metadata = base_metadata.copy()
                        file_metadata.update({
                            "relpath": str(file_path.relative_to(project_root)),
                            "ext": file_path.suffix,
                            "filename": file_path.name,
                            "file_type": get_file_type(file_path),
                        })
                        
                        # Add file-specific metadata
                        if file_path.name == "package.json":
                            file_metadata["file_type"] = "dependencies"
                            file_metadata["description"] = f"Dependencies and scripts for {example_type} example"
                        elif file_path.suffix in ['.tsx', '.ts', '.jsx', '.js']:
                            file_metadata["file_type"] = "implementation"
                            file_metadata["description"] = f"Implementation code for {example_type} example"
                        elif file_path.suffix in ['.css', '.scss', '.sass']:
                            file_metadata["file_type"] = "stylesheet"
                            file_metadata["description"] = f"Styling and CSS for {example_type} example"
                        elif file_path.suffix in ['.md', '.mdx']:
                            file_metadata["file_type"] = "documentation"
                            file_metadata["description"] = f"Documentation for {example_type} example"
                        elif file_path.suffix == '.html':
                            file_metadata["file_type"] = "html"
                            file_metadata["description"] = f"HTML template for {example_type} example"
                        elif file_path.name.endswith('.config.') or file_path.suffix == '.json':
                            file_metadata["file_type"] = "configuration"
                            file_metadata["description"] = f"Build configuration for {example_type} example"
                        
                        doc = Document(
                            page_content=content,
                            metadata=file_metadata
                        )
                        docs.append(doc)
                        
                except Exception as e:
                    LOG.warning(f"Failed to process {file_path}: {e}")
    
    LOG.info(f"Processed example {example_path.name}: {len(docs)} documents")
    return docs


def get_file_type(file_path: Path) -> str:
    """Determine the type of file for better categorization"""
    name = file_path.name.lower()
    suffix = file_path.suffix.lower()
    
    if name == "package.json":
        return "dependencies"
    elif name.endswith('.config.'):
        return "configuration"
    elif suffix in ['.tsx', '.jsx']:
        return "react_component"
    elif suffix in ['.ts', '.js']:
        return "typescript"
    elif suffix in ['.css', '.scss', '.sass']:
        return "stylesheet"
    elif suffix == '.md' or suffix == '.mdx':
        return "documentation"
    elif suffix == '.html':
        return "html"
    elif suffix == '.json':
        return "configuration"
    else:
        return "other"


def build_example_documents(example_paths: List[Path], project_root: Path) -> List[Document]:
    """Build documents from multiple example projects"""
    all_docs: List[Document] = []
    
    for example_path in example_paths:
        if example_path.exists() and example_path.is_dir():
            docs = process_example_project(example_path, project_root)
            all_docs.extend(docs)
        else:
            LOG.warning(f"Example path not found or not a directory: {example_path}")
    
    LOG.info(f"Total example documents: {len(all_docs)}")
    return all_docs
