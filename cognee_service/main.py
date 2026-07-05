"""
Cognee memory microservice for The Butterfly Cut.

Wraps Cognee (Python-only) in a small FastAPI HTTP service so the Node/Express
game server can call it. Each suspect+case gets its own isolated Cognee
dataset, so memories never leak between suspects or between different cases.

Run with:  uvicorn main:app --port 8001 --reload
"""

import os
from contextlib import asynccontextmanager

import cognee
from dotenv import load_dotenv
from fastapi import FastAPI
from pydantic import BaseModel

load_dotenv()

# Cognee reads these from the environment on import:
#   LLM_PROVIDER=groq
#   LLM_MODEL=groq/llama-3.3-70b-versatile
#   LLM_API_KEY=<your groq key>
#   LLM_ENDPOINT=https://api.groq.com/openai/v1
#   EMBEDDING_PROVIDER=fastembed
#   EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
#   EMBEDDING_DIMENSIONS=384


class AddMemoryRequest(BaseModel):
    dataset_name: str
    text: str


class QueryMemoryRequest(BaseModel):
    dataset_name: str
    query: str


app = FastAPI(title="Cognee Memory Service")


@app.post("/memory/add")
async def add_memory(req: AddMemoryRequest):
    """Ingest a new exchange into a suspect's dataset and re-run cognify."""
    await cognee.add(req.text, dataset_name=req.dataset_name)
    await cognee.cognify(datasets=[req.dataset_name])
    return {"status": "ok"}


@app.post("/memory/query")
async def query_memory(req: QueryMemoryRequest):
    """Recall relevant past context for a suspect, given the current question."""
    try:
        results = await cognee.search(
            query_text=req.query,
            datasets=[req.dataset_name],
        )
        context = "\n".join(str(r) for r in results) if results else ""
    except Exception:
        # No memory yet for this suspect (first interrogation) - that's fine.
        context = ""
    return {"context": context}


@app.get("/health")
async def health():
    return {"status": "ok"}
