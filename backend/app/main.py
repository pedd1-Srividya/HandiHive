"""FastAPI entry point. Run: uvicorn app.main:app --reload"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import Base, engine, SessionLocal
from . import models  # noqa: F401  (registers tables)
from .seed import seed
from .routes import products, creators, materials, orders, ai

Base.metadata.create_all(bind=engine)
with SessionLocal() as db:
    seed(db)

app = FastAPI(title="HandiHive API", version="1.0.0")
origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",") if o.strip()]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_methods=["*"], allow_headers=["*"])
for r in (products, creators, materials, orders, ai):
    app.include_router(r.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
