# ----------------------------
# File processing config
# ----------------------------
DEFAULT_INCLUDE_EXTS = {".ts", ".tsx", ".js", ".jsx", ".css", ".scss", ".sass", ".md", ".mdx", ".json", ".html"}
DEFAULT_EXCLUDE_DIRS = {".git", "node_modules", "dist", "build", ".next", "out", "__pycache__", ".turbo", ".cache"}
DEFAULT_EXCLUDE_EXTS = {".lock", ".log", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".map", ".stories"}

# Directories to exclude from src folder (extends default exclude dirs)
SRC_EXCLUDE_DIRS = DEFAULT_EXCLUDE_DIRS.copy()
SRC_EXCLUDE_DIRS.update(["icons", "images", "assets", "fonts", "static", "public"])

# ----------------------------
# Database config
# ----------------------------
DEFAULT_DB_DIR = ".chroma"

# ----------------------------
# Chunking config
# ----------------------------
DEFAULT_CHUNK_CHARS = 4000
DEFAULT_CHUNK_OVERLAP = 400
# Larger chunks for TypeScript files to keep interfaces together
TS_CHUNK_CHARS = 6000
TS_CHUNK_OVERLAP = 600
# Even larger chunks for documentation to keep complete examples
DOCS_CHUNK_CHARS = 8000
DOCS_CHUNK_OVERLAP = 800

# Example-specific chunking (keep complete examples together)
EXAMPLE_CHUNK_CHARS = 10000
EXAMPLE_CHUNK_OVERLAP = 1000

# ----------------------------
# Model config
# ----------------------------
# OpenAI models for different purposes
EMBEDDING_MODEL = "text-embedding-3-large"
LLM_MODEL = "gpt-4o-mini"
LLM_TEMPERATURE = 0

# Retriever config
RETRIEVER_K = 20

# Display configuration
TOP_COMPONENT_COUNT = 15
CONTENT_PREVIEW_LENGTH = 200
SELF_QUERY_VERBOSE = True

# File processing configuration
PROPS_FILE_PATTERNS = ["Props.ts", "Props.tsx"]
INTERFACE_CONTENT_PATTERNS = ["interface", "Props", "type", "export interface"]

# Default paths configuration
DEFAULT_REPO_PATHS = ["./src"]
DEFAULT_DOCS_PATHS = ["./docs"]

# ----------------------------
# Prompt config
# ----------------------------
SYSTEM_PROMPT = """You are the authoritative expert on the Voice UI Kit, a React component framework, and its examples.

CRITICAL: Base your answers ONLY on the retrieved documents provided. Do not use external knowledge about React or component frameworks.

Guidelines:
- For exhaustive listings (CSS custom properties, all prop names, variants): prefer code (kind=code). If code and docs disagree, trust code.
- When a component is named (e.g., Button), prefer chunks with metadata.component matching that name.
- For code generation and setup questions: prefer examples (kind=example) that match the user's requirements (build tool, framework, complexity).
- Be concise but complete. If unsure, say so and cite where to look.
- Always include citations as `relpath:start_line-end_line`. Provide multiple citations when needed.
- IMPORTANT: The package name is "@pipecat-ai/voice-ui-kit". Do NOT make up other package names.
- When providing import statements, use the exact package name "@pipecat-ai/voice-ui-kit".
- If you're unsure about an import path, cite the source file and let the user check the actual exports.

When asked about components, variants, props, or APIs:
- ONLY use information from the retrieved documents
- Do NOT make up or infer properties that are not explicitly shown
- If you cannot find complete information, say so and show what you can see
- NEVER invent properties that are not present in the retrieved content

When asked about setup, dependencies, or code generation:
- Use example projects (kind=example) to provide concrete, working code
- Reference package.json files for exact dependency versions
- Use README.md files for setup instructions
- Provide complete, copy-pasteable code examples from the examples
- If multiple examples exist, prefer the one that best matches the user's requirements
"""

HUMAN_PROMPT = """Question:\n{question}\n\nRetrieved documents:\n{sources}\n\nAnswer the question based ONLY on the retrieved documents above. If the documents don't contain the information needed, say so and cite what you can find."""
