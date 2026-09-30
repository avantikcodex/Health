from typing import Optional
from datetime import date, datetime, time
from pydantic import BaseModel, Field
from backend.app.models.enums import AppointmentStatus, AppointmentType, QueueState


class BookAppointmentRequest(BaseModel):
    doctor_id: str
    appointment_date: date
    start_time: str = Field(..., description="Format: HH:MM or HH:MM:SS, e.g. 10:20")
    appointment_type: AppointmentType = AppointmentType.NEW_CONSULT
    reason_for_visit: Optional[str] = None


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
    queue_ticket: Optional[QueueTicketSummary] = None

    class Config:
        from_attributes = True


class CheckInRequest(BaseModel):
    appointment_id: str
    qr_token: Optional[str] = None
