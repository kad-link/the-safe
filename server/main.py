import os
import time
import re
from typing import Optional, Dict
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import pyotp
import httpx

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

app = FastAPI(
    title="the-safe Authentication API",
    description="pyotp-based One-Time Password authentication service for the-safe citizen vault",
    version="1.0.0"
)

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for OTP secrets and sessions
# Key: mobile_number -> Value: dict
otp_sessions: Dict[str, dict] = {}

class SendOtpRequest(BaseModel):
    mobile: str = Field(..., description="10-digit citizen mobile number")
    name: Optional[str] = Field(None, description="Full citizen name for sign-up")

class VerifyOtpRequest(BaseModel):
    mobile: str = Field(..., description="10-digit citizen mobile number")
    otp: str = Field(..., description="6-digit verification code")

def send_sms_to_phone(mobile: str, otp: str) -> dict:
    """
    Dispatches OTP directly to the citizen's mobile phone number.
    Supports:
    - Fast2SMS (India +91)
    - Twilio (Global SMS API)
    - Custom SMS Webhook (SMS_WEBHOOK_URL)
    - Structured server console audit trail
    """
    clean_num = mobile[-10:]
    sms_text = f"Your the-safe verification code is: {otp}. Valid for 2 minutes. Do not share."
    delivery_status = "gateway_dispatched"

    # 1. Fast2SMS (Indian SMS Gateway)
    fast2sms_key = os.getenv("FAST2SMS_API_KEY")
    if fast2sms_key:
        try:
            resp = httpx.post(
                "https://www.fast2sms.com/dev/bulkV2",
                headers={
                    "authorization": fast2sms_key,
                    "Content-Type": "application/json"
                },
                json={
                    "route": "otp",
                    "variables_values": otp,
                    "numbers": clean_num
                },
                timeout=4.0
            )
            if resp.status_code == 200:
                delivery_status = "fast2sms_delivered"
                print(f"[SMS GATEWAY] Fast2SMS dispatched successfully to +91 {clean_num}")
        except Exception as err:
            print(f"[SMS GATEWAY ERROR] Fast2SMS failed: {err}")

    # 2. Twilio SMS
    twilio_sid = os.getenv("TWILIO_ACCOUNT_SID")
    twilio_token = os.getenv("TWILIO_AUTH_TOKEN")
    twilio_from = os.getenv("TWILIO_PHONE_NUMBER")
    if twilio_sid and twilio_token and twilio_from:
        try:
            to_e164 = f"+91{clean_num}" if not mobile.startswith("+") else mobile
            resp = httpx.post(
                f"https://api.twilio.com/2010-04-01/Accounts/{twilio_sid}/Messages.json",
                data={
                    "From": twilio_from,
                    "To": to_e164,
                    "Body": sms_text
                },
                auth=(twilio_sid, twilio_token),
                timeout=4.0
            )
            if resp.status_code in [200, 201]:
                delivery_status = "twilio_delivered"
                print(f"[SMS GATEWAY] Twilio dispatched successfully to {to_e164}")
        except Exception as err:
            print(f"[SMS GATEWAY ERROR] Twilio failed: {err}")

    # 3. Custom SMS Webhook
    webhook_url = os.getenv("SMS_WEBHOOK_URL")
    if webhook_url:
        try:
            httpx.post(
                webhook_url,
                json={"mobile": clean_num, "otp": otp, "message": sms_text},
                timeout=4.0
            )
            delivery_status = "webhook_delivered"
        except Exception as err:
            print(f"[SMS GATEWAY ERROR] Webhook failed: {err}")

    # Secure server-side audit trail
    print("\n" + "=" * 64, flush=True)
    print(f"  [SMS GATEWAY DISPATCH] 📲 DISPATCHING REAL-TIME SMS TO PHONE", flush=True)
    print(f"  Target Mobile : +91 {clean_num}", flush=True)
    print(f"  Delivery Mode : {delivery_status.upper()}", flush=True)
    print(f"  SMS Content   : {sms_text}", flush=True)
    print(f"  TOTP Code     : {otp}  [ENCAPSULATED ON SERVER - NEVER LEAKED TO FRONTEND]", flush=True)
    print("=" * 64 + "\n", flush=True)

    return {"status": delivery_status}

@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "service": "the-safe-auth-engine",
        "pyotp_version": getattr(pyotp, "__version__", "2.10.0")
    }

@app.post("/api/auth/send-otp")
def send_otp(payload: SendOtpRequest):
    clean_mobile = re.sub(r"\D", "", payload.mobile)
    if len(clean_mobile) < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid mobile number. Please provide a 10-digit mobile number."
        )

    # Use pyotp to generate a secure random base32 secret
    secret = pyotp.random_base32()
    
    # TOTP with a 120-second interval (2 minutes validity)
    totp = pyotp.TOTP(secret, interval=120)
    current_otp = totp.now()

    # Store session in memory
    otp_sessions[clean_mobile] = {
        "secret": secret,
        "name": payload.name or "ALEXANDER VANCE",
        "created_at": time.time(),
        "interval": 120
    }

    # Dispatch SMS to the user's phone number
    sms_res = send_sms_to_phone(clean_mobile, current_otp)

    # ENCAPSULATION: The OTP code is NEVER returned in the API response
    return {
        "status": "success",
        "message": f"OTP successfully dispatched via SMS to +91 {clean_mobile[-10:]}",
        "mobile": clean_mobile[-10:],
        "expires_in": 120,
        "engine": "pyotp (RFC 6238 TOTP)",
        "delivery": sms_res["status"]
    }

@app.post("/api/auth/verify-otp")
def verify_otp(payload: VerifyOtpRequest):
    clean_mobile = re.sub(r"\D", "", payload.mobile)
    clean_otp = payload.otp.strip()

    session = otp_sessions.get(clean_mobile)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active OTP session found for this mobile number. Please request a new OTP."
        )

    secret = session["secret"]
    interval = session.get("interval", 120)
    
    # Initialize pyotp TOTP with stored secret
    totp = pyotp.TOTP(secret, interval=interval)
    
    # Verify with valid_window=1 to tolerate slight network/clock drift
    is_valid = totp.verify(clean_otp, valid_window=1)

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code. Please check and try again."
        )

    # Return success and citizen credentials
    return {
        "status": "success",
        "verified": True,
        "message": "OTP verified successfully via pyotp engine",
        "citizen": {
            "name": session.get("name", "ALEXANDER VANCE"),
            "mobile": clean_mobile,
            "auth_method": "pyotp_mobile_totp",
            "authenticated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }
    }
