from typing import Optional
from datetime import date, datetime, time
from pydantic import BaseModel, Field
from backend.app.models.enums import AppointmentStatus, AppointmentType, QueueState


from pydantic import BaseModel, Field, model_validator


class BookAppointmentRequest(BaseModel):
    doctor_id: str
    appointment_date: Optional[date] = None
    start_time: Optional[str] = Field(None, description="Format: HH:MM or HH:MM:SS, e.g. 10:20")
    scheduled_start: Optional[str] = Field(None, description="ISO timestamp, e.g. 2026-09-30T10:00:00")
    appointment_type: Optional[str] = "NEW_CONSULT"
    reason_for_visit: Optional[str] = None
    chief_complaint: Optional[str] = None
    hospital_id: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def normalize_fields(cls, data: any) -> any:
        if isinstance(data, dict):
            # Parse scheduled_start if appointment_date / start_time not set
            sched = data.get("scheduled_start")
            if sched and "T" in str(sched):
                parts = str(sched).split("T")
                if not data.get("appointment_date"):
                    data["appointment_date"] = parts[0]
                if not data.get("start_time"):
                    data["start_time"] = parts[1][:5]

            # Default date to today if missing
            if not data.get("appointment_date"):
                data["appointment_date"] = date.today().isoformat()

            # Default start time to 09:00 if missing
            if not data.get("start_time"):
                data["start_time"] = "09:00"

            # Normalize appointment_type enum string
            raw_type = str(data.get("appointment_type", "NEW_CONSULT")).upper()
            if raw_type in ["IN_PERSON", "OFFLINE", "REGULAR", "NEW_CONSULT"]:
                data["appointment_type"] = "NEW_CONSULT"
            elif raw_type in ["FOLLOW_UP", "FOLLOWUP"]:
                data["appointment_type"] = "FOLLOW_UP"
            elif raw_type in ["REPORT_REVIEW", "REVIEW"]:
                data["appointment_type"] = "REPORT_REVIEW"
            else:
                data["appointment_type"] = "NEW_CONSULT"

            # Bridge chief_complaint to reason_for_visit
            if not data.get("reason_for_visit") and data.get("chief_complaint"):
                data["reason_for_visit"] = data.get("chief_complaint")
        return data


class QueueTicketSummary(BaseModel):
    id: str
    ticket_number: str
    sequence_number: int
    check_in_time: datetime
    called_time: Optional[datetime] = None
    state: QueueState
    estimated_wait_minutes: int
    patients_ahead: Optional[int] = 0

    class Config:
        from_attributes = True


class AppointmentResponse(BaseModel):
    id: str
    booking_reference: str
    patient_id: str
    doctor_id: str
    doctor_name: str
    doctor_specialization: str
    hospital_id: str
    hospital_name: str
    hospital_address: str
    room_number: Optional[str] = None
    appointment_date: date
    start_time: time
    end_time: time
    appointment_type: AppointmentType
    status: AppointmentStatus
    reason_for_visit: Optional[str] = None
    created_at: datetime
    scheduled_start: Optional[str] = None
    queue_ticket: Optional[QueueTicketSummary] = None

    class Config:
        from_attributes = True


class CheckInRequest(BaseModel):
    appointment_id: str
    qr_token: Optional[str] = None
