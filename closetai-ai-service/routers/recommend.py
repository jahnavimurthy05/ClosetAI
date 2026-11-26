from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from services.outfit_scorer import generate_outfit_combinations

router = APIRouter()


class WardrobeItemInput(BaseModel):
    id: str
    category: str
    subcategory: Optional[str] = None
    primary_colour: Optional[str] = None
    secondary_colours: Optional[List[str]] = []
    pattern: Optional[str] = "solid"
    formality: Optional[str] = "casual"
    occasions: Optional[List[str]] = []
    style_tags: Optional[List[str]] = []
    seasons: Optional[List[str]] = ["all"]
    original_image_url: Optional[str] = None
    processed_image_url: Optional[str] = None
    name: Optional[str] = None


class RecommendRequest(BaseModel):
    wardrobe_items: List[WardrobeItemInput]
    occasion: str
    user_profile: Optional[Dict[str, Any]] = {}
    weather: Optional[Dict[str, Any]] = None
    top_n: Optional[int] = 5
    exclude_outfit_ids: Optional[List[str]] = []


@router.post("/outfits")
async def recommend_outfits(request: RecommendRequest):
    """
    Generate scored outfit recommendations from the user's wardrobe items
    for a specified occasion.
    """
    items_dict = [item.model_dump() for item in request.wardrobe_items]

    combinations = generate_outfit_combinations(
        wardrobe_items=items_dict,
        occasion=request.occasion,
        user_profile=request.user_profile or {},
        weather=request.weather,
        top_n=request.top_n,
    )

    return {
        "recommendations": combinations,
        "occasion": request.occasion,
        "total_items_considered": len(items_dict),
    }
