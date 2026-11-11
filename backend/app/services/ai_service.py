
"""HandiHive AI product-description generator using Google Gemini."""
import json
import os
import httpx
from dotenv import load_dotenv

load_dotenv()

API_URL = "https://generativelanguage.googleapis.com/v1beta/models"


def _prompt(d) -> str:
    return (
        "You are a professional product copywriter for HandiHive, "
        "a handmade products marketplace.\n"
        "Write an attractive product description in 80-110 words.\n"
        "Use simple, warm English. Highlight handmade craftsmanship. "
        "Do not invent prices, shipping details, or product features.\n\n"
        f"Product: {d.name}\n"
        f"Category: {d.category}\n"
        f"Material: {d.material or 'not specified'}\n"
        f"Colour: {d.colour or 'not specified'}\n"
        f"Details: {d.details or 'none'}"
    )


def demo_description(d) -> str:
    text = f"Meet the {d.name}, a handmade {d.category.lower()} piece made with care."

    if d.material and d.colour:
        text += f" Crafted from {d.material.lower()} in a lovely {d.colour.lower()} shade."
    elif d.material:
        text += f" Crafted from {d.material.lower()}."
    elif d.colour:
        text += f" It comes in a lovely {d.colour.lower()} shade."

    if d.details:
        text += " " + d.details.strip().rstrip(".") + "."

    return text + " Every piece is one of a kind, so small variations are part of its charm."


def generate_description(d):
    key = os.getenv("GEMINI_API_KEY", "").strip()
    model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip()

    if not key:
        return {
            "description": demo_description(d),
            "mode": "demo",
            "note": "GEMINI_API_KEY was not found. Check your backend/.env file."
        }

    try:
        response = httpx.post(
            f"{API_URL}/{model}:generateContent",
            headers={
                "x-goog-api-key": key,
                "Content-Type": "application/json"
            },
            json={
                "contents": [
                    {
                        "parts": [
                            {"text": _prompt(d)}
                        ]
                    }
                ]
            },
            timeout=60
        )

        response.raise_for_status()

        result = response.json()

        description = result["candidates"][0]["content"]["parts"][0]["text"].strip()

        if not description:
            raise ValueError("Gemini returned an empty description.")

        return {
            "description": description,
            "mode": "ai",
            "note": f"Generated live using Google Gemini ({model})."
        }

    except Exception as exc:
        print("Gemini API error:", str(exc))

        return {
            "description": demo_description(d),
            "mode": "demo",
            "note": f"Gemini request failed: {type(exc).__name__}. Check the backend terminal."
        }

def generate_caption(d):
    key = os.getenv("GEMINI_API_KEY", "").strip()
    model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip()

    if not key:
        return {
            "caption": f"Handmade with love! Discover our beautiful {d.name}. Every creation has its own special charm.",
            "hashtags": ["#Handmade", "#HandiHive", "#HandmadeWithLove"],
            "promotional_text": f"Bring home your own {d.name} today!",
            "mode": "demo",
            "note": "Gemini API key not configured."
        }

    prompt = f"""
You are a creative social media marketing expert for HandiHive,
a handmade products marketplace.

Create social media content for this product:

Product: {d.name}
Category: {d.category}
Material: {d.material or "Not specified"}
Colour: {d.colour or "Not specified"}
Details: {d.details or "Not specified"}
Platform: {d.platform}
Tone: {d.tone}

Return ONLY valid JSON in this exact format:
{{
  "caption": "An attractive social media caption",
  "hashtags": ["#Handmade", "#HandiHive", "#Crafts"],
  "promotional_text": "A short promotional message"
}}

Requirements:
1. Write an engaging caption suitable for the selected platform.
2. Generate 8 to 12 relevant hashtags.
3. Include #HandiHive in the hashtags.
4. Make the promotional text short and attractive.
5. Use the selected tone.
6. Do not invent product features, prices or discounts.
7. Return valid JSON only.
"""

    try:
        response = httpx.post(
            f"{API_URL}/{model}:generateContent",
            headers={
                "x-goog-api-key": key,
                "Content-Type": "application/json"
            },
            json={
                "contents": [
                    {"parts": [{"text": prompt}]}
                ],
                "generationConfig": {
                    "responseMimeType": "application/json"
                }
            },
            timeout=60
        )

        response.raise_for_status()

        result = response.json()
        content = result["candidates"][0]["content"]["parts"][0]["text"]

        generated = json.loads(content)

        if not all(key in generated for key in [
            "caption", "hashtags", "promotional_text"
        ]):
            raise ValueError("Gemini returned incomplete caption data.")

        if not isinstance(generated["hashtags"], list):
            raise ValueError("Hashtags must be a list.")

        return {
            "caption": generated["caption"],
            "hashtags": generated["hashtags"],
            "promotional_text": generated["promotional_text"],
            "mode": "ai",
            "note": f"Generated using Google Gemini ({model})."
        }

    except Exception as exc:
        print("Gemini caption error:", str(exc))

        return {
            "caption": f"Handmade with love! Discover our beautiful {d.name}.",
            "hashtags": ["#Handmade", "#HandiHive", "#HandmadeWithLove"],
            "promotional_text": f"Explore our handmade {d.name} today!",
            "mode": "demo",
            "note": f"AI generation failed: {type(exc).__name__}."
        }

