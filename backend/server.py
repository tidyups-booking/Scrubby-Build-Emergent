from fastapi import FastAPI, APIRouter, HTTPException, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
from twilio.rest import Client as TwilioClient


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")


# ---------------- Models ----------------
class QuoteCreate(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    service_type: str
    property_type: Optional[str] = None
    bedrooms: Optional[str] = None
    bathrooms: Optional[str] = None
    address: Optional[str] = None
    preferred_date: Optional[str] = None
    message: Optional[str] = None


class Quote(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    phone: str
    email: Optional[str] = None
    service_type: str
    property_type: Optional[str] = None
    bedrooms: Optional[str] = None
    bathrooms: Optional[str] = None
    address: Optional[str] = None
    preferred_date: Optional[str] = None
    message: Optional[str] = None
    status: str = "new"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# ---------------- Routes ----------------
@api_router.get("/")
async def root():
    return {"message": "Tidyups Cleaning API"}


def _send_lead_sms(quote: "Quote"):
    sid = os.environ.get("TWILIO_ACCOUNT_SID")
    token = os.environ.get("TWILIO_AUTH_TOKEN")
    from_number = os.environ.get("TWILIO_FROM_NUMBER")
    to_number = os.environ.get("LEAD_ALERT_TO")
    if not all([sid, token, from_number, to_number]):
        logger.warning("Twilio not fully configured; skipping SMS alert")
        return
    parts = [
        "New Tidyups lead!",
        f"Name: {quote.name}",
        f"Phone: {quote.phone}",
        f"Service: {quote.service_type}",
    ]
    if quote.bedrooms or quote.bathrooms:
        parts.append(f"Beds/Baths: {quote.bedrooms or '-'}/{quote.bathrooms or '-'}")
    if quote.address:
        parts.append(f"Area: {quote.address}")
    body = "\n".join(parts)
    try:
        client = TwilioClient(sid, token)
        client.messages.create(body=body, from_=from_number, to=to_number)
        logger.info("Lead SMS sent to %s", to_number)
    except Exception as e:
        logger.error("Failed to send lead SMS: %s", e)


@api_router.post("/quotes", response_model=Quote)
async def create_quote(payload: QuoteCreate):
    quote = Quote(**payload.model_dump())
    await db.quotes.insert_one(quote.model_dump())
    try:
        _send_lead_sms(quote)
    except Exception as e:
        logger.error("SMS alert error: %s", e)
    return quote


def _check_admin(password: Optional[str]):
    expected = os.environ.get('ADMIN_PASSWORD')
    if not expected or password != expected:
        raise HTTPException(status_code=401, detail="Invalid admin password")


@api_router.get("/quotes", response_model=List[Quote])
async def list_quotes(x_admin_password: Optional[str] = Header(default=None)):
    _check_admin(x_admin_password)
    quotes = await db.quotes.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return quotes


@api_router.post("/admin/login")
async def admin_login(x_admin_password: Optional[str] = Header(default=None)):
    _check_admin(x_admin_password)
    return {"ok": True}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
