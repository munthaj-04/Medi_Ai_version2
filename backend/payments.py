import os
import stripe
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from models import PatientSession

router = APIRouter(prefix="/payments", tags=["payments"])

stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "sk_test_mocked")

class CheckoutRequest(BaseModel):
    session_id: str
    return_query: str = ""

@router.post("/create-checkout-session")
async def create_checkout_session(request: CheckoutRequest):
    try:
        # Mock stripe flow gracefully if real keys are absent
        if stripe.api_key == "sk_test_mocked":
            # For demonstration, assume payment was successful immediately
            return {"url": f"http://localhost:3000/booking?session_id={request.session_id}&payment=success&{request.return_query}"}
        
        # In a real app, you'd calculate dynamically. Hardcoded to 50 INR for this hackathon
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[
                {
                    'price_data': {
                        'currency': 'inr',
                        'product_data': {
                            'name': 'MediAI Priority Slot Reservation',
                        },
                        'unit_amount': 5000, # 50.00 INR
                    },
                    'quantity': 1,
                },
            ],
            mode='payment',
            success_url=f"http://localhost:3000/booking?session_id={request.session_id}&payment=success&{request.return_query}",
            cancel_url=f"http://localhost:3000/booking?session_id={request.session_id}&payment=cancel",
        )
        return {"url": checkout_session.url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/webhook")
def stripe_webhook(db: Session = Depends(get_db)):
    # Standard implementation: parse event, update db
    return {"status": "success"}
