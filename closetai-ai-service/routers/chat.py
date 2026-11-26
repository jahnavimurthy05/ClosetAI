from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
from services.llm_stylist import chat_with_stylist

router = APIRouter()


class ChatMessage(BaseModel):
    role: str  # "user" or "model"
    parts: Optional[List[str]] = None
    content: Optional[str] = None


class ChatRequest(BaseModel):
    message: str
    wardrobe_items: Optional[List[Dict]] = None
    wardrobe_summary: Optional[Any] = None
    user_profile: Optional[Dict] = {}
    conversation_history: Optional[List[ChatMessage]] = []


@router.post("/message")
@router.post("/stylist")
async def send_message(request: ChatRequest):
    """
    Send a message to the ClosetAI stylist and receive a fashion-aware response.
    Supports both /chat/message and /chat/stylist.
    """
    # Build wardrobe summary from either wardrobe_items or wardrobe_summary
    items = request.wardrobe_items
    if items is None and isinstance(request.wardrobe_summary, list):
        items = request.wardrobe_summary

    if isinstance(request.wardrobe_summary, str) and not items:
        wardrobe_summary = request.wardrobe_summary
    else:
        wardrobe_summary = _build_wardrobe_summary(items or [])

    profile_summary = _build_profile_summary(request.user_profile or {})

    history = []
    for m in request.conversation_history or []:
        parts = m.parts if m.parts is not None else ([m.content] if m.content else [])
        role = "model" if m.role == "assistant" else m.role
        if parts:
            history.append({"role": role, "parts": parts})

    response = await chat_with_stylist(
        message=request.message,
        wardrobe_summary=wardrobe_summary,
        user_profile_summary=profile_summary,
        conversation_history=history,
    )

    return {
        "response": response,
        "reply": response,
        "role": "model",
        "suggested_items": [],
    }


def _build_wardrobe_summary(items: List[Dict]) -> str:
    if not items:
        return "The user's wardrobe is currently empty."

    by_category: Dict[str, List[str]] = {}
    for item in items:
        cat = item.get("category", "other")
        if cat not in by_category:
            by_category[cat] = []
        name = item.get("name") or item.get("subcategory") or "item"
        colour = item.get("primary_colour", "")
        by_category[cat].append(f"{colour} {name}".strip())

    lines = ["The user owns the following wardrobe items:"]
    for category, item_list in by_category.items():
        lines.append(f"  {category.upper()}: {', '.join(item_list[:10])}")

    return "\n".join(lines)


def _build_profile_summary(profile: Dict) -> str:
    body = profile.get("body_profile") or profile
    colour = profile.get("colour_profile") or profile
    style = profile.get("style_preferences") or profile

    parts = []
    if body.get("body_shape"):
        parts.append(f"Body shape: {body['body_shape']}")
    if colour.get("skin_complexion"):
        parts.append(f"Skin complexion: {colour['skin_complexion']}")
    if colour.get("undertone"):
        parts.append(f"Undertone: {colour['undertone']}")
    if style.get("styles"):
        parts.append(f"Style preferences: {', '.join(style['styles'])}")
    if colour.get("favourite_colours"):
        parts.append(f"Favourite colours: {', '.join(colour['favourite_colours'])}")
    if colour.get("avoided_colours"):
        parts.append(f"Prefers to avoid: {', '.join(colour['avoided_colours'])}")
    return "\n".join(parts) if parts else "Profile not yet completed."
