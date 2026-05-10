"""
Vercel serverless entry point.
Imports the FastAPI app from Backend/ and mounts routes at /api.
"""

import sys
import os

# Add Backend directory to Python path so imports like `app.routes.*` resolve
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'Backend'))

from dotenv import load_dotenv

# Load .env from Backend directory for local testing
dotenv_path = os.path.join(os.path.dirname(__file__), '..', 'Backend', '.env')
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.NoteBook import router

app = FastAPI(title="Cortex API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all routes under /api prefix
app.include_router(router, prefix="/api")


@app.get("/api")
def health():
    return {"status": "ok"}
