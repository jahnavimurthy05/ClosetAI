from fastapi import APIRouter, UploadFile, File
from services.background_removal import remove_background
from services.clothing_classifier import classify_clothing
from services.colour_extractor import extract_colours
import base64
import io
from PIL import Image

router = APIRouter()


@router.post("/image")
async def process_image(file: UploadFile = File(...)):
    """
    Process an uploaded clothing image:
    1. Remove background
    2. Classify clothing category and attributes
    3. Extract dominant colours
    Returns all extracted metadata plus the processed image as base64.
    """
    # 1. Read image bytes
    contents = await file.read()

    # 2. Remove background
    processed_bytes = await remove_background(contents)

    # 3. Classify clothing
    classification = await classify_clothing(processed_bytes)

    # 4. Extract colours
    colours = await extract_colours(processed_bytes)

    # 5. Encode processed image as base64 for return
    processed_b64 = base64.b64encode(processed_bytes).decode()

    return {
        "processed_image_base64": processed_b64,
        "classification": classification,
        "colours": colours,
        "ai_confidence": classification.get("confidence", 0.0),
    }
