import os
import logging
import warnings
from datetime import datetime, timezone, timedelta

from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request as GoogleRequest
from googleapiclient.discovery import build

logger = logging.getLogger(__name__)

SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
]
REQUIRED_SCOPES = {"https://www.googleapis.com/auth/spreadsheets"}
SHEET_TITLE = "Tidyups Quote Submissions"
TOKENS_KEY = "google_sheets"
HEADER = [
    "Submitted At", "Name", "Phone", "Email", "Service", "Property Type",
    "Bedrooms", "Bathrooms", "Street Address", "City", "Province",
    "Postal Code", "Preferred Date", "Message", "Status",
]


def _client_config():
    return {
        "web": {
            "client_id": os.environ["GOOGLE_CLIENT_ID"],
            "client_secret": os.environ["GOOGLE_CLIENT_SECRET"],
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
        }
    }


def build_auth_url(redirect_uri: str):
    flow = Flow.from_client_config(_client_config(), scopes=SCOPES, redirect_uri=redirect_uri)
    url, state = flow.authorization_url(access_type="offline", prompt="consent")
    return url, state


def exchange_code(code: str, redirect_uri: str) -> Credentials:
    flow = Flow.from_client_config(_client_config(), scopes=SCOPES, redirect_uri=redirect_uri)
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        flow.fetch_token(code=code)
    creds = flow.credentials
    granted = set(creds.scopes or [])
    if not REQUIRED_SCOPES.issubset(granted):
        raise ValueError(f"Missing required scopes: {REQUIRED_SCOPES - granted}")
    return creds


def get_user_email(creds) -> str:
    try:
        service = build("oauth2", "v2", credentials=creds)
        return service.userinfo().get().execute().get("email", "")
    except Exception as e:
        logger.warning("Could not fetch user email: %s", e)
        return ""


def creds_to_doc(creds) -> dict:
    expiry = creds.expiry
    if expiry and expiry.tzinfo is None:
        expiry = expiry.replace(tzinfo=timezone.utc)
    return {
        "access_token": creds.token,
        "refresh_token": creds.refresh_token,
        "token_uri": "https://oauth2.googleapis.com/token",
        "expires_at": expiry.isoformat() if expiry else None,
    }


def doc_to_creds(doc: dict) -> Credentials:
    creds = Credentials(
        token=doc["access_token"],
        refresh_token=doc.get("refresh_token"),
        token_uri=doc.get("token_uri", "https://oauth2.googleapis.com/token"),
        client_id=os.environ["GOOGLE_CLIENT_ID"],
        client_secret=os.environ["GOOGLE_CLIENT_SECRET"],
        scopes=list(REQUIRED_SCOPES),
    )
    expired = True
    if doc.get("expires_at"):
        expires = datetime.fromisoformat(doc["expires_at"])
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)
        expired = datetime.now(timezone.utc) >= expires - timedelta(minutes=2)
    if expired and creds.refresh_token:
        creds.refresh(GoogleRequest())
    return creds


def create_spreadsheet(creds) -> str:
    service = build("sheets", "v4", credentials=creds)
    result = service.spreadsheets().create(
        body={"properties": {"title": SHEET_TITLE}}, fields="spreadsheetId"
    ).execute()
    sid = result["spreadsheetId"]
    service.spreadsheets().values().update(
        spreadsheetId=sid, range="A1", valueInputOption="RAW", body={"values": [HEADER]},
    ).execute()
    service.spreadsheets().batchUpdate(spreadsheetId=sid, body={"requests": [{
        "repeatCell": {
            "range": {"sheetId": 0, "startRowIndex": 0, "endRowIndex": 1},
            "cell": {"userEnteredFormat": {"textFormat": {"bold": True}}},
            "fields": "userEnteredFormat.textFormat.bold",
        }
    }]}).execute()
    return sid


def append_rows(creds, spreadsheet_id: str, rows: list):
    service = build("sheets", "v4", credentials=creds)
    service.spreadsheets().values().append(
        spreadsheetId=spreadsheet_id, range="A1",
        valueInputOption="RAW", insertDataOption="INSERT_ROWS",
        body={"values": rows},
    ).execute()


def quote_to_row(q: dict) -> list:
    return [
        q.get("created_at", ""), q.get("name", ""), q.get("phone", ""), q.get("email") or "",
        q.get("service_type", ""), q.get("property_type") or "", q.get("bedrooms") or "",
        q.get("bathrooms") or "", q.get("street_address") or (q.get("address") or ""),
        q.get("city") or "", q.get("province") or "", q.get("postal_code") or "",
        q.get("preferred_date") or "", q.get("message") or "", q.get("status", "new"),
    ]
