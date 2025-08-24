"""
Documentation processing and chunking utilities
"""

from pathlib import Path
from typing import List, Dict, Set

from langchain.schema import Document
from langchain.text_splitter import MarkdownHeaderTextSplitter

from utils import LOG
from config import DOCS_CHUNK_CHARS, DOCS_CHUNK_OVERLAP

# ----------------------------
# Markdown page-by-page split
# ----------------------------
def split_markdown_by_headers(text: str) -> List[Document]:
    # Split by H1/H2/H3; each section is a Document with header metadata
    splitter = MarkdownHeaderTextSplitter(
        headers_to_split_on=[("#", "h1"), ("##", "h2"), ("###", "h3")]
    )
    return splitter.split_text(text)

# ----------------------------
# Documentation processing
# ----------------------------
def process_documentation_file(
    p: Path, 
    project_root: Path,
    component_counts: Dict[str, int], 
    component_files: Dict[str, Set[str]], 
    docs_stats: Dict[str, int]
) -> List[Document]:
    """Process a single documentation file and return Document instances"""
    docs = []
    
    try:
        text = p.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return docs

    ext = p.suffix.lower()
    if ext not in {".md", ".mdx"}:
        return docs

    # Extract frontmatter metadata if present
    frontmatter_title = None
    frontmatter_description = None
    frontmatter_component = None
    try:
        import frontmatter
        parsed = frontmatter.loads(text)
        frontmatter_title = parsed.get('title')
        frontmatter_description = parsed.get('description')
        frontmatter_component = parsed.get('component')
    except Exception:
        pass
    
    # For docs, only use frontmatter component (don't infer from headers)
    comps = set()
    if frontmatter_component and frontmatter_component is not True and frontmatter_component is not False:
        comps.add(frontmatter_component)
    
    # Metadata
    meta = {
        "path": str(p.resolve()),
        "relpath": str(p.relative_to(project_root)),
        "kind": "docs",
        "ext": ext,
        "title": frontmatter_title or "",
        "description": frontmatter_description or "",
        "h1": "",
        "h2": "",
        "h3": "",
    }
    if comps:
        comp_list = sorted(comps)
        # Use frontmatter component as primary if available (but not boolean values)
        if frontmatter_component and frontmatter_component is not True and frontmatter_component is not False:
            meta["component"] = frontmatter_component
            meta["components"] = ", ".join(comp_list)  # Convert list to string for ChromaDB
        else:
            meta["component"] = comp_list[0]
            meta["components"] = ", ".join(comp_list)  # Convert list to string for ChromaDB
        relpath = str(p.relative_to(project_root))
        for c in comp_list:
            # Skip boolean values and other non-component names
            if c is True or c is False or not isinstance(c, str):
                continue
            component_counts[c] = component_counts.get(c, 0) + 1
            component_files.setdefault(c, set()).add(relpath)
    else:
        # Ensure components field is always present
        meta["components"] = ""
    
    # Create a single document for the entire file - let our chunking logic handle it
    docs.append(Document(page_content=text, metadata=meta))
    
    # Stats
    docs_stats["pages"] = docs_stats.get("pages", 0) + 1
    docs_stats["sections"] = docs_stats.get("sections", 0) + 1
    if frontmatter_title:
        docs_stats["titled_pages"] = docs_stats.get("titled_pages", 0) + 1
    
    return docs
