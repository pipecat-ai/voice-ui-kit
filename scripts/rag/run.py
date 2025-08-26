# /// script
# requires-python = ">=3.11"
# dependencies = [
#   "chromadb",
#   "langchain",
#   "langchain-openai",
#   "langchain-chroma",
#   "pathspec",
#   "python-frontmatter",
#   "tree-sitter",
#   "tree-sitter-typescript",
#   "tree-sitter-javascript",
#   "tiktoken",
#   "lark"
# ]
# ///

import time
import argparse
from pathlib import Path
from typing import List, Dict, Set

from langchain.schema import Document
from langchain.text_splitter import TextSplitter
from langchain_openai import OpenAIEmbeddings

from utils import LOG, load_gitignore, iter_files
from config import (
    DEFAULT_INCLUDE_EXTS, DEFAULT_EXCLUDE_DIRS, DEFAULT_EXCLUDE_EXTS,
    SRC_EXCLUDE_DIRS, DEFAULT_DB_DIR, DEFAULT_CHUNK_CHARS, DEFAULT_CHUNK_OVERLAP,
    TS_CHUNK_CHARS, TS_CHUNK_OVERLAP, DOCS_CHUNK_CHARS, DOCS_CHUNK_OVERLAP,
    EXAMPLE_CHUNK_CHARS, EXAMPLE_CHUNK_OVERLAP,
    EMBEDDING_MODEL, TOP_COMPONENT_COUNT, CONTENT_PREVIEW_LENGTH,
    PROPS_FILE_PATTERNS, INTERFACE_CONTENT_PATTERNS
)
from docs import process_documentation_file
from source import process_source_file
from examples import process_example_project
from db import create_database


# ----------------------------
# Line-aware splitter (for citations)
# ----------------------------
class LineAwareSplitter(TextSplitter):
    def __init__(self, chunk_size=DEFAULT_CHUNK_CHARS, chunk_overlap=DEFAULT_CHUNK_OVERLAP):
        super().__init__(chunk_size=chunk_size, chunk_overlap=chunk_overlap)

    def split_text(self, text: str) -> List[str]:
        raise NotImplementedError("Use split_documents().")

    def split_documents(self, docs: List[Document]) -> List[Document]:
        out: List[Document] = []
        for d in docs:
            content: str = d.page_content
            lines = content.splitlines()
            current: List[str] = []
            current_len = 0
            start_line_idx = 0
            i = 0
            while i < len(lines):
                line = lines[i]
                extra = len(line) + 1
                if current_len + extra > self._chunk_size and current:
                    chunk_text = "\n".join(current).rstrip()
                    end_line_idx = start_line_idx + len(current) - 1
                    meta = dict(d.metadata)
                    meta["start_line"] = meta.get("start_line", start_line_idx + 1)
                    meta["end_line"] = meta.get("end_line", end_line_idx + 1)
                    out.append(Document(page_content=chunk_text, metadata=meta))
                    # overlap by line-length approximation
                    overlap_lines = []
                    remaining = self._chunk_overlap
                    j = len(current) - 1
                    while j >= 0 and remaining > 0:
                        l = current[j]
                        remaining -= (len(l) + 1)
                        overlap_lines.insert(0, l)
                        j -= 1
                    current = overlap_lines.copy()
                    current_len = sum(len(l) + 1 for l in current)
                    start_line_idx = i - len(current)
                else:
                    current.append(line)
                    current_len += extra
                    i += 1
            if current:
                chunk_text = "\n".join(current).rstrip()
                end_line_idx = start_line_idx + len(current) - 1
                meta = dict(d.metadata)
                meta["start_line"] = meta.get("start_line", start_line_idx + 1)
                meta["end_line"] = meta.get("end_line", end_line_idx + 1)
                out.append(Document(page_content=chunk_text, metadata=meta))
        return out

# ----------------------------
# Plugin Registry for Document Processing
# ----------------------------
PROCESSORS = {
    "docs": process_documentation_file,
    "code": process_source_file,
    "examples": process_example_project,
    # Add new processors here:
    # "tests": process_test_file,
}

# ----------------------------
# Build Documents (code & docs), with auto component tagging
# ----------------------------
def build_documents(paths: List[Path], kind: str, project_root: Path,
                    component_counts: Dict[str, int], component_files: Dict[str, Set[str]], 
                    docs_stats: Dict[str, int]) -> List[Document]:
    """Build documents using modular processing functions"""
    docs: List[Document] = []
    
    # Get the appropriate processor for this kind
    processor = PROCESSORS.get(kind)
    if not processor:
        LOG.warning(f"No processor found for kind '{kind}', skipping files")
        return docs
    
    for p in paths:
        try:
            if kind == "docs":
                # Documentation processors need docs_stats
                docs.extend(processor(p, project_root, component_counts, component_files, docs_stats))
            else:
                # Other processors don't need docs_stats
                docs.extend(processor(p, project_root, component_counts, component_files))
        except Exception as e:
            LOG.warning(f"Error processing {p}: {e}")
            continue
    
    return docs

# ----------------------------
# Document Summary (for dry runs)
# ----------------------------
def print_document_summary(chunks: List[Document], component_counts: Dict[str, int], 
                          component_files: Dict[str, Set[str]], docs_stats: Dict[str, int]):
    """Print detailed document information for dry runs"""
    print("\n" + "="*80)
    print("DRY RUN DOCUMENT SUMMARY")
    print("="*80)
    
    # Group chunks by file
    file_chunks: Dict[str, List[Document]] = {}
    for chunk in chunks:
        relpath = chunk.metadata.get("relpath", "unknown")
        file_chunks.setdefault(relpath, []).append(chunk)
    
    print(f"\n📁 FILES PROCESSED ({len(file_chunks)} files):")
    print("-" * 40)
    for relpath, chunk_list in sorted(file_chunks.items()):
        kind = chunk_list[0].metadata.get("kind", "")
        ext = chunk_list[0].metadata.get("ext", "")
        components = set()
        for chunk in chunk_list:
            comps = chunk.metadata.get("components", "")
            if isinstance(comps, str) and comps:
                components.update(comps.split(", "))
            elif isinstance(comps, (list, set)):
                components.update(comps)
        
        comp_str = f" [{', '.join(sorted(components))}]" if components else ""
        print(f"  {relpath} ({kind}{ext}){comp_str} - {len(chunk_list)} chunks")
    
    if docs_stats:
        print(f"\n📚 DOCS STATS:")
        print("-" * 40)
        print(f"  Pages: {docs_stats.get('pages', 0)}")
        print(f"  Sections: {docs_stats.get('sections', 0)}")
        print(f"  Titled pages: {docs_stats.get('titled_pages', 0)}")
        
        # Show docs pages
        docs_pages = {}
        for chunk in chunks:
            if chunk.metadata.get("kind") == "docs":
                relpath = chunk.metadata.get("relpath", "unknown")
                title = chunk.metadata.get("title", "")
                h1 = chunk.metadata.get("h1", "")
                h2 = chunk.metadata.get("h2", "")
                h3 = chunk.metadata.get("h3", "")
                
                # Get the best title for this page
                page_title = title or h1 or h2 or h3 or "Untitled"
                
                docs_pages.setdefault(relpath, {
                    "title": page_title,
                    "sections": 0,
                    "components": set()
                })["sections"] += 1
                
                # Add components found in this chunk
                comps = chunk.metadata.get("components", "")
                if isinstance(comps, str) and comps:
                    docs_pages[relpath]["components"].update(comps.split(", "))
                elif isinstance(comps, (list, set)):
                    docs_pages[relpath]["components"].update(comps)
        
        if docs_pages:
            print(f"\n📄 DOCS PAGES ({len(docs_pages)} pages):")
            print("-" * 40)
            for relpath, info in sorted(docs_pages.items()):
                comp_str = f" [{', '.join(sorted(info['components']))}]" if info['components'] else ""
                print(f"  {relpath} - {info['title']} ({info['sections']} sections){comp_str}")
    
    print(f"\n🔍 COMPONENT DETECTION:")
    print("-" * 40)
    if component_counts:
        for name, count in sorted(component_counts.items(), key=lambda kv: kv[1], reverse=True):
            files = component_files.get(name, set())
            file_list = ", ".join(sorted(files)) if files else "unknown"
            print(f"  {name} ({count} occurrences) - files: {file_list}")
    
    print(f"\n📊 CHUNK STATISTICS:")
    print("-" * 40)
    print(f"  Total chunks: {len(chunks)}")
    
    # Chunk size distribution
    sizes = [len(chunk.page_content) for chunk in chunks]
    if sizes:
        avg_size = sum(sizes) / len(sizes)
        min_size = min(sizes)
        max_size = max(sizes)
        print(f"  Average chunk size: {avg_size:.0f} chars")
        print(f"  Chunk size range: {min_size} - {max_size} chars")
    
    print("="*80 + "\n")

# ----------------------------
# Ingest
# ----------------------------
def ingest(repos: List[str], docs_dirs: List[str], db_dir: str,
           include_exts: set, exclude_dirs: set, exclude_exts: set,
           chunk_chars: int, chunk_overlap: int, verbose: bool, dry_run: bool = False):
    t0 = time.time()
    embedding = OpenAIEmbeddings(model=EMBEDDING_MODEL)
    splitter = LineAwareSplitter(chunk_size=chunk_chars, chunk_overlap=chunk_overlap)

    all_docs: List[Document] = []
    component_counts: Dict[str, int] = {}
    component_files: Dict[str, Set[str]] = {}
    docs_stats: Dict[str, int] = {}

    total_included_files = 0
    total_skipped_files = 0

    def process_root(root_str: str, kind: str):
        nonlocal total_included_files, total_skipped_files
        root = Path(root_str).resolve()
        if not root.exists():
            LOG.warning(f"[{kind}] Root not found: {root}")
            return
        
        # For docs, only process the content subfolder
        if kind == "docs":
            content_root = root / "content"
            if not content_root.exists():
                LOG.warning(f"[{kind}] Content folder not found: {content_root}")
                return
            root = content_root
            LOG.info(f"[{kind}] Processing content folder: {root}")
        
        spec = load_gitignore(root, exclude_exts)
        # Use different exclusion lists for src vs docs
        exclude_dirs_to_use = SRC_EXCLUDE_DIRS if kind == "code" else exclude_dirs
        included, skipped = iter_files(root, include_exts, exclude_dirs_to_use, exclude_exts, spec)
        total_included_files += len(included)
        total_skipped_files += len(skipped)
        LOG.info(f"[{kind}] {root} → files included: {len(included)}, skipped: {len(skipped)}")
        docs = build_documents(included, kind, project_root=root,
                               component_counts=component_counts, component_files=component_files, docs_stats=docs_stats)
        all_docs.extend(docs)
        if verbose:
            LOG.debug(f"[{kind}] sample included: {included[:5]}")
            LOG.debug(f"[{kind}] sample skipped: {skipped[:5]}")

    for r in repos:
        process_root(r, "code")
    for d in docs_dirs:
        process_root(d, "docs")
    
    # Process examples if they exist
    examples_root = Path("./examples")
    if examples_root.exists():
        LOG.info(f"[examples] Processing examples folder: {examples_root}")
        example_docs = []
        for example_dir in examples_root.iterdir():
            if example_dir.is_dir() and not example_dir.name.startswith('.'):
                LOG.info(f"[examples] Processing example: {example_dir.name}")
                docs = process_example_project(example_dir, project_root=Path("."))
                example_docs.extend(docs)
        all_docs.extend(example_docs)
        LOG.info(f"[examples] Processed {len(example_docs)} example documents")

    LOG.info(f"Total source documents (pre-chunk): {len(all_docs)}")
    if component_counts:
        top = sorted(component_counts.items(), key=lambda kv: kv[1], reverse=True)[:TOP_COMPONENT_COUNT]
        LOG.info("Component tag counts (top):")
        for name, count in top:
            files = component_files.get(name, set())
            file_list = ", ".join(sorted(files)) if files else "unknown"
            LOG.info(f"  {name}({count}) - files: {file_list}")
    if docs_stats:
        LOG.info(f"Docs stats: pages={docs_stats.get('pages',0)}, sections={docs_stats.get('sections',0)}, titled_pages={docs_stats.get('titled_pages',0)}")

    # Apply different chunking strategies based on file type
    chunks = []
    for doc in all_docs:
        ext = doc.metadata.get("ext", "").lower()
        relpath = doc.metadata.get("relpath", "")
        kind = doc.metadata.get("kind", "")
        
        # Special handling for interface definition files - keep them as single chunks
        if any(pattern in relpath for pattern in PROPS_FILE_PATTERNS):
            # Keep interface files as single chunks to preserve complete definitions
            chunks.append(doc)
        # Use larger chunks for examples to keep complete implementations together
        elif kind == "example":
            example_splitter = LineAwareSplitter(chunk_size=EXAMPLE_CHUNK_CHARS, chunk_overlap=EXAMPLE_CHUNK_OVERLAP)
            example_chunks = example_splitter.split_documents([doc])
            chunks.extend(example_chunks)
        # Use larger chunks for documentation to keep complete examples
        elif kind == "docs" or ext in {".md", ".mdx"}:
            docs_splitter = LineAwareSplitter(chunk_size=DOCS_CHUNK_CHARS, chunk_overlap=DOCS_CHUNK_OVERLAP)
            docs_chunks = docs_splitter.split_documents([doc])
            chunks.extend(docs_chunks)
        # Use larger chunks for TypeScript files to keep interfaces together
        elif ext in {".ts", ".tsx"}:
            ts_splitter = LineAwareSplitter(chunk_size=TS_CHUNK_CHARS, chunk_overlap=TS_CHUNK_OVERLAP)
            ts_chunks = ts_splitter.split_documents([doc])
            chunks.extend(ts_chunks)
        else:
            # Use default chunking for other files
            default_chunks = splitter.split_documents([doc])
            chunks.extend(default_chunks)
    
    LOG.info(f"Chunked into {len(chunks)} segments")
    LOG.info(f"  - Default: ≈{chunk_chars} chars, overlap {chunk_overlap}")
    LOG.info(f"  - TypeScript: ≈{TS_CHUNK_CHARS} chars, overlap {TS_CHUNK_OVERLAP}")
    LOG.info(f"  - Documentation: ≈{DOCS_CHUNK_CHARS} chars, overlap {DOCS_CHUNK_OVERLAP}")
    LOG.info(f"  - Examples: ≈{EXAMPLE_CHUNK_CHARS} chars, overlap {EXAMPLE_CHUNK_OVERLAP}")

    if dry_run:
        LOG.info("DRY RUN: Skipping database writes")
        print_document_summary(chunks, component_counts, component_files, docs_stats)
        dt = time.time() - t0
        LOG.info(f"Dry run complete in {dt:.1f}s. No database created.")
        LOG.info(f"Files included total: {total_included_files}  |  skipped total: {total_skipped_files}")
        return

    # Use database abstraction
    database = create_database(db_dir=db_dir)
    database.add_documents(chunks)

    dt = time.time() - t0
    LOG.info(f"Ingest complete in {dt:.1f}s. DB: {db_dir}")
    LOG.info(f"Files included total: {total_included_files}  |  skipped total: {total_skipped_files}")



# ----------------------------
# CLI
# ----------------------------
def main():
    parser = argparse.ArgumentParser(description="RAG agent (LangChain + OpenAI + Chroma)")
    parser.add_argument("--repo", action="append", default=[], help="Path to a code root (repeatable). E.g. ../src")
    parser.add_argument("--docs", action="append", default=[], help="Path to a docs/examples root (repeatable).")
    parser.add_argument("--db", default=DEFAULT_DB_DIR, help="Chroma DB directory (default: ./.chroma)")
    parser.add_argument("--ingest", action="store_true", help="Index files into the vector DB")
    parser.add_argument("--ask", type=str, help="Ask a question")
    parser.add_argument("--include-exts", default=",".join(sorted(DEFAULT_INCLUDE_EXTS)),
                        help="Comma-separated file extensions to include")
    parser.add_argument("--exclude-dirs", default=",".join(sorted(DEFAULT_EXCLUDE_DIRS)),
                        help="Comma-separated directory names to exclude")
    parser.add_argument("--exclude-exts", default=",".join(sorted(DEFAULT_EXCLUDE_EXTS)),
                        help="Comma-separated file extensions to exclude")
    parser.add_argument("--chunk", type=int, default=DEFAULT_CHUNK_CHARS, help="Approx chars per chunk")
    parser.add_argument("--overlap", type=int, default=DEFAULT_CHUNK_OVERLAP, help="Chunk overlap (chars)")
    parser.add_argument("--verbose", action="store_true", help="Verbose logs")
    parser.add_argument("--dry-run", action="store_true", help="Dry run mode - no database writes or permanent changes")
    parser.add_argument("--debug-retrieval", action="store_true", help="Debug mode - show retrieved documents before LLM processing")
    parser.add_argument("--fast", action="store_true", help="Use fast similarity search instead of SelfQueryRetriever")
    args = parser.parse_args()

    if args.verbose:
        LOG.setLevel(logging.DEBUG)

    include_exts = {e if e.startswith(".") else f".{e}" for e in args.include_exts.split(",") if e.strip()}
    exclude_dirs = {d.strip() for d in args.exclude_dirs.split(",") if d.strip()}
    exclude_exts = {e if e.startswith(".") else f".{e}" for e in args.exclude_exts.split(",") if e.strip()}

    # Sensible defaults if user forgets paths
    if not args.repo and not args.docs:
        LOG.info("No paths provided; assuming --repo ./src and --docs ./docs if they exist.")
        if Path("./src").exists():
            args.repo = ["./src"]
        if Path("./docs").exists():
            args.docs = ["./docs"]

    if args.ingest:
        if args.dry_run:
            LOG.info("Starting dry run ingestion…")
        else:
            LOG.info("Starting ingestion…")
        ingest(
            repos=args.repo,
            docs_dirs=args.docs,
            db_dir=args.db,
            include_exts=include_exts,
            exclude_dirs=exclude_dirs,
            exclude_exts=exclude_exts,
            chunk_chars=args.chunk,
            chunk_overlap=args.overlap,
            verbose=args.verbose,
            dry_run=args.dry_run
        )

    if args.ask:
        if args.dry_run:
            LOG.error("Cannot ask questions in dry run mode - no database exists")
            return
        LOG.info(f"Asking: {args.ask}")
        
        # Use the new retrieve module
        from retrieve import query
        
        t0 = time.time()
        result = query(
            question=args.ask,
            db_dir=args.db,
            debug_retrieval=args.debug_retrieval,
            use_fast_search=args.fast
        )
        dt = time.time() - t0
        
        print("\n=== ANSWER ===\n")
        print(result["answer"])
        LOG.info(f"Answered in {dt:.2f}s using {result.get('method', 'unknown')} method")

if __name__ == "__main__":
    main()