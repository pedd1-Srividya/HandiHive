
import re

import httpx
from fastapi import (
    APIRouter,
    UploadFile,
    File,
    HTTPException,
    Depends
)
from sqlalchemy.orm import Session

from .. import schemas, models
from ..database import get_db
from ..services.ai_service import (
    generate_description,
    generate_caption,
    generate_price_recommendation,
    analyze_product_image,
    generate_custom_design
)

router = APIRouter(prefix="/api/ai", tags=["ai"])


# ---------------- PRODUCT DESCRIPTION ----------------

@router.post("/describe", response_model=schemas.DescribeResponse)
def describe(data: schemas.DescribeRequest):
    return generate_description(data)


# ---------------- SOCIAL MEDIA CAPTION ----------------

@router.post("/caption", response_model=schemas.CaptionResponse)
def caption(data: schemas.CaptionRequest):
    return generate_caption(data)


# ---------------- PRICE RECOMMENDATION ----------------

@router.post(
    "/price-recommendation",
    response_model=schemas.PriceRecommendationResponse
)
def price_recommendation(data: schemas.PriceRecommendationRequest):
    return generate_price_recommendation(data)


# ---------------- TEXT NORMALIZATION ----------------

def normalize_text(value):
    return re.sub(
        r"[^a-z0-9]+",
        " ",
        str(value or "").lower()
    ).strip()


# ---------------- CATEGORY GROUPS ----------------

CATEGORY_GROUPS = {
    "jewellery": {
        "jewellery",
        "jewelry",
        "bracelets",
        "bracelet",
        "earrings",
        "necklace",
        "necklaces",
        "rings"
    },

    "crochet": {
        "crochet",
        "crocheted",
        "amigurumi"
    },

    "festive decor": {
        "festive decor",
        "decoration",
        "decorations",
        "home decor",
        "wall hanging",
        "wall hangings"
    },

    "embroidery": {
        "embroidery",
        "embroidered"
    },

    "personalized gifts": {
        "personalized gifts",
        "personalised gifts",
        "gifts",
        "keychains",
        "keychain"
    },

    "pipe cleaner crafts": {
        "pipe cleaner",
        "pipe cleaners",
        "chenille stem crafts"
    }
}


def get_category_group(value):
    value = normalize_text(value)

    for group, aliases in CATEGORY_GROUPS.items():
        if value in aliases:
            return group

    return value


# ---------------- IMAGE PRODUCT MATCHING ----------------

def rank_product(product, analysis):

    name = normalize_text(product.name)
    category = normalize_text(product.category)
    description = normalize_text(product.description)
    material = normalize_text(product.material)
    colour = normalize_text(product.colour)

    product_text = f"{name} {category} {description}"

    score = 0
    reasons = []

    detected_category = normalize_text(
        analysis.get("category", "")
    )

    product_type = normalize_text(
        analysis.get("product_type", "")
    )

    detected_group = get_category_group(detected_category)
    product_group = get_category_group(category)

    # 1. Category matching

    same_category = (
        detected_group == product_group
        or detected_category == category
    )

    if same_category and detected_category:
        score += 10
        reasons.append("Same product category")

    elif detected_category:
        detected_words = set(detected_category.split())
        product_words = set(category.split())

        if detected_words & product_words:
            score += 5
            reasons.append("Related product category")
        else:
            score -= 4

    # 2. Product type matching

    product_type_words = {
        word
        for word in product_type.split()
        if len(word) > 2
    }

    name_words = set(name.split())

    if product_type_words:

        matched_type_words = product_type_words & name_words

        if matched_type_words == product_type_words:
            score += 12
            reasons.append("Exact product type match")

        elif matched_type_words:
            score += 6
            reasons.append("Similar product type")

    # 3. Search keyword matching

    for term in analysis.get("search_terms", []):

        term = normalize_text(term)

        if not term:
            continue

        if term in name:
            score += 6
            reasons.append("Matching product name")

        elif term in description:
            score += 2
            reasons.append("Matching product description")

    # 4. Material matching

    for detected_material in analysis.get("materials", []):

        material_term = normalize_text(detected_material)

        if material_term and (
            material_term in material
            or material_term in description
        ):
            score += 3
            reasons.append("Similar material")

    # 5. Colour matching

    for detected_colour in analysis.get("colours", []):

        colour_term = normalize_text(detected_colour)

        if colour_term and colour_term in colour:
            score += 2
            reasons.append("Similar colour")

    # 6. Visual feature matching

    product_words = set(product_text.split())

    for feature in analysis.get("visual_features", []):

        feature_words = {
            word
            for word in normalize_text(feature).split()
            if len(word) > 3
        }

        if feature_words & product_words:
            score += 1
            reasons.append("Similar visual features")

    return score, list(dict.fromkeys(reasons))


# ---------------- AI IMAGE SEARCH ----------------

@router.post("/image-search")
def image_search(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):

    allowed_types = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ]

    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Please upload a JPG, PNG, or WEBP image."
        )

    image_bytes = file.file.read(
        5 * 1024 * 1024 + 1
    )

    if not image_bytes:
        raise HTTPException(
            status_code=400,
            detail="The uploaded image is empty."
        )

    if len(image_bytes) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail="Image size must not exceed 5 MB."
        )

    try:

        analysis = analyze_product_image(
            image_bytes,
            file.content_type
        )

    except RuntimeError as exc:

        raise HTTPException(
            status_code=503,
            detail=str(exc)
        )

    except httpx.HTTPError:

        raise HTTPException(
            status_code=502,
            detail="Gemini image analysis failed. Check your API key and model."
        )

    except (ValueError, KeyError, IndexError):

        raise HTTPException(
            status_code=502,
            detail="Could not understand the uploaded image. Please try another image."
        )

    # Retrieve available products

    products = db.query(models.Product).all()

    ranked_products = []

    # Calculate similarity score for each product

    for product in products:

        score, reasons = rank_product(
            product,
            analysis
        )

        if score > 0:

            ranked_products.append({
                "product": schemas.ProductOut.model_validate(
                    product
                ).model_dump(),

                "score": score,

                "reason": ", ".join(
                    reasons[:3]
                ) or "Visually related product"
            })

    # Sort by highest similarity score

    ranked_products.sort(
        key=lambda item: item["score"],
        reverse=True
    )

    matches = ranked_products[:12]

    return {
        "analysis": analysis,
        "matches": matches,
        "total_matches": len(matches),
        "mode": "ai",
        "note": "Products ranked using category, product type, name, material, colour and visual similarity."
    }

# ---------------- AI CUSTOM DESIGN ASSISTANT ----------------

@router.post(
    "/custom-design",
    response_model=schemas.CustomDesignResponse
)
def custom_design(data: schemas.CustomDesignRequest):
    return generate_custom_design(data)
