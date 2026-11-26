import cv2
import numpy as np
from sklearn.cluster import KMeans
from PIL import Image
import io
import asyncio
import logging
from typing import Dict, List, Tuple

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Colour name reference map (RGB)
# ---------------------------------------------------------------------------

COLOUR_NAMES: Dict[str, Tuple[int, int, int]] = {
    "black": (0, 0, 0),
    "white": (255, 255, 255),
    "red": (220, 50, 50),
    "blue": (50, 100, 200),
    "navy": (20, 40, 100),
    "green": (50, 150, 80),
    "yellow": (255, 220, 50),
    "orange": (255, 140, 50),
    "purple": (128, 50, 150),
    "pink": (255, 150, 180),
    "brown": (130, 80, 50),
    "beige": (220, 200, 170),
    "grey": (150, 150, 150),
    "cream": (255, 240, 220),
    "maroon": (120, 30, 30),
    "teal": (50, 150, 150),
    "olive": (110, 120, 60),
    "coral": (255, 100, 100),
    "lavender": (180, 150, 220),
    "mint": (160, 220, 190),
    "mustard": (200, 170, 50),
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _closest_colour_name(rgb: Tuple[int, int, int]) -> Tuple[str, str]:
    r, g, b = rgb
    min_dist = float("inf")
    closest = "unknown"
    for name, (cr, cg, cb) in COLOUR_NAMES.items():
        dist = ((r - cr) ** 2 + (g - cg) ** 2 + (b - cb) ** 2) ** 0.5
        if dist < min_dist:
            min_dist = dist
            closest = name
    hex_code = f"#{r:02x}{g:02x}{b:02x}"
    return closest, hex_code


def _extract_colours_sync(image_bytes: bytes, n_colours: int = 5) -> Dict:
    """Synchronous colour extraction via k-means clustering."""
    img = Image.open(io.BytesIO(image_bytes)).convert("RGBA")
    img_array = np.array(img)

    # Keep only fully-opaque pixels (removes white bg from rembg output)
    mask = img_array[:, :, 3] > 128
    rgb_pixels = img_array[mask][:, :3]

    if len(rgb_pixels) < 10:
        logger.warning("Not enough non-transparent pixels to extract colours.")
        return {"primary": "unknown", "secondary": [], "hex": "#000000", "palette": []}

    # Downsample for speed (at most 1 000 pixels for clustering)
    sample = rgb_pixels[:: max(1, len(rgb_pixels) // 1000)]

    k = min(n_colours, len(sample))
    kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
    kmeans.fit(sample)

    labels, counts = np.unique(kmeans.labels_, return_counts=True)
    sorted_idx = np.argsort(-counts)

    colours: List[Dict] = []
    for idx in sorted_idx:
        centre = kmeans.cluster_centers_[labels[idx]]
        rgb = tuple(int(c) for c in centre)
        name, hex_code = _closest_colour_name(rgb)  # type: ignore[arg-type]
        colours.append({"name": name, "hex": hex_code, "count": int(counts[idx])})

    return {
        "primary": colours[0]["name"],
        "hex": colours[0]["hex"],
        "secondary": [c["name"] for c in colours[1:3]] if len(colours) > 1 else [],
        "palette": colours,
    }


# ---------------------------------------------------------------------------
# Public async API
# ---------------------------------------------------------------------------


async def extract_colours(image_bytes: bytes, n_colours: int = 5) -> Dict:
    """Extract dominant colours from a clothing image (async wrapper)."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _extract_colours_sync, image_bytes, n_colours)
