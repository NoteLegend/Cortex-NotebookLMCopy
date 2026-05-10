# Cortex

A local-first AI knowledge workspace. Upload any document, ask questions, get answers grounded in your actual content — not hallucinations.

Built this to understand how RAG actually works end-to-end, from chunking strategies to vector retrieval to prompt grounding. It's not a NotebookLM clone. It's a from-scratch implementation of the full pipeline.

**→ [Live Demo](https://notebook-llm-5a2d.vercel.app/)** · **[API](https://notebook-llm-theta.vercel.app/)**

---

## What it does

- Upload a PDF or paste raw text
- Content gets chunked, embedded, and stored in a vector database
- Ask natural language questions about the content
- Retrieval finds the most relevant chunks via similarity search
- LLM generates an answer strictly from retrieved context — no making stuff up
- Everything happens in a session — your data stays isolated

## How the RAG pipeline works

```
Document → Parse → Chunk → Embed → Store (ChromaDB)
                                         ↓
Question → Embed → Similarity Search → Top-K Chunks → LLM → Grounded Answer
```

### 1. Parse
PDFs are parsed with `pdfplumber`. Text files are read directly. The goal is clean, structured text extraction.

### 2. Chunk
Uses recursive character text splitting (`langchain_text_splitters`). This splits at natural boundaries — paragraphs, sentences — instead of cutting mid-word. Chunks overlap slightly so context at boundaries isn't lost.

### 3. Embed
Each chunk is converted into a dense vector using embedding models via `fastembed`. These vectors capture semantic meaning — similar ideas produce similar vectors.

### 4. Store
Vectors go into ChromaDB, a local vector database. It handles indexing and fast nearest-neighbor lookups. No external services needed.

### 5. Retrieve
When you ask a question, the query is embedded with the same model, then ChromaDB finds the top-K most similar chunks using cosine similarity.

### 6. Generate
Retrieved chunks are injected into a prompt template as context. The LLM is instructed to answer **only** from the provided context. If the context doesn't contain the answer, it says so.

---

## Tech stack

| Layer | Tech |
|-------|------|
| Frontend | React + TypeScript + Vite |
| UI | Custom dark workspace (vanilla CSS) |
| Icons | Lucide React |
| Backend | FastAPI (Python) |
| Vector DB | ChromaDB (local SQLite storage) |
| Embeddings | fastembed / HuggingFace |
| LLM | HuggingFace Hub API |
| Text processing | pdfplumber, langchain_text_splitters |

---

## Run it locally

### Backend

```bash
cd Backend
python -m venv myenv
source myenv/bin/activate  # Windows: myenv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in `Backend/` with your API keys (HuggingFace token, etc).

```bash
uvicorn main:app --reload
# → http://localhost:8000
```

### Frontend

```bash
cd Frontend
npm install
npm run dev
# → http://localhost:5173
```

---

## Project structure

```
├── Backend/
│   ├── app/
│   │   ├── models/       # Pydantic request models
│   │   ├── routes/       # FastAPI endpoints
│   │   └── services/     # RAG logic — LLM, VectorDB, prompts
│   ├── main.py           # App entry point + CORS setup
│   ├── requirements.txt
│   └── .env              # Your API keys (not committed)
│
└── Frontend/
    ├── src/
    │   ├── services/     # API client
    │   ├── App.tsx       # Main workspace component
    │   ├── App.css       # Component styles
    │   ├── index.css     # Design tokens + resets
    │   └── main.tsx      # React entry
    ├── index.html
    └── package.json
```

---

## API endpoints

| Method | Endpoint | What it does |
|--------|----------|-------------|
| `POST` | `/Backend/uploadDataThroughFile` | Upload a PDF/TXT file, returns session ID |
| `POST` | `/Backend/uploadDataThroughRawText` | Upload raw text, returns session ID |
| `POST` | `/Backend/query` | Send a question + session ID, get a grounded answer |
| `DELETE` | `/Backend/deleteSessionId` | Clean up a session |

---

## What I'd add next

- Stream LLM responses (SSE) instead of waiting for the full answer
- Return retrieved chunks alongside the response for transparency
- Multi-document sessions (upload several files, query across all of them)
- Persistent storage across sessions
- Better chunking strategies (semantic chunking, document-aware splitting)
- Proper auth and multi-user support

---

Built as a deep-dive into RAG architecture. The UI is a custom dark workspace inspired by Linear, Perplexity, and Notion AI — not a Bootstrap template.
