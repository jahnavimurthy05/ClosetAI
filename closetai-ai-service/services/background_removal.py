from rembg import remove, new_session
from PIL import Image
import io
import asyncio
import logging

logger = logging.getLogger(__name__)

_session = None


def init_model():
    """Initialise the lightweight rembg u2netp model (fits comfortably in 512 MiB RAM)."""
    global _session
    try:
        _session = new_session("u2netp")
        logger.info("rembg u2netp model initialised successfully.")
    except Exception as exc:
        logger.warning(f"rembg model init failed (will retry on first request): {exc}")
        _session = None


async def remove_background(image_bytes: bytes) -> bytes:
    """
    Remove the background from an image using rembg (u2net).
    Returns PNG bytes with a white background replacing transparency.
    """
    global _session
    if _session is None:
        init_model()

    loop = asyncio.get_event_loop()

    result = await loop.run_in_executor(
        None,
        lambda: remove(image_bytes, session=_session, bgcolor=(255, 255, 255, 255)),
    )

    # Normalise output to PNG
    img = Image.open(io.BytesIO(result))
    output = io.BytesIO()
    img.save(output, format="PNG")
    return output.getvalue()
