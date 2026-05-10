from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.NoteBook import router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/Backend")

@app.get('/')
def get():
    return {"message" : "Hello"}