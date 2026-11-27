# HandiHive – Create. Connect. Grow.

**An AI-assisted marketplace connecting handmade creators, customers, and craft-material suppliers.**

HandiHive is a digital marketplace designed to help handmade creators showcase their work, connect with customers, manage custom orders, and access craft materials through one platform.

It supports handmade categories such as crochet, bracelets, jewellery, pipe-cleaner crafts, embroidery, painting, and personalized gifts.

## Live Application

- **Frontend:** https://handi-hive.vercel.app/
- **Backend API:** https://handihive.onrender.com
- **API Documentation:** https://handihive.onrender.com/docs
- **GitHub Repository:** https://github.com/pedd1-Srividya/HandiHive

## Problem Statement

Many handmade creators depend on scattered social-media platforms and direct messages to promote products and manage orders. This creates challenges such as:

- Difficulty showcasing handmade products and creator portfolios.
- Custom-order requests getting lost in conversations.
- Difficulty managing product listings and customer orders.
- Limited access to craft materials.
- Unclear pricing and product discovery.
- Difficulty tracking order progress.

Customers also face challenges discovering unique handmade products and communicating customization requirements.

## Proposed Solution

HandiHive brings handmade creators, customers, and craft-material suppliers together in one platform.

It provides a structured marketplace with product discovery, custom-order management, creator dashboards, material shopping, order tracking, and AI-assisted features.

## Key Features

### 1. Customer Features

- Customer registration, login, and profile management.
- Browse handmade products across categories.
- Search and filter products.
- View product details and creator profiles.
- Personalized product recommendations.
- Recently viewed products.
- Wishlist and shopping cart.
- Checkout and order history.
- Product reviews and ratings.
- Order tracking.
- Chat with creators.

### 2. Creator Features

- Creator registration and login.
- Creator dashboard and analytics.
- Manage creator profile and portfolio.
- Add, edit, and delete product listings.
- Manage customer orders.
- Accept or reject custom-order requests.
- Update order status.
- Access craft materials.
- AI-assisted product descriptions and captions.
- AI-based pricing suggestions.

### 3. Custom Handmade Orders

Customers can request personalized handmade products by providing design requirements.

Creators can review requests, accept or reject them, and update order progress.

### 4. Craft Materials Marketplace

- Browse craft materials.
- Search and filter materials.
- View material details.
- Add materials to cart.
- Place material orders.
- Manage material purchases.

### 5. AI-Powered Features

HandiHive integrates Google Gemini to provide AI-assisted functionality.

- **AI Product Description Generator:** Generates descriptions for handmade products.
- **AI Caption Generator:** Helps creators prepare product captions.
- **AI Price Recommendation:** Provides cost-based pricing suggestions and AI-generated explanations.
- **AI Custom Design Assistant:** Helps customers explore personalized handmade designs.
- **AI Image Search:** Analyzes uploaded product images to support product discovery.

AI features depend on the backend Gemini API configuration. Where applicable, fallback responses or cost-based recommendations may be used.

### 6. Virtual Jewellery Try-On

The virtual try-on feature uses MediaPipe hand landmark detection to help users preview jewellery, particularly bracelets, on a hand image.

Users can adjust the position, scale, and rotation of the jewellery preview.

## Technology Stack

### Frontend

- React 18
- Vite
- JavaScript
- Tailwind CSS
- Axios
- React Router
- Lucide React
- Recharts
- MediaPipe Tasks Vision
- Puter.js

### Backend

- Python
- FastAPI
- SQLAlchemy
- Pydantic
- SQLite
- HTTPX
- JWT authentication

### AI Integration

- Google Gemini 2.5 Flash
- Gemini Vision capabilities

### Deployment

- Frontend: Vercel
- Backend: Render
- Database: SQLite

## System Architecture

```text
Customer / Creator
        |
        v
React + Vite Frontend
        |
        | REST API / HTTPS
        v
FastAPI Backend
        |
        v
SQLAlchemy ORM
        |
        v
SQLite Database

FastAPI Backend
        |
        v
Google Gemini API
        |
        v
AI-powered Features
```

## Project Structure

```text
HandiHive/
|
|-- frontend/
|   |-- src/
|   |   |-- components/
|   |   |-- pages/
|   |   |-- services/
|   |   |-- assets/
|   |
|   |-- public/
|   |-- package.json
|
|-- backend/
|   |-- app/
|   |   |-- routes/
|   |   |-- services/
|   |   |-- main.py
|   |   |-- database.py
|   |   |-- models.py
|   |   |-- schemas.py
|   |   |-- seed.py
|   |
|   |-- requirements.txt
|
|-- README.md
|-- .gitignore
```

## Installation and Setup

### Requirements

- Node.js 18 or later
- Python 3.10 or later
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/pedd1-Srividya/HandiHive.git
cd HandiHive
```

### 2. Backend Setup

Open a terminal and run:

```powershell
cd backend

python -m venv venv

.\venv\Scripts\Activate.ps1

pip install -r requirements.txt
```

Create the environment file:

```powershell
Copy-Item .env.example .env
```

Configure the backend environment variables in `backend/.env`.

Start the backend:

```powershell
uvicorn app.main:app --reload
```

Backend API:

http://localhost:8000

Interactive API documentation:

http://localhost:8000/docs

### 3. Frontend Setup

Open another terminal from the project root:

```powershell
cd frontend

npm install
```

Create the frontend environment file:

```powershell
Copy-Item .env.example .env
```

Configure the API URL in `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000/api
```

Start the frontend:

```powershell
npm run dev
```

Open:

http://localhost:5173

## Environment Variables

### Backend

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Database connection |
| `CORS_ORIGINS` | Allowed frontend origins |
| `GEMINI_API_KEY` | Google Gemini API key |
| `GEMINI_MODEL` | Gemini model name |

The default Gemini model is `gemini-2.5-flash`.

### Frontend

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Backend API base URL ending in `/api` |

**Important:** Never commit `.env` files or API keys to GitHub.

## API Documentation

The backend exposes REST API endpoints for the marketplace.

Main API route groups include:

| Endpoint | Functionality |
|---|---|
| `/api/auth` | Authentication |
| `/api/products` | Product management |
| `/api/creators` | Creator profiles and statistics |
| `/api/orders` | Custom orders and order management |
| `/api/cart` | Shopping cart |
| `/api/materials` | Craft materials marketplace |
| `/api/material_orders` | Material orders |
| `/api/chat` | Customer and creator communication |
| `/api/reviews` | Product reviews |
| `/api/wishlist` | Wishlist management |
| `/api/tracking` | Order tracking |
| `/api/recommendations` | Product recommendations |
| `/api/ai` | AI-powered features |

Interactive API documentation:

https://handihive.onrender.com/docs

## Deployment

### Frontend – Vercel

The React frontend is deployed using Vercel.

Live application:

https://handi-hive.vercel.app/

### Backend – Render

The FastAPI backend is deployed using Render.

Backend:

https://handihive.onrender.com

API documentation:

https://handihive.onrender.com/docs

The frontend communicates with the backend through HTTPS REST APIs.

## Screenshots

### HandiHive Application

![HandiHive Screenshot 1](screenshots/Screenshot%202026-11-21%20192925.png)

![HandiHive Screenshot 2](screenshots/Screenshot%202026-11-21%20193237.png)

![HandiHive Screenshot 3](screenshots/Screenshot%202026-11-21%20193401.png)

![HandiHive Screenshot 4](screenshots/Screenshot%202026-11-21%20193442.png)

![HandiHive Screenshot 5](screenshots/Screenshot%202026-11-21%20193644.png)

![HandiHive Screenshot 6](screenshots/Screenshot%202026-11-21%20193700.png)

![HandiHive Screenshot 7](screenshots/Screenshot%202026-11-21%20193821.png)

## Demo Video

Watch the HandiHive project demonstration:

[▶ Watch HandiHive Advanced Prototype on YouTube](https://youtu.be/TurBDaNOUP4)

## Security and Configuration

- Keep API keys and credentials in environment variables.
- Do not commit `.env` files.
- Do not expose private credentials in screenshots or documentation.
- Configure allowed frontend origins through backend CORS settings.

## Future Enhancements

- Integrated online payment gateways.
- Courier and shipment integrations.
- More creator and supplier tools.
- Advanced AI-powered personalization.
- Improved virtual try-on capabilities.
- Mobile application.
- Expanded creator analytics and business insights.

## Project Vision

**HandiHive – Create. Connect. Grow.**

Our vision is to make handmade products easier to discover, help creators grow their businesses, and connect customers with unique handmade creations through technology.