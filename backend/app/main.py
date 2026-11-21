"""FastAPI entry point. Run: uvicorn app.main:app --reload"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .database import Base, engine, SessionLocal
from . import models  # noqa: F401  (registers tables)
from .seed import seed
from .routes import products, creators, materials, orders, ai, auth, portfolio, reviews, wishlist, cart, chat, material_orders, tracking, recommendations

Base.metadata.create_all(bind=engine)
with SessionLocal() as db:
    seed(db)

app = FastAPI(title="HandiHive API", version="1.0.0")
UPLOAD_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "uploads")
)

app.mount(
    "/uploads",
    StaticFiles(directory=UPLOAD_DIR),
    name="uploads"
)
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

# Also allow any additional origins configured in the environment.
extra_origins = os.getenv("CORS_ORIGINS", "")
origins.extend(
    origin.strip()
    for origin in extra_origins.split(",")
    if origin.strip()
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(set(origins)),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for r in (
    products,
    creators,
    materials,
    orders,
    ai,
    auth,
    portfolio,
    reviews,
    wishlist,
    cart,
    chat,
    material_orders,
    tracking,
    recommendations,
):
    app.include_router(r.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}