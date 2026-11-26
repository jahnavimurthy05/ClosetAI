from fastapi import FastAPI, Security, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import APIKeyHeader
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv
from routers import process, recommend, chat

load_dotenv()

API_KEY = os.getenv("AI_SERVICE_SECRET", "")
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


async def verify_api_key(key: str = Security(api_key_header)):
    if not API_KEY or key != API_KEY:
        raise HTTPException(status_code=403, detail="Invalid API key")
    return key


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Pre-warm models on startup
    from services.background_removal import init_model
    init_model()
    yield


app = FastAPI(title="ClosetAI AI Service", version="1.0.0", lifespan=lifespan)

origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    process.router,
    prefix="/process",
    tags=["Image Processing"],
    dependencies=[Depends(verify_api_key)],
)
app.include_router(
    recommend.router,
    prefix="/recommend",
    tags=["Recommendations"],
    dependencies=[Depends(verify_api_key)],
)
app.include_router(
    chat.router,
    prefix="/chat",
    tags=["AI Stylist"],
    dependencies=[Depends(verify_api_key)],
)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "ClosetAI AI Service"}
