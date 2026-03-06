"""
SQLAlchemy ORM Models for MediAI.
Tables: appointments, patient_sessions
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Integer, Text, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import text

from database import Base


def gen_uuid():
    return str(uuid.uuid4())


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    booking_id = Column(String(20), unique=True, nullable=False)
    patient_name = Column(String(255), nullable=False, default="Patient")
    hospital_id = Column(String(50), nullable=False)
    hospital_name = Column(String(255), nullable=True)
    appointment_time = Column(String(50), nullable=False)
    appointment_date = Column(String(20), nullable=True)
    symptoms = Column(Text, nullable=True)          # comma-separated symptoms
    diagnosis = Column(String(255), nullable=True)
    pain_scale = Column(Integer, nullable=True)
    recommended_specialist = Column(String(255), nullable=True)
    status = Column(
        String(20),
        nullable=False,
        default="confirmed"
    )  # confirmed, cancelled, modified
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "booking_id": self.booking_id,
            "patient_name": self.patient_name,
            "hospital_id": self.hospital_id,
            "hospital_name": self.hospital_name,
            "appointment_time": self.appointment_time,
            "appointment_date": self.appointment_date,
            "symptoms": self.symptoms,
            "diagnosis": self.diagnosis,
            "pain_scale": self.pain_scale,
            "recommended_specialist": self.recommended_specialist,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class PatientSession(Base):
    __tablename__ = "patient_sessions"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    session_id = Column(String(36), unique=True, nullable=False, default=gen_uuid)
    language_detected = Column(String(50), nullable=True, default="English")
    symptoms_reported = Column(Text, nullable=True)
    final_diagnosis = Column(String(255), nullable=True)
    pain_scale = Column(Integer, nullable=True)
    message_count = Column(Integer, default=0)
    is_premium = Column(Integer, default=0)  # Use Integer as boolean fallback for SQLite compatibility
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "session_id": self.session_id,
            "language_detected": self.language_detected,
            "symptoms_reported": self.symptoms_reported,
            "final_diagnosis": self.final_diagnosis,
            "pain_scale": self.pain_scale,
        }
