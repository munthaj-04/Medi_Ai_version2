import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from twilio.rest import Client

router = APIRouter(prefix="/sms", tags=["sms"])

# Mock credentials or read from .env
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "ACmock_sid")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "mock_token")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER", "+1234567890")

class SMSRequest(BaseModel):
    phone: str
    message: str

@router.post("/send")
def send_sms(req: SMSRequest):
    try:
        if TWILIO_ACCOUNT_SID == "ACmock_sid":
            print(f"[TWILIO MOCK] Sending SMS to {req.phone}: {req.message}")
            return {"status": "success", "message": "Mock SMS sent successfully"}

        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        message = client.messages.create(
            body=req.message,
            from_=TWILIO_PHONE_NUMBER,
            to=req.phone
        )
        print(f"[TWILIO] SMS Sent! SID: {message.sid}")
        return {"status": "success", "sid": message.sid}
    except Exception as e:
        print(f"[TWILIO ERROR] {e}")
        return {"status": "error", "message": str(e)}
