"""
Outfit scoring engine – rates combinations of wardrobe items on colour
compatibility, formality consistency, occasion suitability, pattern harmony,
accessory coordination, and personal style/colour profile alignment.
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

NEUTRAL_COLOURS: Set[str] = {
    "black",
    "white",
    "beige",
    "cream",
    "grey",
    "gray",
    "brown",
    "navy",
    "taupe",
    "ivory",
    "tan",
    "charcoal",
}

ANALOGOUS_GROUPS: List[Set[str]] = [
    {"blue", "navy", "teal", "purple"},
    {"red", "maroon", "coral", "orange"},
    {"green", "olive", "teal", "mint"},
    {"yellow", "orange", "mustard", "coral"},
    {"purple", "lavender", "pink", "maroon"},
]

WARM_COLOURS: Set[str] = {
    "red", "orange", "yellow", "mustard", "coral", "maroon", "brown", "beige", "cream", "olive", "tan",
}
COOL_COLOURS: Set[str] = {
    "blue", "navy", "teal", "mint", "purple", "lavender", "pink", "grey", "gray", "charcoal",
}

# ---------------------------------------------------------------------------
# Formality & occasion data
# ---------------------------------------------------------------------------

FORMALITY_ORDER: List[str] = [
    "very_casual",
    "casual",
    "smart_casual",
    "semi_formal",
    "formal",
    "festive",
    "black_tie",
]

OCCASION_ALIASES: Dict[str, Set[str]] = {
    "college": {"college", "casual", "daily_wear", "casual_outing"},
    "office": {"office", "work", "smart_casual", "formal"},
    "interview": {"interview", "work", "office", "formal_event", "formal"},
    "casual_outing": {"casual_outing", "casual", "weekend", "daily_wear"},
    "shopping": {"shopping", "casual", "weekend", "casual_outing"},
    "party": {"party", "date_night", "formal_event", "festive"},
    "birthday": {"birthday", "party", "date_night", "casual_outing"},
    "wedding": {"wedding", "festive", "formal_event"},
    "family_function": {"family_function", "festive", "semi_formal"},
    "date": {"date", "date_night", "dinner", "party"},
    "travel": {"travel", "casual", "weekend", "daily_wear"},
    "dinner": {"dinner", "date_night", "date", "party"},
    "festive": {"festive", "wedding", "family_function", "party"},
    "daily_wear": {"daily_wear", "casual", "weekend"},
}

OCCASION_FORMALITY: Dict[str, List[str]] = {
    "college": ["very_casual", "casual", "smart_casual"],
    "office": ["smart_casual", "semi_formal", "formal"],
    "interview": ["formal", "semi_formal"],
    "casual_outing": ["very_casual", "casual", "smart_casual"],
    "shopping": ["very_casual", "casual"],
    "party": ["smart_casual", "semi_formal", "festive", "formal"],
    "birthday": ["casual", "smart_casual", "semi_formal", "festive"],
    "wedding": ["festive", "formal", "black_tie", "semi_formal"],
    "family_function": ["smart_casual", "semi_formal", "festive"],
    "date": ["smart_casual", "semi_formal", "formal"],
    "travel": ["very_casual", "casual"],
    "dinner": ["smart_casual", "semi_formal", "formal"],
    "festive": ["festive", "semi_formal"],
    "daily_wear": ["very_casual", "casual"],
}

# ---------------------------------------------------------------------------
# Scoring sub-functions
# ---------------------------------------------------------------------------


def _norm(val: Any) -> str:
    return str(val or "").strip().lower().replace("-", "_").replace(" ", "_")


def _colour_compatibility_score(colour1: str, colour2: str) -> float:
    c1, c2 = _norm(colour1), _norm(colour2)
    if not c1 or not c2 or c1 == "unknown" or c2 == "unknown":
        return 0.7
    if c1 == c2:
        return 0.75
    if c1 in NEUTRAL_COLOURS or c2 in NEUTRAL_COLOURS:
        return 1.0
    for pair in COMPLEMENTARY_PAIRS:
        if {c1, c2} == set(pair):
            return 0.95
    for group in ANALOGOUS_GROUPS:
        if c1 in group and c2 in group:
            return 0.85
    return 0.55


def _formality_compatibility_score(items: List[Dict]) -> float:
    formalities = [_norm(item.get("formality", "casual")) for item in items]
    if len(set(formalities)) == 1:
        return 1.0
    indices = [
        FORMALITY_ORDER.index(f) if f in FORMALITY_ORDER else 1 for f in formalities
    ]
    spread = max(indices) - min(indices)
    return max(0.2, 1.0 - spread * 0.22)


def _item_occasion_score(item: Dict, occasion: str) -> float:
    occ_key = _norm(occasion)
    aliases = OCCASION_ALIASES.get(occ_key, {occ_key})
    target_formalities = OCCASION_FORMALITY.get(occ_key, ["casual", "smart_casual"])

    item_occasions = {_norm(o) for o in (item.get("occasions") or [])}
    formality = _norm(item.get("formality") or "casual")

    score = 0.35
    if item_occasions & aliases:
        score = 1.0 if occ_key in item_occasions else 0.9
    elif formality in target_formalities:
        score = 0.82
    else:
        # Measure distance to closest target formality
        f_idx = FORMALITY_ORDER.index(formality) if formality in FORMALITY_ORDER else 1
        t_indices = [
            FORMALITY_ORDER.index(t) if t in FORMALITY_ORDER else 1
            for t in target_formalities
        ]
        dist = min(abs(f_idx - ti) for ti in t_indices)
        score = max(0.2, 0.75 - dist * 0.2)

    # Occasion-specific subcategory boosts so different occasions surface different looks
    sub = _norm(item.get("subcategory") or item.get("name") or "")
    if occ_key in {"office", "interview"} and any(
        k in sub for k in ["shirt", "blouse", "blazer", "trouser", "pant", "loafer", "heel"]
    ):
        score = min(1.0, score + 0.12)
    elif occ_key in {"party", "wedding", "festive", "family_function"} and any(
        k in sub for k in ["dress", "saree", "kurti", "salwar", "heel", "earring", "necklace"]
    ):
        score = min(1.0, score + 0.12)
    elif occ_key in {"travel", "shopping", "college", "casual_outing", "daily_wear"} and any(
        k in sub for k in ["t_shirt", "tee", "jean", "sneaker", "flat", "sandal", "hoodie"]
    ):
        score = min(1.0, score + 0.1)

    return score


def _occasion_suitability_score(items: List[Dict], occasion: str) -> float:
    if not occasion:
        return 0.75
    scores = [_item_occasion_score(item, occasion) for item in items]
    return sum(scores) / len(scores) if scores else 0.5


def _pattern_compatibility_score(items: List[Dict]) -> float:
    patterns = [_norm(item.get("pattern", "solid")) for item in items]
    patterned = [p for p in patterns if p and p != "solid"]
    if len(patterned) == 0:
        return 0.9
    if len(patterned) == 1:
        return 1.0
    if len(patterned) == 2:
        return 0.5
    return 0.3


def _accessory_coordination_score(outfit_items: List[Dict], profile: Dict) -> float:
    accessories = [i for i in outfit_items if _norm(i.get("category")) == "accessories"]
    if not accessories:
        return 0.8

    score = 0.82
    metals_in_outfit: Set[str] = set()
    for acc in accessories:
        for tag in acc.get("style_tags") or []:
            t = _norm(tag)
            if t in {"gold", "silver", "rose_gold"}:
                metals_in_outfit.add(t)
    if len(metals_in_outfit) <= 1:
        score = min(1.0, score + 0.1)
    return score


def _profile_alignment_score(outfit_items: List[Dict], user_profile: Dict) -> float:
    if not user_profile:
        return 0.8

    colour_profile = user_profile.get("colour_profile") or user_profile
    style_prefs = user_profile.get("style_preferences") or user_profile

    fav_colours = {_norm(c) for c in (colour_profile.get("favourite_colours") or [])}
    avoid_colours = {_norm(c) for c in (colour_profile.get("avoided_colours") or [])}
    undertone = _norm(colour_profile.get("undertone") or "")
    pref_styles = {_norm(s) for s in (style_prefs.get("styles") or [])}

    score = 0.75
    for item in outfit_items:
        c = _norm(item.get("primary_colour"))
        if c in avoid_colours:
            score -= 0.2
        elif c in fav_colours:
            score += 0.08
        if undertone == "warm" and c in WARM_COLOURS:
            score += 0.04
        elif undertone == "cool" and c in COOL_COLOURS:
            score += 0.04

        item_styles = {_norm(s) for s in (item.get("style_tags") or [])}
        if pref_styles and (item_styles & pref_styles):
            score += 0.06

    return max(0.2, min(1.0, score))


# ---------------------------------------------------------------------------
# Explanation builder
# ---------------------------------------------------------------------------


def _build_explanation(scores: Dict, items: List[Dict], occasion: str, profile: Dict) -> Dict:
    explanations: Dict[str, str] = {}

    colour_score = scores.get("colour", 0)
    if colour_score >= 0.9:
        explanations["colour"] = (
            "These colours pair naturally together with strong contrast and balance."
        )
    elif colour_score >= 0.7:
        explanations["colour"] = (
            "The colour palette works harmoniously with balanced tones."
        )
    else:
        explanations["colour"] = (
            "Adding a neutral accessory or layer will tie these tones together."
        )

    formality_score = scores.get("formality", 0)
    if formality_score >= 0.85:
        explanations["formality"] = "The formality levels across these pieces are cleanly aligned."
    else:
        explanations["formality"] = (
            "This look blends formality levels intentionally for a relaxed yet put-together feel."
        )

    if occasion:
        occ_score = scores.get("occasion", 0)
        occ_label = occasion.replace("_", " ")
        if occ_score >= 0.8:
            explanations["occasion"] = f"Well-suited for {occ_label} based on garment style and formality."
        else:
            explanations["occasion"] = (
                f"Adapted from your available wardrobe for {occ_label}."
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
    if not outfit_items:
        return {"score": 0, "scores": {}, "explanation": {}}

    core_items = [
        i
        for i in outfit_items
        if _norm(i.get("category")) in {"tops", "bottoms", "dresses", "outerwear"}
    ]

    scores: Dict[str, float] = {}
    weights: Dict[str, float] = {}

    if len(core_items) >= 2:
        colour_scores = []
        for i in range(len(core_items)):
            for j in range(i + 1, len(core_items)):
                c1 = core_items[i].get("primary_colour", "")
                c2 = core_items[j].get("primary_colour", "")
                colour_scores.append(_colour_compatibility_score(c1, c2))
        scores["colour"] = sum(colour_scores) / len(colour_scores) if colour_scores else 0.7
    else:
        scores["colour"] = 0.8
    weights["colour"] = 0.22

    scores["formality"] = _formality_compatibility_score(outfit_items)
    weights["formality"] = 0.18

    scores["occasion"] = _occasion_suitability_score(outfit_items, occasion)
    weights["occasion"] = 0.30

    scores["pattern"] = _pattern_compatibility_score(core_items)
    weights["pattern"] = 0.12

    scores["accessory"] = _accessory_coordination_score(outfit_items, user_profile)
    weights["accessory"] = 0.08

    scores["profile"] = _profile_alignment_score(outfit_items, user_profile)
    weights["profile"] = 0.10

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


def _pick_best_companion(
    candidates: List[Dict],
    base_items: List[Dict],
    occasion: str,
) -> Dict | None:
    if not candidates:
        return None
    best_item = candidates[0]
    best_score = -1.0
    base_colours = [i.get("primary_colour", "") for i in base_items]
    for cand in candidates:
        occ_s = _item_occasion_score(cand, occasion)
        col_s = (
            sum(_colour_compatibility_score(cand.get("primary_colour", ""), bc) for bc in base_colours)
            / max(1, len(base_colours))
        )
        total = occ_s * 0.65 + col_s * 0.35
        if total > best_score:
            best_score = total
            best_item = cand
    return best_item


def generate_outfit_combinations(
    wardrobe_items: List[Dict],
    occasion: str,
    user_profile: Dict,
    weather: Dict = None,
    top_n: int = 5,
) -> List[Dict]:
    """
    Generate and score outfit combinations from the user's wardrobe.
    Prioritises items suited to the selected occasion and avoids repeating
    identical looks across occasions.
    """
    tops = sorted(
        [i for i in wardrobe_items if _norm(i.get("category")) == "tops"],
        key=lambda x: _item_occasion_score(x, occasion),
        reverse=True,
    )
    bottoms = sorted(
        [i for i in wardrobe_items if _norm(i.get("category")) == "bottoms"],
        key=lambda x: _item_occasion_score(x, occasion),
        reverse=True,
    )
    dresses = sorted(
        [i for i in wardrobe_items if _norm(i.get("category")) == "dresses"],
        key=lambda x: _item_occasion_score(x, occasion),
        reverse=True,
    )
    outerwear = sorted(
        [i for i in wardrobe_items if _norm(i.get("category")) == "outerwear"],
        key=lambda x: _item_occasion_score(x, occasion),
        reverse=True,
    )
    footwear = sorted(
        [i for i in wardrobe_items if _norm(i.get("category")) == "footwear"],
        key=lambda x: _item_occasion_score(x, occasion),
        reverse=True,
    )
    accessories = sorted(
        [i for i in wardrobe_items if _norm(i.get("category")) in {"accessories", "bags"}],
        key=lambda x: _item_occasion_score(x, occasion),
        reverse=True,
    )

    combinations: List[Dict] = []
    occ_key = _norm(occasion)

    # --- Top + Bottom combinations ---
    for top in tops[:12]:
        for bottom in bottoms[:12]:
            outfit = [top, bottom]

            # Add occasion-appropriate outerwear (e.g. blazer for office/interview/formal)
            if outerwear and occ_key in {"office", "interview", "dinner", "formal", "travel"}:
                best_outer = _pick_best_companion(outerwear, outfit, occasion)
                if best_outer:
                    outfit.append(best_outer)

            best_shoe = _pick_best_companion(footwear, outfit, occasion)
            if best_shoe:
                outfit.append(best_shoe)

            best_acc = _pick_best_companion(accessories, outfit, occasion)
            if best_acc:
                outfit.append(best_acc)

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
    for dress in dresses[:12]:
        outfit = [dress]
        best_shoe = _pick_best_companion(footwear, outfit, occasion)
        if best_shoe:
            outfit.append(best_shoe)
        best_acc = _pick_best_companion(accessories, outfit, occasion)
        if best_acc:
            outfit.append(best_acc)

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
