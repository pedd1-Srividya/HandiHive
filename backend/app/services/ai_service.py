
"""HandiHive AI product-description generator using Google Gemini."""
import base64
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

def generate_price_recommendation(d):
    # Calculate total production cost
    total_cost = (
        d.material_cost
        + d.labour_cost
        + d.other_cost
    )

    # Initial pricing rules
    minimum_price = round(total_cost * 1.10, 2)
    recommended_price = round(total_cost * 1.20, 2)

    estimated_profit = round(recommended_price - total_cost, 2)

    profit_margin = (
        round((estimated_profit / recommended_price) * 100, 2)
        if recommended_price > 0 else 0
    )

    explanation = (
        f"The recommended price of ₹{recommended_price:.2f} "
        f"covers your production cost of ₹{total_cost:.2f} "
        f"and provides an estimated profit of ₹{estimated_profit:.2f}. "
        "This includes a 20% markup on production cost."
    )

    key = os.getenv("GEMINI_API_KEY", "").strip()
    model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip()

    if not key:
        return {
            "total_cost": round(total_cost, 2),
            "minimum_price": minimum_price,
            "recommended_price": recommended_price,
            "estimated_profit": estimated_profit,
            "profit_margin": profit_margin,
            "explanation": explanation,
            "mode": "demo",
            "note": "Cost-based recommendation. Gemini API key is not configured."
        }

    prompt = f"""
You are a handmade business pricing assistant for HandiHive.

Product: {d.name}
Category: {d.category}
Material cost: ₹{d.material_cost}
Labour cost: ₹{d.labour_cost}
Other expenses: ₹{d.other_cost}
Time required: {d.hours_required} hours

The calculated total cost is ₹{total_cost}.
The minimum price is ₹{minimum_price}.
The recommended price is ₹{recommended_price}.

Explain in 2-3 simple sentences why the suggested price
is reasonable for this handmade product.

Do not invent market prices or change the calculated prices.
Return only the explanation.
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
                ]
            },
            timeout=60
        )

        response.raise_for_status()

        result = response.json()
        generated_explanation = (
            result["candidates"][0]["content"]["parts"][0]["text"].strip()
        )

        if generated_explanation:
            explanation = generated_explanation

        return {
            "total_cost": round(total_cost, 2),
            "minimum_price": minimum_price,
            "recommended_price": recommended_price,
            "estimated_profit": estimated_profit,
            "profit_margin": profit_margin,
            "explanation": explanation,
            "mode": "ai",
            "note": f"Pricing explanation generated using Google Gemini ({model})."
        }

    except Exception as exc:
        print("Gemini price recommendation error:", str(exc))

        return {
            "total_cost": round(total_cost, 2),
            "minimum_price": minimum_price,
            "recommended_price": recommended_price,
            "estimated_profit": estimated_profit,
            "profit_margin": profit_margin,
            "explanation": explanation,
            "mode": "demo",
            "note": f"Using cost-based pricing. Gemini error: {type(exc).__name__}."
        }


def analyze_product_image(image_bytes: bytes, mime_type: str):
    """Analyze an uploaded handmade-product image using Gemini Vision."""

    key = os.getenv("GEMINI_API_KEY", "").strip()
    model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip()

    if not key:
        raise RuntimeError("GEMINI_API_KEY is not configured.")

    prompt = """
You are an AI visual search assistant for HandiHive,
a marketplace for handmade products.

Analyze the uploaded image and identify the visible product.

Return ONLY valid JSON in this exact format:
{
  "product_type": "specific product name or type",
  "category": "broad handmade product category",
  "colours": ["colour1", "colour2"],
  "materials": ["likely material1", "likely material2"],
  "visual_features": ["visible feature1", "visible feature2"],
  "search_terms": ["keyword1", "keyword2", "keyword3"]
}

Instructions:
- Support all handmade categories, not only crochet.
- Describe only what is visibly identifiable.
- If a material cannot be identified confidently, use an empty list.
- Do not invent a brand, price, seller, or product details.
- Use short, useful search keywords.
"""

    image_data = base64.b64encode(image_bytes).decode("utf-8")

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
                        {"text": prompt},
                        {
                            "inline_data": {
                                "mime_type": mime_type,
                                "data": image_data
                            }
                        }
                    ]
                }
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

    analysis = json.loads(content)

    required_fields = [
        "product_type",
        "category",
        "colours",
        "materials",
        "visual_features",
        "search_terms"
    ]

    if not all(field in analysis for field in required_fields):
        raise ValueError("Gemini returned incomplete image analysis.")

    return analysis


def generate_custom_design(d):
    """Generate a structured handmade-product design using Gemini."""

    key = os.getenv("GEMINI_API_KEY", "").strip()
    model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip()

    prompt = f"""
You are HandiHive's expert AI Custom Design Assistant.

Help customers create personalized handmade products.

Customer's idea: {d.idea}
Preferred category: {d.category or "Choose based on the idea"}
Preferred material: {d.preferred_material or "Suggest suitable materials"}
Preferred colour: {d.preferred_colour or "Suggest suitable colours"}
Budget in INR: {d.budget if d.budget > 0 else "Not specified"}

Support ALL handmade categories:
crochet, jewellery, bracelets, embroidery, pipe-cleaner crafts,
personalized gifts, home decor, accessories and other handmade crafts.

Return ONLY valid JSON in this exact format:
{{
    "product_name": "Short product name",
    "category": "Product category",
    "materials": ["material 1", "material 2"],
    "colours": ["colour 1", "colour 2"],
    "size": "Suggested size or To be discussed",
    "style": "Design style",
    "design_description": "Detailed description of the proposed handmade design",
    "customization_suggestions": [
        "Suggestion 1",
        "Suggestion 2",
        "Suggestion 3"
    ],
    "requirements": "Complete instructions for the handmade creator"
}}

Rules:
1. Preserve the customer's original idea.
2. Do not change explicitly requested colours or materials.
3. Suggest realistic handmade materials and techniques.
4. Do not invent prices or guarantee the design is possible.
5. Keep suggestions practical and easy to understand.
6. If the budget is specified, consider it when suggesting materials.
7. Return valid JSON only.
"""

    def demo_result():
        return {
            "product_name": "Personalized Handmade Creation",
            "category": d.category or "Handmade Crafts",
            "materials": [d.preferred_material] if d.preferred_material else ["Suitable handmade materials"],
            "colours": [d.preferred_colour] if d.preferred_colour else ["Custom colours"],
            "size": "To be discussed",
            "style": "Personalized",
            "design_description": d.idea,
            "customization_suggestions": [
                "Choose your preferred size.",
                "Confirm the final colour combination.",
                "Discuss material availability with the creator."
            ],
            "requirements": d.idea,
            "mode": "demo",
            "note": "Gemini API key is missing or AI generation failed."
        }

    if not key:
        return demo_result()

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

        required_fields = [
            "product_name",
            "category",
            "materials",
            "colours",
            "size",
            "style",
            "design_description",
            "customization_suggestions",
            "requirements"
        ]

        if not all(field in generated for field in required_fields):
            raise ValueError("Gemini returned incomplete design data.")

        if not isinstance(generated["materials"], list):
            raise ValueError("Materials must be a list.")

        if not isinstance(generated["colours"], list):
            raise ValueError("Colours must be a list.")

        if not isinstance(generated["customization_suggestions"], list):
            raise ValueError("Suggestions must be a list.")

        return {
            **generated,
            "mode": "ai",
            "note": f"Design generated using Google Gemini ({model})."
        }

    except Exception as exc:
        print("Gemini custom design error:", str(exc))
        return demo_result()

