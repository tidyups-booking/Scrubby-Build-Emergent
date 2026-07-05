from fastapi import FastAPI, APIRouter, HTTPException, Header, UploadFile, File, Form, Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import requests
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
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

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ---------------- Object Storage ----------------
STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
APP_NAME = "tidyups-quote"
MIME_TYPES = {"jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png", "webp": "image/webp", "gif": "image/gif"}
_storage_key = None


def init_storage():
    global _storage_key
    if _storage_key:
        return _storage_key
    resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": os.environ.get("EMERGENT_LLM_KEY")}, timeout=30)
    resp.raise_for_status()
    _storage_key = resp.json()["storage_key"]
    return _storage_key


def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data, timeout=120,
    )
    resp.raise_for_status()
    return resp.json()


def get_object(path: str):
    key = init_storage()
    resp = requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key}, timeout=60)
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")


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


# section: "hero" | "gallery"
SEED_IMAGES = [
    {"section": "hero", "label": "Our Fleet", "order": 0,
     "url": "https://customer-assets.emergentagent.com/job_tidyups-quote/artifacts/pdg75ki2_branded%20vehicles.png"},
    {"section": "gallery", "label": "Serving Edmonton", "order": 0,
     "url": "https://customer-assets.emergentagent.com/job_tidyups-quote/artifacts/nencmbh4_edmonton%20branded%20vehicles%20v01.jpg"},
    {"section": "gallery", "label": "Home & Office Service", "order": 1,
     "url": "https://customer-assets.emergentagent.com/job_tidyups-quote/artifacts/rqszupss_tidyups%20vehicle%20in%20front%20of%20house.png"},
    {"section": "gallery", "label": "Our Team", "order": 2,
     "url": "https://customer-assets.emergentagent.com/job_tidyups-quote/artifacts/9zhnpwav_Jen%20%26%20Bryan%20V001_edited600x600.jpg"},
    {"section": "gallery", "label": "On The Road", "order": 3,
     "url": "https://customer-assets.emergentagent.com/job_tidyups-quote/artifacts/a95j1stt_vehicle%20in%20edmonton.png"},
]


async def seed_site_images():
    count = await db.site_images.count_documents({})
    if count > 0:
        return
    docs = []
    for s in SEED_IMAGES:
        docs.append({
            "id": str(uuid.uuid4()),
            "section": s["section"],
            "label": s["label"],
            "order": s["order"],
            "url": s["url"],
            "storage_path": None,
            "is_deleted": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    await db.site_images.insert_many(docs)
    logger.info("Seeded %d site images", len(docs))


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
        tclient = TwilioClient(sid, token)
        tclient.messages.create(body=body, from_=from_number, to=to_number)
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


# ---------------- Site Images ----------------
def _clean_image(doc):
    return {"id": doc["id"], "section": doc["section"], "label": doc.get("label", ""),
            "order": doc.get("order", 0), "url": doc["url"]}


@api_router.get("/site-images")
async def get_site_images():
    docs = await db.site_images.find({"is_deleted": False}).sort("order", 1).to_list(1000)
    hero = next((_clean_image(d) for d in docs if d["section"] == "hero"), None)
    gallery = [_clean_image(d) for d in docs if d["section"] == "gallery"]
    return {"hero": hero, "gallery": gallery}


@api_router.post("/site-images/upload")
async def upload_site_image(
    file: UploadFile = File(...),
    section: str = Form(...),
    label: str = Form(""),
    x_admin_password: Optional[str] = Header(default=None),
):
    _check_admin(x_admin_password)
    if section not in ("hero", "gallery"):
        raise HTTPException(status_code=400, detail="section must be 'hero' or 'gallery'")
    ext = (file.filename.rsplit(".", 1)[-1] if "." in file.filename else "png").lower()
    content_type = MIME_TYPES.get(ext, file.content_type or "image/png")
    if not content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are allowed")
    data = await file.read()
    if len(data) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image too large (max 10MB)")
    storage_path = f"{APP_NAME}/site/{uuid.uuid4()}.{ext}"
    try:
        result = put_object(storage_path, data, content_type)
    except Exception as e:
        logger.error("Storage upload failed: %s", e)
        raise HTTPException(status_code=502, detail="Image upload failed. Please try again.")

    stored_path = result.get("path", storage_path)
    url = f"/api/site-images/file/{stored_path}"

    if section == "hero":
        await db.site_images.update_many({"section": "hero", "is_deleted": False}, {"$set": {"is_deleted": True}})
        order = 0
    else:
        last = await db.site_images.find({"section": "gallery", "is_deleted": False}).sort("order", -1).to_list(1)
        order = (last[0]["order"] + 1) if last else 0

    doc = {
        "id": str(uuid.uuid4()),
        "section": section,
        "label": label or "",
        "order": order,
        "url": url,
        "storage_path": stored_path,
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.site_images.insert_one(doc)
    return _clean_image(doc)


@api_router.delete("/site-images/{image_id}")
async def delete_site_image(image_id: str, x_admin_password: Optional[str] = Header(default=None)):
    _check_admin(x_admin_password)
    res = await db.site_images.update_one({"id": image_id}, {"$set": {"is_deleted": True}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Image not found")
    return {"ok": True}


class ReorderPayload(BaseModel):
    order: List[str]


@api_router.post("/site-images/reorder")
async def reorder_site_images(payload: ReorderPayload, x_admin_password: Optional[str] = Header(default=None)):
    _check_admin(x_admin_password)
    for idx, image_id in enumerate(payload.order):
        await db.site_images.update_one(
            {"id": image_id, "section": "gallery", "is_deleted": False},
            {"$set": {"order": idx}},
        )
    return {"ok": True}


@api_router.get("/site-images/file/{path:path}")
async def serve_site_image(path: str):
    try:
        data, content_type = get_object(path)
    except Exception:
        raise HTTPException(status_code=404, detail="Image not found")
    return Response(content=data, media_type=content_type, headers={"Cache-Control": "public, max-age=86400"})


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup():
    try:
        init_storage()
        logger.info("Object storage initialized")
    except Exception as e:
        logger.error("Storage init failed: %s", e)
    await seed_site_images()


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
