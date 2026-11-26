from PIL import Image
import io
import json
import os
import logging
from typing import Dict, List
import google.generativeai as genai

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Clothing taxonomy
# ---------------------------------------------------------------------------

CLOTHING_CATEGORIES: Dict[str, List[str]] = {
    "tops": ["t-shirt", "shirt", "blouse", "crop top", "tank top", "sweater", "kurti", "top"],
    "bottoms": ["jeans", "trousers", "pants", "palazzo", "skirt", "shorts", "leggings"],
    "dresses": [
        "dress",
        "casual dress",
        "formal dress",
        "maxi dress",
        "party dress",
        "saree",
        "salwar suit",
    ],
    "footwear": ["sneakers", "heels", "flats", "sandals", "boots", "loafers", "shoes"],
    "accessories": [
        "handbag",
        "sling bag",
        "backpack",
        "earrings",
        "necklace",
        "bracelet",
        "ring",
        "watch",
        "belt",
        "scarf",
    ],
    "outerwear": ["blazer", "jacket", "cardigan", "coat"],
}

FORMALITY_MAP: Dict[str, str] = {
    "t-shirt": "casual",
    "jeans": "casual",
    "shorts": "casual",
    "shirt": "smart_casual",
    "trousers": "smart_casual",
    "blouse": "smart_casual",
    "blazer": "formal",
    "formal dress": "formal",
    "heels": "formal",
    "saree": "festive",
    "salwar suit": "festive",
    "party dress": "festive",
}

CLASSIFY_PROMPT = """Analyze this clothing/fashion item image and return ONLY valid JSON with these exact keys:
{
  "category": one of ["tops", "bottoms", "dresses", "footwear", "accessories", "outerwear"],
  "subcategory": specific item name (e.g. "t-shirt", "jeans", "saree", "kurti", "sneakers", "blazer", "handbag", "earrings"),
  "pattern": one of ["solid", "striped", "floral", "checks", "printed", "textured", "embroidered"],
  "fabric_appearance": e.g. "cotton", "denim", "silk", "linen", "knit", "leather", "synthetic", "chiffon",
  "formality": one of ["casual", "smart_casual", "formal", "festive"],
  "occasions": array from ["daily_wear", "casual_outing", "college", "office", "interview", "party", "birthday", "wedding", "family_function", "date", "travel", "dinner", "festive"],
  "style_tags": array from ["minimalist", "elegant", "casual", "smart_casual", "formal", "streetwear", "chic", "traditional", "feminine", "contemporary", "vintage", "sporty"],
  "seasons": array from ["spring", "summer", "autumn", "winter", "all"],
  "description": concise 1-sentence searchable description of the item,
  "confidence": number between 0.0 and 1.0
}
Return ONLY the JSON object, no markdown fences."""


async def classify_clothing(image_bytes: bytes) -> Dict:
    """Classify a clothing image using Gemini Vision and return structured metadata."""
    api_key = os.getenv("GEMINI_API_KEY", "")
    if not api_key:
        logger.warning("GEMINI_API_KEY not set; returning fallback classification.")
        return _fallback_classification()

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-flash-latest")
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        response = await model.generate_content_async(
            [CLASSIFY_PROMPT, img],
            generation_config={"temperature": 0.2, "max_output_tokens": 400},
        )
        raw = response.text.strip()
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1].rsplit("```", 1)[0].strip()

        data = json.loads(raw)
        category = data.get("category", "tops")
        if category not in CLOTHING_CATEGORIES:
            category = "tops"
        subcategory = data.get("subcategory", "top")
        formality = data.get("formality") or FORMALITY_MAP.get(subcategory, "casual")

        return {
            "category": category,
            "subcategory": subcategory,
            "pattern": data.get("pattern", "solid"),
            "fabric_appearance": data.get("fabric_appearance", "cotton"),
            "formality": formality,
            "occasions": data.get("occasions") or _infer_occasions(formality),
            "confidence": round(float(data.get("confidence", 0.85)), 3),
            "style_tags": data.get("style_tags") or [formality],
            "seasons": data.get("seasons") or ["all"],
            "description": data.get("description", f"{subcategory} ({formality})"),
        }
    except Exception as exc:
        logger.warning(f"Gemini Vision classification failed, using fallback: {exc}")
        return _fallback_classification()


def _infer_occasions(formality: str) -> List[str]:
    if formality == "casual":
        return ["daily_wear", "casual_outing", "college", "shopping"]
    if formality == "smart_casual":
        return ["office", "college", "casual_outing", "dinner"]
    if formality == "formal":
        return ["office", "interview", "dinner"]
    if formality == "festive":
        return ["party", "wedding", "family_function", "festive"]
    return ["daily_wear"]


def _fallback_classification() -> Dict:
    return {
        "category": "tops",
        "subcategory": "top",
        "pattern": "solid",
        "fabric_appearance": "cotton",
        "formality": "casual",
        "occasions": ["daily_wear"],
        "confidence": 0.3,
        "style_tags": ["casual"],
        "seasons": ["all"],
        "description": "Clothing item",
    }
