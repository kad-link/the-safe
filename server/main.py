import os
import time
import re
import secrets
import hmac
import traceback
from typing import Optional, Dict
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, EmailStr
import resend
import supabase_db

try:
    from dotenv import load_dotenv
    # Load from current directory or parent directory
    load_dotenv()
    load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
except ImportError:
    pass

app = FastAPI(
    title="vault-68 Authentication API",
    description="Resend email-based One-Time Password authentication service for vault-68 citizen repository",
    version="2.0.0"
)

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for OTP sessions
# Key: normalized_email -> Value: dict
otp_sessions: Dict[str, dict] = {}

class SendOtpRequest(BaseModel):
    email: str = Field(..., description="Citizen email address for OTP delivery")
    name: Optional[str] = Field(None, description="Full citizen name for sign-up")

class VerifyOtpRequest(BaseModel):
    email: str = Field(..., description="Citizen email address")
    otp: str = Field(..., description="6-digit verification code")

def is_valid_email(email: str) -> bool:
    email_regex = r"^[\w\.-]+@[\w\.-]+\.\w+$"
    return bool(re.match(email_regex, email.strip()))

def send_email_via_resend(email: str, otp: str, name: Optional[str] = None) -> dict:
    """
    Dispatches OTP directly to citizen email using Resend.
    """
    resend_api_key = os.getenv("RESEND_API_KEY")
    from_email = os.getenv("RESEND_FROM_EMAIL", "vault-68 <onboarding@resend.dev>")
    recipient_name = name or "Citizen"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>vault-68 Verification Code</title>
      <style>
        body {{
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background-color: #0A0A0E;
          color: #E2E8F0;
          margin: 0;
          padding: 30px 15px;
        }}
        .container {{
          max-width: 520px;
          margin: 0 auto;
          background: #111118;
          border: 1px solid #00E5FF;
          border-radius: 8px;
          padding: 32px;
          box-shadow: 0 0 25px rgba(0, 229, 255, 0.15);
        }}
        .badge {{
          display: inline-block;
          background: #FF1493;
          color: #FFFFFF;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1px;
          padding: 4px 10px;
          border-radius: 3px;
          text-transform: uppercase;
        }}
        .title {{
          font-size: 22px;
          font-weight: 800;
          color: #FFFFFF;
          margin-top: 14px;
          letter-spacing: 0.5px;
        }}
        .otp-box {{
          background: #0D0D14;
          border: 2px dashed #00E5FF;
          border-radius: 8px;
          text-align: center;
          padding: 20px;
          margin: 24px 0;
        }}
        .otp-code {{
          font-family: 'Courier New', Courier, monospace;
          font-size: 38px;
          font-weight: 900;
          letter-spacing: 10px;
          color: #AAFF00;
        }}
        .footer {{
          font-size: 12px;
          color: #94A3B8;
          border-top: 1px solid #232332;
          padding-top: 18px;
          margin-top: 24px;
          line-height: 1.6;
        }}
      </style>
    </head>
    <body>
      <div class="container">
        <div>
          <span class="badge">vault-68 // SECURE VAULT</span>
        </div>
        <h1 class="title">CITIZEN VERIFICATION CODE</h1>
        <p style="color: #CBD5E1; font-size: 14px; line-height: 1.6;">
          Hello <strong>{recipient_name}</strong>,<br>
          A request was initiated to access your encrypted citizen documents on <strong>vault-68</strong>.
        </p>

        <div class="otp-box">
          <div style="font-size: 11px; color: #00E5FF; letter-spacing: 2px; margin-bottom: 8px; font-weight: 700;">
            ONE-TIME VERIFICATION CODE
          </div>
          <div class="otp-code">{otp}</div>
          <div style="font-size: 11px; color: #94A3B8; margin-top: 8px;">
            VALID FOR 5 MINUTES • DO NOT SHARE
          </div>
        </div>

        <p style="color: #94A3B8; font-size: 13px; line-height: 1.6;">
          If you did not initiate this request, your account remains secure. No action is required.
        </p>

        <div class="footer">
          <strong>vault-68 Citizen Vault Gateway</strong><br>
          Encrypted Legal Document Infrastructure • Powered by Resend
        </div>
      </div>
    </body>
    </html>
    """

    delivery_status = "simulated_local"
    error_details = None
    resend_id = None

    masked_key = (
        f"{resend_api_key[:7]}...{resend_api_key[-4:]} (len: {len(resend_api_key)})"
        if resend_api_key and len(resend_api_key) > 12
        else ("CONFIGURED" if resend_api_key else "NOT SET")
    )

    print("\n" + "╔" + "═" * 68 + "╗", flush=True)
    print("║  [RESEND DISPATCH AUDIT] 📧 INITIATING CITIZEN EMAIL OTP           ║", flush=True)
    print("╠" + "═" * 68 + "╣", flush=True)
    print(f"║  Target Recipient : {email:<46} ║", flush=True)
    print(f"║  Citizen Name     : {recipient_name:<46} ║", flush=True)
    print(f"║  Sender ('from')  : {from_email:<46} ║", flush=True)
    print(f"║  API Key Status   : {masked_key:<46} ║", flush=True)
    print(f"║  Timestamp (UTC)  : {time.strftime('%Y-%m-%d %H:%M:%S', time.gmtime()):<46} ║", flush=True)

    if resend_api_key and resend_api_key.strip():
        try:
            resend.api_key = resend_api_key.strip()
            params: resend.Emails.SendParams = {
                "from": from_email,
                "to": [email],
                "subject": f"Your vault-68 Verification Code: {otp}",
                "html": html_content,
            }
            resend_resp = resend.Emails.send(params)
            delivery_status = "resend_dispatched"
            resend_id = resend_resp.get("id") if isinstance(resend_resp, dict) else getattr(resend_resp, "id", "sent")
            print("╟" + "─" * 68 + "╢", flush=True)
            print(f"║  Delivery Result  : ✅ RESEND DISPATCHED (ID: {resend_id}){' ' * max(0, 31 - len(str(resend_id)))}║", flush=True)
        except Exception as err:
            delivery_status = "resend_error"
            err_type = type(err).__name__
            err_code = getattr(err, "code", getattr(err, "status_code", 500))
            err_msg = getattr(err, "message", str(err))
            err_suggested = getattr(err, "suggested_action", "")

            # Formulate user-friendly diagnostic guidance
            hint = ""
            if err_code == 403 or "only send testing emails" in str(err_msg).lower():
                hint = (
                    "Resend Free Sandbox Limitation: When using 'onboarding@resend.dev', you can ONLY "
                    "send testing emails to the email address registered with your Resend account. "
                    "To send to any recipient, verify a custom domain at https://resend.com/domains."
                )
            elif err_code == 401 or "api key" in str(err_msg).lower():
                hint = "Resend Authentication Error: Check that RESEND_API_KEY in .env is valid."
            elif err_code == 422:
                hint = "Resend Validation Error: The 'to' or 'from' email format was rejected by Resend."
            else:
                hint = "Review the raw error details below and check Resend dashboard logs."

            error_details = {
                "type": err_type,
                "code": err_code,
                "message": str(err_msg),
                "suggested_action": str(err_suggested) if err_suggested else None,
                "hint": hint
            }

            print("╟" + "─" * 68 + "╢", flush=True)
            print("║  Delivery Result  : ❌ RESEND ERROR OCCURRED                         ║", flush=True)
            print(f"║  Exception Class  : {err_type:<46} ║", flush=True)
            print(f"║  HTTP / Err Code  : {str(err_code):<46} ║", flush=True)
            print(f"║  Error Message    : {str(err_msg)[:46]:<46} ║", flush=True)
            if len(str(err_msg)) > 46:
                print(f"║                     {str(err_msg)[46:92]:<46} ║", flush=True)
            if err_suggested:
                print(f"║  Suggested Action : {str(err_suggested)[:46]:<46} ║", flush=True)
            if hint:
                print(f"║  Diagnostic Hint  : 💡 {hint[:43]:<43} ║", flush=True)
                if len(hint) > 43:
                    print(f"║                     {hint[43:89]:<46} ║", flush=True)
                if len(hint) > 89:
                    print(f"║                     {hint[89:135]:<46} ║", flush=True)
            tb_last = traceback.format_exc().strip().splitlines()[-1] if traceback.format_exc().strip() else ""
            print(f"║  Traceback Line   : {tb_last[:46]:<46} ║", flush=True)
    else:
        delivery_status = "simulated_local"
        error_details = {
            "type": "ConfigNotice",
            "code": 0,
            "message": "RESEND_API_KEY is not configured in .env",
            "hint": "Add your Resend API Key to .env to enable real email dispatch."
        }
        print("╟" + "─" * 68 + "╢", flush=True)
        print("║  Delivery Result  : ⚠️  SIMULATED LOCAL MODE (No RESEND_API_KEY)     ║", flush=True)

    # Developer Local Override: Always log OTP to server console for testing convenience
    print("╟" + "─" * 68 + "╢", flush=True)
    print(f"║  🔐 LOCAL DEV OTP CODE : >>> {otp} <<< (Use in UI to test)   ║", flush=True)
    print("╚" + "═" * 68 + "╝\n", flush=True)

    return {
        "status": delivery_status,
        "id": resend_id,
        "error_details": error_details
    }

@app.get("/api/health")
def health_check():
    resend_key = os.getenv("RESEND_API_KEY")
    return {
        "status": "online",
        "service": "vault-68-auth-engine",
        "auth_engine": "resend-email-otp",
        "resend_configured": bool(resend_key and resend_key.strip())
    }

@app.get("/api/debug/resend")
def debug_resend():
    """
    Live diagnostic endpoint to inspect Resend API configuration,
    key validity, verified domains, and sandbox mode limitations.
    """
    resend_key = os.getenv("RESEND_API_KEY", "")
    from_email = os.getenv("RESEND_FROM_EMAIL", "vault-68 <onboarding@resend.dev>")

    key_configured = bool(resend_key and resend_key.strip())
    masked_key = (
        f"{resend_key[:7]}...{resend_key[-4:]} ({len(resend_key)} chars)"
        if key_configured and len(resend_key) > 12
        else ("CONFIGURED" if key_configured else "NOT SET")
    )

    domains_result = None
    account_mode = "unknown"
    error = None

    if key_configured:
        try:
            resend.api_key = resend_key.strip()
            domains_data = resend.Domains.list()
            domains_list = domains_data.get("data", []) if isinstance(domains_data, dict) else []
            verified_domains = [d.get("name") for d in domains_list if d.get("status") == "verified"]

            if not domains_list:
                account_mode = "sandbox_restricted (No custom domains configured. Can ONLY deliver from 'onboarding@resend.dev' to your registered Resend account email)"
            elif not verified_domains:
                account_mode = "domains_pending_verification (Custom domains configured but pending DNS verification)"
            else:
                account_mode = f"production_ready (Verified domains: {', '.join(verified_domains)})"

            domains_result = {
                "total_domains": len(domains_list),
                "verified_domains": verified_domains,
                "domains": [{"name": d.get("name"), "status": d.get("status")} for d in domains_list]
            }
        except Exception as e:
            error = {
                "type": type(e).__name__,
                "code": getattr(e, "code", None),
                "message": getattr(e, "message", str(e))
            }
            account_mode = "api_error"

    return {
        "status": "online",
        "api_key_configured": key_configured,
        "api_key_preview": masked_key,
        "from_email": from_email,
        "account_mode": account_mode,
        "domains": domains_result,
        "error": error,
        "troubleshooting_guide": {
            "sandbox_restriction": "With 'onboarding@resend.dev', Resend only allows sending to the email registered on your Resend account.",
            "unverified_recipients": "To send to any recipient, verify a domain at https://resend.com/domains and set RESEND_FROM_EMAIL to an address on that domain.",
            "local_testing": "The OTP code is always printed to this server terminal on every request so you can authenticate even if Resend restricts the recipient."
        }
    }

class DebugTestEmailRequest(BaseModel):
    email: str = Field(..., description="Target email for diagnostic test")

@app.post("/api/debug/resend-test")
def debug_resend_test(payload: DebugTestEmailRequest):
    """
    Directly tests email delivery via Resend and returns full error and diagnostic output.
    """
    test_otp = f"{secrets.randbelow(1000000):06d}"
    result = send_email_via_resend(payload.email.strip().lower(), test_otp, "Diagnostic Tester")
    return {
        "target": payload.email,
        "test_otp": test_otp,
        "delivery_result": result
    }

@app.post("/api/auth/send-otp")
def send_otp(payload: SendOtpRequest):
    clean_email = payload.email.strip().lower()

    if not is_valid_email(clean_email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email address. Please enter a valid email."
        )

    # Generate cryptographically secure 6-digit numeric OTP
    otp_code = f"{secrets.randbelow(1000000):06d}"
    validity_seconds = 300  # 5 minutes

    # Store session in memory
    otp_sessions[clean_email] = {
        "otp": otp_code,
        "name": payload.name.strip() if payload.name and payload.name.strip() else "ALEXANDER VANCE",
        "created_at": time.time(),
        "expires_at": time.time() + validity_seconds,
        "attempts": 0
    }

    # Dispatch email via Resend
    resend_result = send_email_via_resend(clean_email, otp_code, payload.name)
    is_dispatched = resend_result["status"] == "resend_dispatched"

    # Return status and comprehensive debugging info
    return {
        "status": "success" if is_dispatched else "warning",
        "message": (
            f"Verification code dispatched via email to {clean_email}"
            if is_dispatched
            else f"Resend Error: {resend_result['error_details']['message'] if resend_result.get('error_details') else 'Could not dispatch email'}"
        ),
        "email": clean_email,
        "expires_in": validity_seconds,
        "delivery": resend_result["status"],
        "debug": resend_result.get("error_details")
    }

@app.post("/api/auth/verify-otp")
def verify_otp(payload: VerifyOtpRequest):
    clean_email = payload.email.strip().lower()
    clean_otp = payload.otp.strip()

    session = otp_sessions.get(clean_email)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active OTP session found for this email address. Please request a new code."
        )

    # Check expiration
    if time.time() > session.get("expires_at", 0):
        otp_sessions.pop(clean_email, None)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code has expired. Please request a new code."
        )

    # Prevent brute-force attempts
    session["attempts"] = session.get("attempts", 0) + 1
    if session["attempts"] > 5:
        otp_sessions.pop(clean_email, None)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Too many incorrect attempts. Session invalidated. Please request a new code."
        )

    # Cryptographic constant-time comparison
    expected_otp = session.get("otp", "")
    if not hmac.compare_digest(expected_otp, clean_otp):
        remaining = 5 - session["attempts"]
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid verification code. {remaining} attempt(s) remaining."
        )

    # Code verified: consume session to prevent replay
    citizen_name = session.get("name", "ALEXANDER VANCE")
    otp_sessions.pop(clean_email, None)

    # Persist or update citizen in Supabase database
    citizen_record = supabase_db.upsert_citizen(clean_email, citizen_name)

    return {
        "status": "success",
        "verified": True,
        "message": "OTP verified successfully via Resend email authentication",
        "citizen": {
            "name": citizen_record.get("name", citizen_name),
            "email": clean_email,
            "auth_method": "resend_email_otp",
            "authenticated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        },
        "supabase": supabase_db.get_status()["configured"]
    }

class AddDocumentRequest(BaseModel):
    email: str = Field(..., description="Citizen email address")
    document: dict = Field(..., description="Document object to store in Supabase")

class SyncDocumentsRequest(BaseModel):
    email: str = Field(..., description="Citizen email address")
    name: Optional[str] = Field(None, description="Citizen full name")

@app.get("/api/supabase/status")
def supabase_status():
    """
    Returns live connectivity and table status for Supabase integration.
    """
    return supabase_db.get_status()

@app.get("/api/documents")
def get_citizen_documents(email: str):
    """
    Fetches all authenticated credentials for a citizen from Supabase.
    """
    clean_email = email.strip().lower()
    docs = supabase_db.get_documents(clean_email)
    return {
        "status": "success",
        "email": clean_email,
        "count": len(docs),
        "documents": docs,
        "source": "supabase" if supabase_db.get_status()["configured"] else "local_memory"
    }

@app.post("/api/documents")
def add_citizen_document(payload: AddDocumentRequest):
    """
    Inserts a newly uploaded citizen document into Supabase.
    """
    clean_email = payload.email.strip().lower()
    saved = supabase_db.add_document(clean_email, payload.document)
    return {
        "status": "success",
        "email": clean_email,
        "document": saved,
        "source": "supabase" if supabase_db.get_status()["configured"] else "local_memory"
    }

@app.post("/api/documents/sync")
def sync_citizen_documents(payload: SyncDocumentsRequest):
    """
    Returns the citizen's documents from Supabase. No hardcoded or mock documents are generated.
    """
    clean_email = payload.email.strip().lower()
    docs = supabase_db.get_documents(clean_email)
    return {
        "status": "success",
        "email": clean_email,
        "count": len(docs),
        "documents": docs,
        "source": "supabase" if supabase_db.get_status()["configured"] else "local_memory"
    }

@app.delete("/api/documents/{doc_id}")
def delete_citizen_document(doc_id: str, email: str):
    """
    Deletes a citizen document from Supabase.
    """
    clean_email = email.strip().lower()
    success = supabase_db.delete_document(clean_email, doc_id)
    return {
        "status": "success" if success else "failed",
        "doc_id": doc_id,
        "email": clean_email
    }

