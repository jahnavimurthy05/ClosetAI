"""
Gemini-powered AI fashion stylist service.
"""

import google.generativeai as genai
import os
import logging
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)

# Configure the Gemini SDK with the API key from the environment.
# Key is loaded lazily at first call so .env is fully loaded by then.
_model = None


def _get_model():
    global _model
    if _model is None:
        api_key = os.getenv("GEMINI_API_KEY", "")
        if not api_key:
            logger.warning("GEMINI_API_KEY is not set – AI stylist responses will be degraded.")
        genai.configure(api_key=api_key)
        _model = genai.GenerativeModel("gemini-1.5-flash")
    return _model


# ---------------------------------------------------------------------------
# System prompt
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """You are ClosetAI, an expert personal fashion stylist AI with deep knowledge of:
- Fashion colour theory and coordination
- Body proportion dressing and flattery
- Occasion-appropriate styling
- Global fashion trends and timeless style principles
- Indian and Western fashion, ethnic wear, and contemporary fusion

You are helping a user manage their personal digital wardrobe and get outfit recommendations.

IMPORTANT RULES:
- Only recommend clothing items that are explicitly in the user's wardrobe (provided as context)
- Never claim an outfit is "universally flattering" or suggest certain body types must avoid certain styles
- Always explain WHY you're recommending specific combinations
- Be warm, encouraging, and empowering in tone
- Respect cultural preferences and personal style choices
- Keep responses concise but helpful (2-4 paragraphs max)
- Use specific item names from the wardrobe when making recommendations
"""


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


async def chat_with_stylist(
    message: str,
    wardrobe_summary: str,
    user_profile_summary: str,
    conversation_history: Optional[List[Dict]] = None,
) -> str:
    """
    Send a message to the Gemini stylist model with wardrobe and profile context.

    Args:
        message: The user's question or request.
        wardrobe_summary: Pre-formatted summary of the user's wardrobe.
        user_profile_summary: Pre-formatted summary of the user's style profile.
        conversation_history: List of previous turns as {"role": str, "parts": [str]}.

    Returns:
        The stylist's response as a plain string.
    """
    model = _get_model()

    context = (
        f"USER'S WARDROBE SUMMARY:\n{wardrobe_summary}\n\n"
        f"USER'S STYLE PROFILE:\n{user_profile_summary}"
    )

    history = conversation_history or []

    # Prepend system prompt as a user/model exchange so it always forms the
    # base of the conversation context.
    base_history = [
        {"role": "user", "parts": [SYSTEM_PROMPT]},
        {"role": "model", "parts": ["Understood. I'm ClosetAI, your personal fashion stylist. How can I help you today?"]},
    ]

    full_history = base_history + history

    try:
        chat = model.start_chat(history=full_history)
        full_message = f"{context}\n\nUser question: {message}"
        response = await chat.send_message_async(
            full_message,
            generation_config={"temperature": 0.7, "max_output_tokens": 800},
        )
        return response.text
    except Exception as exc:
        logger.error(f"Gemini API error: {exc}")
        return (
            "I'm having a moment – please try again shortly. "
            f"(Error: {type(exc).__name__})"
        )
