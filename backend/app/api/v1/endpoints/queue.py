from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from backend.app.api.deps import RoleChecker, get_current_patient, get_current_user
from backend.app.core.database import get_db
from backend.app.models.appointment import Appointment, QueueTicket
from backend.app.models.enums import UserRole
from backend.app.models.hospital import DoctorProfile
from backend.app.models.user import PatientProfile, User
from backend.app.schemas.appointment import CheckInRequest
from backend.app.services.queue_service import QueueService

router = APIRouter(prefix="/queue", tags=["Live Queue & Check-in"])


class ReceptionCheckinRequest(BaseModel):
    appointment_id: str


@router.post("/checkin")
async def patient_checkin(
    payload: CheckInRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Appointment).where(Appointment.id == payload.appointment_id)
    res = await db.execute(stmt)
    appt = res.scalar_one_or_none()
    if not appt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found.")

    if current_user.role == UserRole.PATIENT:
        p_stmt = select(PatientProfile).where(PatientProfile.user_id == current_user.id)
        p_res = await db.execute(p_stmt)
        patient = p_res.scalar_one_or_none()
        if not patient or appt.patient_id != patient.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only check in for your own appointments.",
            )

    ticket = await QueueService.check_in_patient(
        db=db,
        appointment_id=payload.appointment_id,
        qr_token=payload.qr_token,
        is_reception_override=(current_user.role != UserRole.PATIENT),
    )

    return {
        "status": "CHECKED_IN",
        "ticket_id": ticket.id,
        "ticket_number": ticket.ticket_number,
        "sequence_number": ticket.sequence_number,
        "estimated_wait_minutes": ticket.estimated_wait_minutes,
        "message": f"Check-in successful. Your token is {ticket.ticket_number}.",
    }


@router.post("/reception-checkin")
async def reception_checkin(
    payload: ReceptionCheckinRequest,
    current_user: User = Depends(RoleChecker([UserRole.RECEPTIONIST, UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN])),
    db: AsyncSession = Depends(get_db),
):
    ticket = await QueueService.check_in_patient(
        db=db,
        appointment_id=payload.appointment_id,
        qr_token=None,
        is_reception_override=True,
    )
    return {
        "status": "CHECKED_IN",
        "ticket_id": ticket.id,
        "ticket_number": ticket.ticket_number,
        "sequence_number": ticket.sequence_number,
        "estimated_wait_minutes": ticket.estimated_wait_minutes,
        "message": f"Patient checked in successfully by reception. Token: {ticket.ticket_number}.",
    }


@router.get("/doctor/{doctor_id}")
async def get_doctor_queue(
    doctor_id: str,
    db: AsyncSession = Depends(get_db),
):
    return await QueueService.get_doctor_queue(db, doctor_id)


@router.post("/doctor/{doctor_id}/call-next")
async def doctor_call_next(
    doctor_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    ticket = await QueueService.call_next_patient(db, doctor_id)
    if not ticket:
        return {
            "status": "QUEUE_EMPTY",
            "message": "No patients currently waiting in queue.",
        }

    return {
        "status": "PATIENT_CALLED",
        "ticket_id": ticket.id,
        "ticket_number": ticket.ticket_number,
        "called_time": ticket.called_time.isoformat() if ticket.called_time else None,
        "message": f"Patient {ticket.ticket_number} called to consultation room.",
    }


@router.get("/ticket/{ticket_id}")
async def get_ticket_status(
    ticket_id: str,
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(QueueTicket)
        .options(
            selectinload(QueueTicket.doctor).selectinload(DoctorProfile.user),
            selectinload(QueueTicket.doctor).selectinload(DoctorProfile.hospital),
        )
        .where(QueueTicket.id == ticket_id)
    )
    res = await db.execute(stmt)
    ticket = res.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Queue ticket not found.")

    return {
        "ticket_id": ticket.id,
        "ticket_number": ticket.ticket_number,
        "sequence_number": ticket.sequence_number,
        "state": ticket.state.value,
        "estimated_wait_minutes": ticket.estimated_wait_minutes,
        "doctor_name": ticket.doctor.user.full_name if (ticket.doctor and ticket.doctor.user) else "Doctor",
        "room_number": ticket.doctor.room_number if ticket.doctor else "Room",
        "hospital_name": ticket.doctor.hospital.name if (ticket.doctor and ticket.doctor.hospital) else "Hospital",
    }
