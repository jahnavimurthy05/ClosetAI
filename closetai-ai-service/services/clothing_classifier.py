from PIL import Image
import io
import asyncio
import torch
import logging
from typing import Dict, List, Tuple

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

# ---------------------------------------------------------------------------
# Model singleton
# ---------------------------------------------------------------------------

_classifier = None


def _init_classifier():
    global _classifier
    try:
        from transformers import CLIPProcessor, CLIPModel

        _classifier = {
            "model": CLIPModel.from_pretrained("openai/clip-vit-base-patch32"),
            "processor": CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32"),
            "type": "clip",
        }
        logger.info("CLIP model loaded successfully.")
    except Exception as exc:
        logger.warning(f"CLIP model unavailable, using fallback classifier: {exc}")
        _classifier = {"type": "fallback"}


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


async def classify_clothing(image_bytes: bytes) -> Dict:
    """Classify a clothing image and return structured metadata."""
    global _classifier
    if _classifier is None:
        _init_classifier()

    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    if _classifier.get("type") == "clip":
        return await _classify_with_clip(img)
    return _fallback_classification()


# ---------------------------------------------------------------------------
# CLIP-based classification
# ---------------------------------------------------------------------------


async def _classify_with_clip(img: Image.Image) -> Dict:
    model = _classifier["model"]
    processor = _classifier["processor"]

    # Build candidate text prompts
    all_items: List[str] = []
    item_to_category: Dict[str, Tuple[str, str]] = {}
    for category, items in CLOTHING_CATEGORIES.items():
        for item in items:
            prompt = f"a photo of a {item}"
            all_items.append(prompt)
            item_to_category[prompt] = (category, item)

    loop = asyncio.get_event_loop()

    def _run_clip():
        inputs = processor(
            text=all_items, images=img, return_tensors="pt", padding=True, truncation=True
        )
        with torch.no_grad():
            outputs = model(**inputs)
        probs = outputs.logits_per_image.softmax(dim=1)
        best_idx = int(probs.argmax().item())
        best_prob = float(probs[0][best_idx].item())
        best_label = all_items[best_idx]
        return best_label, best_prob

    best_label, confidence = await loop.run_in_executor(None, _run_clip)
    category, subcategory = item_to_category[best_label]

    formality = FORMALITY_MAP.get(subcategory, "casual")
    occasions = _infer_occasions(category, subcategory, formality)

    return {
        "category": category,
        "subcategory": subcategory,
        "formality": formality,
        "occasions": occasions,
        "confidence": round(confidence, 3),
        "style_tags": _infer_style_tags(subcategory, formality),
        "seasons": _infer_seasons(subcategory),
    }


# ---------------------------------------------------------------------------
# Heuristic helpers
# ---------------------------------------------------------------------------


def _infer_occasions(category: str, subcategory: str, formality: str) -> List[str]:
    if formality == "casual":
        return ["daily_wear", "casual_outing", "college", "shopping"]
    elif formality == "smart_casual":
        return ["office", "college", "casual_outing", "dinner"]
    elif formality == "formal":
        return ["office", "interview", "dinner", "formal_event"]
    elif formality == "festive":
        return ["party", "wedding", "family_function", "festive"]
    return ["daily_wear"]


def _infer_style_tags(subcategory: str, formality: str) -> List[str]:
    tags: List[str] = []
    if formality == "casual":
        tags.extend(["casual", "relaxed"])
    elif formality == "formal":
        tags.extend(["formal", "professional"])
    elif formality == "festive":
        tags.extend(["festive", "ethnic"])
    return tags


def _infer_seasons(subcategory: str) -> List[str]:
    warm_items = {"shorts", "tank top", "crop top", "sandals", "flats"}
    cold_items = {"sweater", "coat", "jacket", "cardigan", "boots"}
    if subcategory in warm_items:
        return ["spring", "summer"]
    if subcategory in cold_items:
        return ["autumn", "winter"]
    return ["all"]


def _fallback_classification() -> Dict:
    return {
        "category": "tops",
        "subcategory": "top",
        "formality": "casual",
        "occasions": ["daily_wear"],
        "confidence": 0.3,
        "style_tags": ["casual"],
        "seasons": ["all"],
    }
