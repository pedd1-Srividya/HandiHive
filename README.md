# HandiHive – Create. Connect. Grow.

An AI-assisted marketplace where handmade creators, customers and craft-material suppliers meet.

## Overview
HandiHive covers crochet, bracelets, jewellery, pipe-cleaner crafts, embroidery, painting and personalized gifts. Customers browse products and request custom pieces; creators manage requests and listings; a materials marketplace supplies the craft inputs.

## Problem statement
Handmade creators sell through scattered social-media DMs: custom requests get lost, pricing is unclear, and materials are hard to source. Customers can't track what they ordered.

## Proposed solution
One platform with a catalogue, a structured custom-order form with status tracking, a creator dashboard, a materials shop and an AI helper that writes product descriptions.

## Features
- **Customer:** browse, search, filter by category, product details, creator profiles
- **Custom orders:** category, material, colour, size, quantity, budget, design notes, status tracking by email
- **Creator dashboard:** accept/reject requests, update status, add/edit/delete products, order statistics
- **Materials marketplace:** search and filter by category
- **AI assistant:** product-description generator (`POST /api/ai/describe`)

> **Honesty notes:** All creators, products, materials and prices are **demo seed data** (`backend/app/seed.py`). There is **no login/payment** in this MVP; the dashboard lets you pick a demo creator. Without an API key, the AI feature runs in **DEMO mode** (template text, labelled as such in the UI and API response; no AI call is made).

## Tech stack
React + Vite + Tailwind CSS + Axios + React Router + Lucide · FastAPI + SQLAlchemy + Pydantic · SQLite (switchable via `DATABASE_URL`) · Anthropic Messages API for AI.

## Architecture
`React app (Netlify)` → REST/JSON over HTTPS → `FastAPI (Render)` → `SQLAlchemy` → `SQLite / PostgreSQL`; FastAPI → `Anthropic API` (optional).

## Folder structure
```
handihive/
├── frontend/  (src/components, pages, services, assets)
├── backend/   (app/main.py, database.py, models.py, schemas.py, seed.py, routes/, services/)
├── screenshots/
├── README.md  .gitignore  LICENSE
```

## Installation
Requirements: Node.js 18+, Python 3.10+.

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # Windows: copy .env.example .env
uvicorn app.main:app --reload
```
API: http://localhost:8000 · Interactive docs: http://localhost:8000/docs

### Database
Nothing to do. On first start the SQLite file `handihive.db` is created and filled with demo data. Delete the file to reset. For PostgreSQL/MySQL set `DATABASE_URL` in `.env` and install the driver (e.g. `pip install psycopg2-binary`).

### Frontend (new terminal)
```bash
cd frontend
npm install
cp .env.example .env            # Windows: copy .env.example .env
npm run dev
```
Open http://localhost:5173

### Environment variables
| File | Variable | Purpose |
|---|---|---|
| backend/.env | `DATABASE_URL` | database connection |
| backend/.env | `CORS_ORIGINS` | comma-separated allowed frontend URLs |
| backend/.env | `ANTHROPIC_API_KEY` | enables real AI (leave empty for demo mode) |
| backend/.env | `ANTHROPIC_MODEL` | model name (default `claude-haiku-5-5`) |
| frontend/.env | `VITE_API_URL` | backend URL ending in `/api` |

### AI feature setup
Get a key from console.anthropic.com, put it in `backend/.env` as `ANTHROPIC_API_KEY=...`, restart the backend. The response field `mode` is `"ai"` for real generations and `"demo"` otherwise. Never commit `.env`.

## API endpoints
| Method | Path | Description |
|---|---|---|
| GET | /api/products?q=&category=&creator_id= | list/search/filter |
| GET/PUT/DELETE | /api/products/{id} | one product |
| POST | /api/products | add product |
| GET | /api/creators, /api/creators/{id} | creators |
| GET | /api/creators/{id}/stats | dashboard statistics |
| GET | /api/materials?q=&category= | materials |
| POST | /api/orders | submit custom order |
| GET | /api/orders?email= or ?creator_id= | list orders |
| PATCH | /api/orders/{id}/status | update status |
| POST | /api/ai/describe | AI description |
| GET | /api/health | health check |

## Screenshots
Add images to `screenshots/` and link them here, e.g. `![Shop](screenshots/shop.png)`.

## Demo video
_Link placeholder: add your video URL._

## Live deployment
_Link placeholder: add your Netlify URL and backend URL._

## Upload to GitHub
```bash
cd handihive
git init
git add .
git commit -m "HandiHive MVP"
git branch -M main
git remote add origin https://github.com/<your-username>/handihive.git
git push -u origin main
```
Check that `.env` and `*.db` do not appear in the repo.

## Deploy the backend (Render)
1. New → Web Service → connect the GitHub repo, **Root Directory** `backend`.
2. Build command `pip install -r requirements.txt`; start command `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
3. Add env vars: `CORS_ORIGINS` (your Netlify URL, no trailing slash), optionally `ANTHROPIC_API_KEY`.
4. Free-tier disk is temporary, so SQLite data resets on redeploy. For lasting data add a Render PostgreSQL database, set `DATABASE_URL` to it and add `psycopg2-binary` to `requirements.txt`.
5. Test `https://<your-service>.onrender.com/api/health`.

## Deploy the frontend (Netlify)
1. Add new site → Import from GitHub. Base directory `frontend`, build command `npm run build`, publish directory `frontend/dist`.
2. Environment variable `VITE_API_URL=https://<your-service>.onrender.com/api`.
3. Deploy. `public/_redirects` makes React Router links work on refresh.
4. Put the Netlify URL into the backend's `CORS_ORIGINS` and redeploy the backend.

## Submission checklist
- [ ] Repo public, no `.env`/keys/db committed
- [ ] README placeholders replaced (live link, video link)
- [ ] 4+ screenshots in `screenshots/`
- [ ] Live site and GitHub code are the same commit
- [ ] Tried: search, filter, custom order, accept an order, AI generation
- [ ] Demo video recorded

## Future enhancements
Login and roles, payments, image uploads, supplier accounts, reviews, AI price suggestions and captions, order messaging.
