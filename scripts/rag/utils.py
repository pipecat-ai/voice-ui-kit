"""
Global utilities for RAG processing
"""

import logging
import re
from pathlib import Path
from typing import List, Dict, Optional, Set

import pathspec
import frontmatter

# ----------------------------
# Logging
# ----------------------------
LOG = logging.getLogger("rag_agent")
handler = logging.StreamHandler()
fmt = logging.Formatter("[%(levelname)s] %(message)s")
handler.setFormatter(fmt)
LOG.addHandler(handler)
LOG.setLevel(logging.INFO)

# ----------------------------
# .gitignore
# ----------------------------
def load_gitignore(root: Path, exclude_exts: set = None) -> Optional[pathspec.PathSpec]:
    patterns = []
    
    # Load .gitignore if it exists
    gi = root / ".gitignore"
    if gi.exists():
        try:
            patterns.extend(gi.read_text().splitlines())
            LOG.debug(f"Loaded .gitignore from {gi}")
        except Exception as e:
            LOG.warning(f"Could not parse .gitignore at {gi}: {e}")
    
    # Add extension exclusions as patterns
    if exclude_exts:
        for ext in exclude_exts:
            if ext.startswith('.'):
                patterns.append(f"**/*{ext}*")
    
    # Exclude package.json files in subdirectories (but keep root package.json)
    patterns.append("**/package.json")
    patterns.append("!package.json")
    
    if patterns:
        try:
            spec = pathspec.PathSpec.from_lines("gitwildmatch", patterns)
            return spec
        except Exception as e:
            LOG.warning(f"Could not parse patterns: {e}")
    return None

def is_ignored(relpath: Path, spec: Optional[pathspec.PathSpec]) -> bool:
    if spec is None:
        return False
    return spec.match_file(str(relpath.as_posix()))

# ----------------------------
# File iteration with ignores
# ----------------------------
def iter_files(root: Path, include_exts: set, exclude_dirs: set, exclude_exts: set,
               spec: Optional[pathspec.PathSpec]) -> tuple[List[Path], List[Path]]:
    included: List[Path] = []
    skipped: List[Path] = []
    for p in root.rglob("*"):
        try:
            if not p.is_file():
                continue
            if any(part in exclude_dirs for part in p.parts):
                skipped.append(p); continue
            # Check file extensions
            ext = p.suffix.lower()
            if (include_exts and ext not in include_exts):
                skipped.append(p); continue
            rel = p.relative_to(root)
            if is_ignored(rel, spec):
                skipped.append(p); continue
            included.append(p)
        except Exception:
            skipped.append(p)
    return included, skipped

# ----------------------------
# Component extraction utilities
# ----------------------------
def extract_css_components(text: str) -> Set[str]:
    """Extract CSS custom properties, classes, and design tokens"""
    components = set()
    
    # CSS custom properties (design tokens)
    css_prop_pattern = r'--([a-zA-Z][a-zA-Z0-9-]*):'
    css_props = re.findall(css_prop_pattern, text)
    for prop in css_props:
        # Convert kebab-case to PascalCase for consistency
        pascal_case = ''.join(word.capitalize() for word in prop.split('-'))
        components.add(pascal_case)
    
    # CSS class selectors
    class_pattern = r'\.([a-zA-Z][a-zA-Z0-9-_]*)'
    classes = re.findall(class_pattern, text)
    for cls in classes:
        # Convert kebab-case to PascalCase
        pascal_case = ''.join(word.capitalize() for word in cls.split('-'))
        components.add(pascal_case)
    
    # CSS layer names
    layer_pattern = r'@layer\s+([a-zA-Z][a-zA-Z0-9-_]*)'
    layers = re.findall(layer_pattern, text)
    for layer in layers:
        pascal_case = ''.join(word.capitalize() for word in layer.split('-'))
        components.add(pascal_case)
    
    return components

def infer_components_from_text(text: str) -> Set[str]:
    """Extract component names from export statements using regex"""
    components = set()
    
    # Regex patterns for different export types
    patterns = [
        r'export\s+(?:default\s+)?(?:function|const|class)\s+([A-Z][A-Za-z0-9]*)\b',  # export function Component
        r'export\s+{\s*([A-Z][A-Za-z0-9]*)\s*}',  # export { Component }
        r'export\s+{\s*([A-Z][A-Za-z0-9]*)\s+as\s+[A-Za-z0-9]+\s*}',  # export { Component as Other }
        r'export\s+(?:default\s+)?(?:const|let|var)\s+([A-Z][A-Za-z0-9]*)\s*=',  # export const Component =
        r'export\s+interface\s+([A-Z][A-Za-z0-9]*)\b',  # export interface Component
        r'export\s+type\s+([A-Z][A-Za-z0-9]*)\b',  # export type Component
    ]
    
    for pattern in patterns:
        matches = re.findall(pattern, text, re.MULTILINE)
        for match in matches:
            if isinstance(match, tuple):
                # Handle groups in regex
                for group in match:
                    if re.match(r'^[A-Z][A-Za-z0-9]*$', group):
                        components.add(group)
            else:
                # Single match
                if re.match(r'^[A-Z][A-Za-z0-9]*$', match):
                    components.add(match)
    
    if components:
        LOG.debug(f"Found components via regex: {components}")
    return components
