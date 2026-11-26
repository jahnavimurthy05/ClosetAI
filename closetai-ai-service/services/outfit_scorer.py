"""
Outfit scoring engine – rates combinations of wardrobe items on colour
compatibility, formality consistency, occasion suitability, pattern harmony,
and accessory coordination.
"""

from typing import List, Dict, Any, Set

# ---------------------------------------------------------------------------
# Colour relationship data
# ---------------------------------------------------------------------------

COMPLEMENTARY_PAIRS: List[tuple] = [
    ("red", "green"),
    ("blue", "orange"),
    ("yellow", "purple"),
    ("navy", "coral"),
    ("teal", "coral"),
    ("olive", "purple"),
    ("maroon", "teal"),
    ("mustard", "blue"),
]

NEUTRAL_COLOURS: Set[str] = {"black", "white", "beige", "cream", "grey", "brown", "navy", "taupe"}

ANALOGOUS_GROUPS: List[Set[str]] = [
    {"blue", "navy", "teal", "purple"},
    {"red", "maroon", "coral", "orange"},
    {"green", "olive", "teal", "mint"},
    {"yellow", "orange", "mustard", "coral"},
    {"purple", "lavender", "pink", "maroon"},
]

# ---------------------------------------------------------------------------
# Formality & occasion data
# ---------------------------------------------------------------------------

FORMALITY_ORDER: List[str] = ["casual", "smart_casual", "formal", "festive"]

OCCASION_FORMALITY: Dict[str, List[str]] = {
    "college": ["casual", "smart_casual"],
    "office": ["smart_casual", "formal"],
    "interview": ["formal"],
    "casual_outing": ["casual"],
    "shopping": ["casual"],
    "party": ["smart_casual", "festive", "formal"],
    "birthday": ["smart_casual", "festive"],
    "wedding": ["festive", "formal"],
    "family_function": ["smart_casual", "festive"],
    "date": ["smart_casual", "formal"],
    "travel": ["casual"],
    "dinner": ["smart_casual", "formal"],
    "festive": ["festive"],
    "daily_wear": ["casual"],
}

# ---------------------------------------------------------------------------
# Scoring sub-functions
# ---------------------------------------------------------------------------


def _colour_compatibility_score(colour1: str, colour2: str) -> float:
    if not colour1 or not colour2:
        return 0.7
    if colour1 == colour2:
        return 0.7  # monochromatic – good but not perfect
    if colour1 in NEUTRAL_COLOURS or colour2 in NEUTRAL_COLOURS:
        return 1.0  # neutrals go with everything
    for pair in COMPLEMENTARY_PAIRS:
        if {colour1, colour2} == set(pair):
            return 0.95  # complementary – great
    for group in ANALOGOUS_GROUPS:
        if colour1 in group and colour2 in group:
            return 0.85  # analogous – very good
    return 0.5  # low default


def _formality_compatibility_score(items: List[Dict]) -> float:
    formalities = [item.get("formality", "casual") for item in items]
    if len(set(formalities)) == 1:
        return 1.0
    indices = [
        FORMALITY_ORDER.index(f) if f in FORMALITY_ORDER else 1 for f in formalities
    ]
    spread = max(indices) - min(indices)
    return max(0.0, 1.0 - spread * 0.3)


def _occasion_suitability_score(items: List[Dict], occasion: str) -> float:
    if not occasion or occasion not in OCCASION_FORMALITY:
        return 0.7
    target_formalities = set(OCCASION_FORMALITY[occasion])
    scores = []
    for item in items:
        formality = item.get("formality", "casual")
        item_occasions = item.get("occasions", [])
        if occasion in item_occasions:
            scores.append(1.0)
        elif formality in target_formalities:
            scores.append(0.8)
        else:
            scores.append(0.4)
    return sum(scores) / len(scores) if scores else 0.5


def _pattern_compatibility_score(items: List[Dict]) -> float:
    patterns = [item.get("pattern", "solid") for item in items]
    patterned = [p for p in patterns if p and p != "solid"]
    if len(patterned) == 0:
        return 0.9  # all solid: very clean
    if len(patterned) == 1:
        return 1.0  # one statement piece: ideal
    if len(patterned) == 2:
        return 0.5  # two patterns: risky
    return 0.3  # three+ patterns: usually too busy


def _accessory_coordination_score(outfit_items: List[Dict], profile: Dict) -> float:
    """Score accessory coordination based on metal preference and colour matching."""
    accessories = [i for i in outfit_items if i.get("category") == "accessories"]
    if not accessories:
        return 0.8  # neutral if no accessories

    score = 0.8

    # Check metal consistency
    metals_in_outfit: Set[str] = set()
    for acc in accessories:
        tags = acc.get("style_tags", [])
        for tag in tags:
            if tag in {"gold", "silver", "rose_gold"}:
                metals_in_outfit.add(tag)

    if len(metals_in_outfit) <= 1:
        score = min(1.0, score + 0.1)

    return score


# ---------------------------------------------------------------------------
# Explanation builder
# ---------------------------------------------------------------------------


def _build_explanation(scores: Dict, items: List[Dict], occasion: str, profile: Dict) -> Dict:
    explanations: Dict[str, str] = {}

    colour_score = scores.get("colour", 0)
    if colour_score >= 0.9:
        explanations["colour"] = (
            "These colours pair beautifully together – they complement each other on the colour wheel."
        )
    elif colour_score >= 0.7:
        explanations["colour"] = (
            "The colour combination works well, with a good balance of tones."
        )
    else:
        explanations["colour"] = (
            "The colours can work together – consider adding a neutral piece to tie the look together."
        )

    formality_score = scores.get("formality", 0)
    if formality_score >= 0.9:
        explanations["formality"] = "The formality levels of these pieces are perfectly matched."
    else:
        explanations["formality"] = (
            "The outfit mixes different formality levels – this can work for certain occasions with intentional styling."
        )

    if occasion:
        occ_score = scores.get("occasion", 0)
        occ_label = occasion.replace("_", " ")
        if occ_score >= 0.8:
            explanations["occasion"] = f"This outfit is well-suited for {occ_label}."
        else:
            explanations["occasion"] = (
                f"While not perfectly conventional for {occ_label}, this combination can work with the right styling."
            )

    return explanations


# ---------------------------------------------------------------------------
# Main scoring function
# ---------------------------------------------------------------------------


def score_outfit(
    outfit_items: List[Dict],
    occasion: str,
    user_profile: Dict,
    weather: Dict = None,
) -> Dict[str, Any]:
    """
    Score an outfit combination on multiple dimensions.

    Returns:
        {
            "score": float (0-100),
            "scores": {dimension: float (0-100)},
            "explanation": {dimension: str}
        }
    """
    if not outfit_items:
        return {"score": 0, "scores": {}, "explanation": {}}

    core_items = [
        i
        for i in outfit_items
        if i.get("category") in {"tops", "bottoms", "dresses", "outerwear"}
    ]

    scores: Dict[str, float] = {}
    weights: Dict[str, float] = {}

    # Colour compatibility (25%)
    if len(core_items) >= 2:
        colour_scores = []
        for i in range(len(core_items)):
            for j in range(i + 1, len(core_items)):
                c1 = core_items[i].get("primary_colour", "")
                c2 = core_items[j].get("primary_colour", "")
                colour_scores.append(_colour_compatibility_score(c1, c2))
        scores["colour"] = sum(colour_scores) / len(colour_scores)
    else:
        scores["colour"] = 0.8
    weights["colour"] = 0.25

    # Formality consistency (20%)
    scores["formality"] = _formality_compatibility_score(outfit_items)
    weights["formality"] = 0.20

    # Occasion suitability (25%)
    scores["occasion"] = _occasion_suitability_score(outfit_items, occasion)
    weights["occasion"] = 0.25

    # Pattern harmony (15%)
    scores["pattern"] = _pattern_compatibility_score(core_items)
    weights["pattern"] = 0.15

    # Accessory coordination (15%)
    scores["accessory"] = _accessory_coordination_score(outfit_items, user_profile)
    weights["accessory"] = 0.15

    total = sum(scores[k] * weights[k] for k in scores)
    final_score = round(total * 100, 1)

    explanation = _build_explanation(scores, outfit_items, occasion, user_profile)

    return {
        "score": final_score,
        "scores": {k: round(v * 100, 1) for k, v in scores.items()},
        "explanation": explanation,
    }


# ---------------------------------------------------------------------------
# Combination generator
# ---------------------------------------------------------------------------


def generate_outfit_combinations(
    wardrobe_items: List[Dict],
    occasion: str,
    user_profile: Dict,
    weather: Dict = None,
    top_n: int = 5,
) -> List[Dict]:
    """
    Generate and score outfit combinations from the user's wardrobe.
    Returns the top N combinations sorted by score (descending).
    """
    tops = [i for i in wardrobe_items if i.get("category") == "tops"]
    bottoms = [i for i in wardrobe_items if i.get("category") == "bottoms"]
    dresses = [i for i in wardrobe_items if i.get("category") == "dresses"]
    footwear = [i for i in wardrobe_items if i.get("category") == "footwear"]
    accessories = [i for i in wardrobe_items if i.get("category") == "accessories"]

    combinations: List[Dict] = []

    # --- Top + Bottom combinations ---
    for top in tops[:10]:
        for bottom in bottoms[:10]:
            outfit = [top, bottom]
            if footwear:
                outfit.append(footwear[0])
            if accessories:
                outfit.append(accessories[0])

            result = score_outfit(outfit, occasion, user_profile, weather)
            combinations.append(
                {
                    "items": outfit,
                    "score": result["score"],
                    "scores": result["scores"],
                    "explanation": result["explanation"],
                    "type": "top_bottom",
                }
            )

    # --- Dress combinations ---
    for dress in dresses[:10]:
        outfit = [dress]
        if footwear:
            outfit.append(footwear[0])
        if accessories:
            outfit.append(accessories[0])

        result = score_outfit(outfit, occasion, user_profile, weather)
        combinations.append(
            {
                "items": outfit,
                "score": result["score"],
                "scores": result["scores"],
                "explanation": result["explanation"],
                "type": "dress",
            }
        )

    combinations.sort(key=lambda x: x["score"], reverse=True)
    return combinations[:top_n]
