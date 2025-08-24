"""
Source code processing and AST-based component extraction
"""

from pathlib import Path
from typing import List, Dict, Set, Tuple

from langchain.schema import Document
from tree_sitter import Language, Parser, Query
import tree_sitter_typescript as ts_typescript
import tree_sitter_javascript as ts_javascript

from utils import LOG, extract_css_components, infer_components_from_text

# ----------------------------
# Tree-sitter Queries (extracted constants)
# ----------------------------
TS_TSX_QUERY = """
; Export declarations
(export_statement
  declaration: (function_declaration
    name: (identifier) @function.name))

(export_statement
  declaration: (class_declaration
    name: (type_identifier) @class.name))

(export_statement
  declaration: (lexical_declaration
    (variable_declarator
      name: (identifier) @const.name)))

; Named exports
(export_statement
  (export_clause
    (export_specifier
      name: (identifier) @export.name)))

; Default exports with identifier
(export_statement
  value: (identifier) @default.export)

; Interface exports
(export_statement
  declaration: (interface_declaration
    name: (type_identifier) @interface.name))

; Type alias exports  
(export_statement
  declaration: (type_alias_declaration
    name: (type_identifier) @type.name))

; Arrow function exports
(export_statement
  declaration: (lexical_declaration
    (variable_declarator
      name: (identifier) @arrow.name
      value: (arrow_function))))

; React FC pattern
(lexical_declaration
  (variable_declarator
    name: (identifier) @fc.name
    type: (type_annotation
      (type_identifier) @fc.type))
  (#eq? @fc.type "FC"))
"""

JS_JSX_QUERY = """
; Export declarations
(export_statement
  declaration: (function_declaration
    name: (identifier) @function.name))

(export_statement
  declaration: (class_declaration
    name: (identifier) @class.name))

(export_statement
  declaration: (lexical_declaration
    (variable_declarator
      name: (identifier) @const.name)))

; Named exports
(export_statement
  (export_clause
    (export_specifier
      name: (identifier) @export.name)))

; Default exports
(export_statement
  value: (identifier) @default.export)

; Arrow function exports
(export_statement
  declaration: (lexical_declaration
    (variable_declarator
      name: (identifier) @arrow.name
      value: (arrow_function))))
"""

ADDITIONAL_PATTERNS_QUERY = """
; React.memo pattern
(call_expression
  function: (member_expression
    object: (identifier) @react
    property: (property_identifier) @memo)
  arguments: (arguments
    (identifier) @memo.component))
(#eq? @react "React")
(#eq? @memo "memo")

; forwardRef pattern
(call_expression
  function: (identifier) @forwardRef
  arguments: (arguments
    (identifier) @ref.component))
(#eq? @forwardRef "forwardRef")

; Direct const Component = () => pattern
(lexical_declaration
  (variable_declarator
    name: (identifier) @direct.component
    value: (arrow_function)))
"""

# ----------------------------
# Tree-sitter Setup
# ----------------------------
def setup_parsers():
    """Initialize Tree-sitter parsers for TypeScript and JavaScript"""
    # Build languages
    TS_LANGUAGE = Language(ts_typescript.language_typescript())
    TSX_LANGUAGE = Language(ts_typescript.language_tsx())
    JS_LANGUAGE = Language(ts_javascript.language())
    JSX_LANGUAGE = Language(ts_javascript.language())
    
    parsers = {
        '.ts': Parser(TS_LANGUAGE),
        '.tsx': Parser(TSX_LANGUAGE),
        '.js': Parser(JS_LANGUAGE),
        '.jsx': Parser(JSX_LANGUAGE)
    }
    
    return parsers

# Initialize parsers globally
PARSERS = setup_parsers()

# ----------------------------
# AST-based component extraction
# ----------------------------
def extract_components_with_ast(text: str, file_ext: str) -> Set[str]:
    """Extract ALL exported names using Tree-sitter AST parsing (components, hooks, utilities, etc.)"""
    components = set()
    
    # Skip if not a supported file type
    if file_ext not in PARSERS:
        return components
    
    try:
        parser = PARSERS[file_ext]
        tree = parser.parse(bytes(text, "utf8"))
        
        # Select appropriate query and language
        if file_ext in ['.tsx', '.ts']:
            query_string = TS_TSX_QUERY
            query_lang = Language(ts_typescript.language_typescript() if file_ext == '.ts' else ts_typescript.language_tsx())
        else:
            query_string = JS_JSX_QUERY
            query_lang = Language(ts_javascript.language())
        
        # Execute main query
        query = Query(query_lang, query_string)
        captures = _execute_query_safely(query, tree.root_node)
        
        # Extract names from captures
        for node, capture_name in captures:
            name = node.text.decode('utf8')
            if name and name.isidentifier():
                components.add(name)
                LOG.debug(f"Found export via AST ({capture_name}): {name}")
        
        # Execute additional patterns query
        additional_query = Query(query_lang, ADDITIONAL_PATTERNS_QUERY)
        additional_captures = _execute_query_safely(additional_query, tree.root_node)
        
        for node, capture_name in additional_captures:
            if capture_name in ['memo.component', 'ref.component', 'direct.component']:
                name = node.text.decode('utf8')
                if name and name.isidentifier():
                    components.add(name)
                    LOG.debug(f"Found export via AST pattern ({capture_name}): {name}")
        
    except Exception as e:
        LOG.warning(f"AST parsing failed for {file_ext}, falling back to regex: {e}")
        return infer_components_from_text(text)
    
    return components

def _execute_query_safely(query: Query, root_node) -> List[Tuple]:
    """Safely execute tree-sitter query with fallback for different API versions"""
    try:
        return query.captures(root_node)
    except AttributeError:
        try:
            return query.execute(root_node)
        except AttributeError:
            LOG.debug("Tree-sitter API not compatible, skipping AST parsing")
            return []

# ----------------------------
# Enhanced component extraction with fallback
# ----------------------------
def infer_components_from_text_enhanced(text: str, file_path: Path) -> Set[str]:
    """
    Extract ALL exported names using AST parsing with regex fallback.
    This includes components, hooks (useXyz), utilities, constants, etc.
    """
    ext = file_path.suffix.lower()
    
    # Try AST extraction first for supported file types
    if ext in ['.ts', '.tsx', '.js', '.jsx']:
        components = extract_components_with_ast(text, ext)
        if components:
            LOG.debug(f"Found {len(components)} exports via AST in {file_path.name}: {components}")
            return components
    
    # CSS-specific parsing for CSS files
    if ext in ['.css', '.scss']:
        css_components = extract_css_components(text)
        if css_components:
            LOG.debug(f"Found {len(css_components)} CSS components in {file_path.name}: {css_components}")
            return css_components
    
    # Fall back to regex for unsupported files or if AST parsing found nothing
    return infer_components_from_text(text)

# ----------------------------
# Source code processing
# ----------------------------
def process_source_file(
    p: Path, 
    project_root: Path,
    component_counts: Dict[str, int], 
    component_files: Dict[str, Set[str]]
) -> List[Document]:
    """Process a single source code file and return Document instances"""
    docs = []
    
    try:
        text = p.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return docs

    ext = p.suffix.lower()
    if ext in {".md", ".mdx"}:
        return docs  # Skip documentation files in source processing

    # CODE: extract components using AST with regex fallback
    components = infer_components_from_text_enhanced(text, p)

    meta = {
        "path": str(p.resolve()),
        "relpath": str(p.relative_to(project_root)),
        "kind": "code",
        "ext": ext,
    }
    if components:
        comp_list = sorted(components)
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

    docs.append(Document(page_content=text, metadata=meta))
    return docs
