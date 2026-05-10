"""
Vercel serverless entry point.
"""

import sys
import os

sys.path.insert(
    0,
    os.path.join(os.path.dirname(__file__), "..", "Backend")
)

from dotenv import load_dotenv

dotenv_path = os.path.join(
    os.path.dirname(__file__),
    "..",
    "Backend",
    ".env"
)

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

# IMPORTANT:
# Do NOT prefix /api here
app.include_router(router)

@app.get("/")
def health():
    return {"status": "ok"}