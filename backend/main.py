"""
MediAI Backend — LangChain Multi-lingual Medical Chat System
Powered by DeepSeek API + LangChain + PostgreSQL (SQLAlchemy)
Supports: English, Hindi (हिंदी), Telugu (తెలుగు)
"""
import json
import os
import random
import datetime
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from openai import OpenAI

# Custom imports
from rag import rag_engine
from mcp_tools import MCP_TOOLS
from database import get_db, init_db
from models import Appointment, PatientSession
from payments import router as payments_router
from sms import router as sms_router

load_dotenv()

DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")
DATABASE_URL = os.getenv("DATABASE_URL", "")

# ─── Startup: Initialize DB (modern lifespan approach) ──────────────────────
@asynccontextmanager
async def lifespan(app_instance: FastAPI):
    # Startup
    try:
        init_db()
    except Exception as e:
        print(f"[DB WARNING] Could not initialize database: {e}")
        print("[DB] Continuing without DB persistence.")
    yield
    # Shutdown (nothing needed)

app = FastAPI(
    title="MediAI API — LangChain Multilingual",
    version="2.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(payments_router)
app.include_router(sms_router)

# ─── LLM Client Setup (OpenAI-compatible) ────────────────────────────────────
if DEEPSEEK_API_KEY:
    llm_client = OpenAI(
        api_key=DEEPSEEK_API_KEY,
        base_url="https://api.deepseek.com/v1"
    )
    MODEL_NAME = "deepseek-chat"
else:
    llm_client = OpenAI(
        api_key="ollama",
        base_url="http://localhost:11434/v1"
    )
    MODEL_NAME = "llama3:latest"

# ─── Pydantic Models ─────────────────────────────────────────────────────────
class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    patient_name: Optional[str] = "Patient"
    session_id: Optional[str] = None

# ─── Tool Definitions (LangChain-compatible) ─────────────────────────────────
tools_schema = [
    {
        "type": "function",
        "function": {
            "name": "find_nearest_hospital",
            "description": "Finds nearest hospitals when AI determines pain scale is 4 or 5. MUST call when pain is severe.",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {"type": "string", "description": "Current location of the user"}
                },
                "required": ["location"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "check_availability",
            "description": "Checks available appointment timeslots at a hospital",
            "parameters": {
                "type": "object",
                "properties": {
                    "hospital_id": {"type": "string"}
                },
                "required": ["hospital_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "book_appointment",
            "description": "Books a medical appointment. Saves to database.",
            "parameters": {
                "type": "object",
                "properties": {
                    "hospital_id": {"type": "string"},
                    "time": {"type": "string"},
                    "patient_name": {"type": "string"}
                },
                "required": ["hospital_id", "time", "patient_name"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "generate_doctor_report",
            "description": "Generates a clinical report for the doctor with patient symptoms and AI diagnosis",
            "parameters": {
                "type": "object",
                "properties": {
                    "patient_name": {"type": "string"},
                    "symptoms": {"type": "array", "items": {"type": "string"}},
                    "diagnosis": {"type": "string"},
                    "urgency": {"type": "string"},
                    "pain_scale": {"type": "string"}
                },
                "required": ["patient_name", "symptoms", "diagnosis", "urgency", "pain_scale"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "send_notification",
            "description": "Sends SMS alert to patient and doctor",
            "parameters": {
                "type": "object",
                "properties": {
                    "recipient_phone": {"type": "string"},
                    "message": {"type": "string"}
                },
                "required": ["recipient_phone", "message"]
            }
        }
    }
]

# ─── Multilingual System Prompt ───────────────────────────────────────────────
def build_system_prompt(rag_context: str = "") -> str:
    return f"""You are MediAI, an advanced AI Medical Emergency Triage Assistant with expertise in:
- Emergency Medicine
- Internal Medicine (Adult symptoms)
- Pediatrics (Child symptoms)
- Neurology, Cardiology, Gastroenterology, Orthopedics, Gynecology, and Urology

═══════════════════════════════════════════════════
🌐 MULTILINGUAL CAPABILITY — CRITICAL INSTRUCTIONS:
- You MUST detect the input language automatically.
- You MUST respond in the SAME language the user used.
- You support: English, Hindi (हिंदी), Telugu (తెలుగు).
- If user types in Hindi or Telugu, respond fully in that language with medical terminology.
- Example Telugu: "మీకు జ్వరం, తలనొప్పి ఉన్నాయా? మీ నొప్పి స్థాయి ఏమిటి?"
- Example Hindi: "क्या आपको बुखार और सिर दर्द है? आपका दर्द स्केल क्या है?"
════════════════════════════════════════════════════

📋 YOUR DUTIES:
1. INTRODUCTION: First message must always be: "Namaste! I am MediAI, your Emergency Triage Assistant, specialized in Emergency Medicine and General Practice. Please describe your symptoms — I support English, Hindi, and Telugu."
2. ASK strategic follow-up questions to narrow down the diagnosis.
3. REFERENCE the RAG Medical Data below to base your diagnosis.
4. ASSIGN a Pain Scale: "PAIN SCALE: X/5" — ALWAYS include this explicitly.
5. For Pain Scale 1-3: Provide home care advice, medication suggestions, and when to see a doctor.
6. For Pain Scale 4-5 (SEVERE/CRITICAL): You MUST immediately use ALL these tools in order:
   a. find_nearest_hospital
   b. check_availability
   c. book_appointment
   d. generate_doctor_report
   e. send_notification

🚨 RED FLAGS (trigger Pain Scale 4-5 immediately):
- Chest pain with arm/jaw radiation → Heart Attack
- Thunderclap headache → Subarachnoid Hemorrhage
- Non-blanching rash with fever in child → Meningococcal Disease
- Positive pregnancy test + pelvic pain → Ectopic Pregnancy
- Facial drooping + arm weakness → Stroke
- Sudden severe eye pain with vision loss → Glaucoma
- Bladder/bowel incontinence with back pain → Cauda Equina

{f"📚 RAG MEDICAL KNOWLEDGE BASE CONTEXT:{chr(10)}{rag_context}" if rag_context else ""}

Keep responses empathetic, clear, and professional in the detected language."""


# ─── Pain Scale Extractor ─────────────────────────────────────────────────────
def extract_pain_scale(text: str) -> int:
    import re
    # Look for patterns like "Pain Scale: 4", "Pain: 3", "**PAIN SCALE** 5/5", "3/5 scale"
    patterns = [
        r'PAIN SCALE[:\s\*]*(\d)', 
        r'PAIN[:\s\*]*(\d)',
        r'(\d)/5'
    ]
    
    upper = text.upper()
    for pattern in patterns:
        match = re.search(pattern, upper)
        if match:
            val = int(match.group(1))
            if 1 <= val <= 5:
                return val
    return 0


# ─── Helper: Persist Appointment to PostgreSQL ───────────────────────────────
def save_appointment_to_db(
    db: Session,
    hospital_id: str,
    hospital_name: str,
    patient_name: str,
    time: str,
    symptoms: str = "",
    diagnosis: str = "",
    pain_scale: int = 0
) -> str:
    booking_id = f"BKG-{random.randint(10000, 99999)}"
    appointment = Appointment(
        booking_id=booking_id,
        patient_name=patient_name,
        hospital_id=hospital_id,
        hospital_name=hospital_name,
        appointment_time=time,
        appointment_date=datetime.datetime.now().strftime("%Y-%m-%d"),
        symptoms=symptoms,
        diagnosis=diagnosis,
        pain_scale=pain_scale,
        status="confirmed"
    )
    try:
        db.add(appointment)
        db.commit()
        db.refresh(appointment)
        print(f"[DB] Appointment saved: {booking_id} for {patient_name}")
    except Exception as e:
        db.rollback()
        print(f"[DB ERROR] Could not save appointment: {e}")
    return booking_id


# ─── API Endpoints ────────────────────────────────────────────────────────────
@app.get("/")
def read_root():
    return {"status": "ok", "message": "MediAI LangChain API v2.0 running", "db": "PostgreSQL"}


class AppointmentCreate(BaseModel):
    hospital_id: str
    hospital_name: str
    patient_name: str
    time: str
    symptoms: str = ""
    diagnosis: str = ""
    pain_scale: int = 0
    recommended_specialist: str = ""
    slot: str = ""

@app.post("/api/appointments")
def create_appointment(data: AppointmentCreate, db: Session = Depends(get_db)):
    """Creates a permanent appointment after Stripe success or Emergency flow"""
    # Use 'MED-' for normal, 'EMG-' for emergency
    prefix = "EMG-" if data.pain_scale >= 4 else "MED-"
    booking_id = f"{prefix}{random.randint(10000, 99999)}"
    appointment = Appointment(
        booking_id=booking_id,
        patient_name=data.patient_name,
        hospital_id=data.hospital_id,
        hospital_name=data.hospital_name,
        appointment_time=data.slot or data.time or ("Immediate Dispatch" if data.pain_scale >= 4 else "TBD"),
        appointment_date=datetime.datetime.now().strftime("%Y-%m-%d"),
        symptoms=data.symptoms,
        diagnosis=data.diagnosis,
        pain_scale=data.pain_scale,
        recommended_specialist=data.recommended_specialist,
        status="emergency_dispatched" if data.pain_scale >= 4 else "confirmed"
    )
    try:
        db.add(appointment)
        db.commit()
        db.refresh(appointment)
        return {"status": "success", "booking_id": booking_id, "data": appointment.to_dict()}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/appointments")
def get_appointments(hospital_id: str = None, db: Session = Depends(get_db)):
    """Retrieve appointments, optionally filtered by hospital_id for the SaaS dashboard."""
    try:
        query = db.query(Appointment)
        if hospital_id:
            query = query.filter(Appointment.hospital_id == hospital_id)
            
        appointments = query.order_by(Appointment.created_at.desc()).all()
        return {"appointments": [a.to_dict() for a in appointments]}
    except Exception as e:
        return {"appointments": [], "error": str(e)}


@app.post("/chat")
def chat_endpoint(request: ChatRequest, db: Session = Depends(get_db)):
    try:
        from mediai_router import chat as mediai_chat
        
        latest_user_msg = next(
            (msg.content for msg in reversed(request.messages) if msg.role == "user"), ""
        )
        
        # Enforce Freemium logic
        session_id = request.session_id or "default-session"
        patient_session = db.query(PatientSession).filter(PatientSession.session_id == session_id).first()
        if not patient_session:
            patient_session = PatientSession(session_id=session_id)
            db.add(patient_session)
            db.commit()
            
        if patient_session.message_count >= 5 and not patient_session.is_premium:
            return {
                "reply": "You have reached the limit of free messages (5) on the Basic tier. Please upgrade to MediAI Plus to continue unlimited medical consulting, or securely book an emergency appointment now.\n\n[PAYWALL_TRIGGERED]", 
                "pain_scale": 0, 
                "actions": []
            }
            
        patient_session.message_count += 1
        db.commit()
        
        # Build history for router
        history = []
        for m in request.messages[:-1]:
            history.append({"role": m.role, "content": m.content})
            
        result = mediai_chat(latest_user_msg, history)
        
        # Extract Pain Scale from AI's reply
        pain_scale = extract_pain_scale(result.get("reply", ""))
        result["pain_scale"] = pain_scale
        
        # Make the response format match the frontend expectations smoothly
        # The frontend might expect "reply" instead of just passing the dictionary, which router returns via "reply" key
        return result
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"{type(e).__name__}: {str(e)}")



if __name__ == "__main__":
    import uvicorn
    print("[MediAI] Starting server on http://0.0.0.0:8000")
    print("[MediAI] Press CTRL+C once to stop gracefully")
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=False,         # NO reload — prevents crashes on file save
        log_level="info"
    )

