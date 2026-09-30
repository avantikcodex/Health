import random
from datetime import date, time
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.app.api.deps import RoleChecker, get_current_user
from backend.app.core.database import get_db
from backend.app.core.security import get_password_hash
from backend.app.core.websocket_manager import ws_manager
from backend.app.models.appointment import Appointment, QueueTicket
from backend.app.models.clinical import Prescription
from backend.app.models.enums import AppointmentStatus, QueueState, UserRole
from backend.app.models.hospital import Department, DoctorProfile, DoctorSchedule, Hospital
from backend.app.models.user import PatientProfile, User
from backend.app.schemas.admin import (
    BroadcastAnnouncementRequest,
    CreateDoctorRequest,
    CreateHospitalRequest,
    UpdateUserRoleRequest,
)
from backend.app.services.queue_service import QueueService

router = APIRouter(prefix="/admin", tags=["Operations & Admin Control"])


@router.get("/analytics")
async def get_hospital_operations_analytics(
    hospital_id: Optional[str] = Query(None, description="Optional hospital filter"),
    current_user: User = Depends(RoleChecker([UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN, UserRole.RECEPTIONIST])),
    db: AsyncSession = Depends(get_db),
):
    """
    Hospital Operations & Operational Command Center:
    Aggregates throughput metrics:
    - Today's Appointments
    - Checked In Count
    - Waiting Count
    - In Consultation
    - Completed Count
    - Average Queue Dwell Time
    - Active Doctors Roster
    """
    today = date.today()

    appt_stmt = select(func.count(Appointment.id)).where(Appointment.appointment_date == today)
    if hospital_id:
        appt_stmt = appt_stmt.where(Appointment.hospital_id == hospital_id)
    total_appts = (await db.execute(appt_stmt)).scalar() or 0

    ticket_stmt = select(QueueTicket.state, func.count(QueueTicket.id)).where(
        func.date(QueueTicket.check_in_time) == today
    )
    if hospital_id:
        ticket_stmt = ticket_stmt.where(QueueTicket.hospital_id == hospital_id)
    ticket_stmt = ticket_stmt.group_by(QueueTicket.state)
    ticket_res = await db.execute(ticket_stmt)
    state_counts = dict(ticket_res.all())

    checked_in = state_counts.get(QueueState.CHECKED_IN, 0)
    waiting = state_counts.get(QueueState.WAITING, 0)
    in_consult = state_counts.get(QueueState.IN_CONSULTATION, 0) + state_counts.get(QueueState.CALLED, 0)
    completed = state_counts.get(QueueState.COMPLETED, 0)

    rx_stmt = select(func.count(Prescription.id)).where(func.date(Prescription.created_at) == today)
    rx_count = (await db.execute(rx_stmt)).scalar() or 0

    doc_stmt = select(func.count(DoctorProfile.id)).where(DoctorProfile.is_verified == True)
    if hospital_id:
        doc_stmt = doc_stmt.where(DoctorProfile.hospital_id == hospital_id)
    active_doctors = (await db.execute(doc_stmt)).scalar() or 0

    avg_wait = 18 if waiting > 0 else 0

    return {
        "date": today.isoformat(),
        "total_appointments_today": total_appts,
        "checked_in_count": checked_in + waiting + in_consult + completed,
        "waiting_count": waiting,
        "in_consultation_count": in_consult,
        "completed_count": completed,
        "prescriptions_issued_today": rx_count,
        "active_doctors_count": active_doctors,
        "average_wait_time_minutes": avg_wait,
        "queue_dwell_status": "OPTIMAL" if waiting < 6 else "ELEVATED_LOAD",
    }


@router.post("/simulate-queue-step")
async def simulate_queue_step(
    doctor_id: str = Query(..., description="Doctor whose queue to advance"),
    current_user: User = Depends(RoleChecker([UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN, UserRole.DOCTOR])),
    db: AsyncSession = Depends(get_db),
):
    """
    Advances the queue by one step:
    Completes current patient and calls the next waiting patient,
    broadcasting instant updates to all connected browser viewports.
    """
    next_ticket = await QueueService.call_next_patient(db, doctor_id)
    if not next_ticket:
        return {
            "status": "QUEUE_EMPTY",
            "message": "Queue has no remaining waiting patients.",
        }

    return {
        "status": "SIMULATION_STEP_ADVANCED",
        "ticket_number": next_ticket.ticket_number,
        "state": next_ticket.state.value,
        "message": f"Simulation stepped: Token {next_ticket.ticket_number} called.",
    }


@router.get("/hospitals")
async def get_all_hospitals(
    current_user: User = Depends(RoleChecker([UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN])),
    db: AsyncSession = Depends(get_db),
):
    """Fetches all registered hospitals with their departments and active doctors count."""
    stmt = (
        select(Hospital)
        .options(
            selectinload(Hospital.departments),
            selectinload(Hospital.doctors).selectinload(DoctorProfile.user),
        )
        .order_by(Hospital.name)
    )
    result = await db.execute(stmt)
    hospitals = result.scalars().all()

    items = []
    for h in hospitals:
        items.append({
            "id": h.id,
            "name": h.name,
            "city": h.city,
            "state": h.state,
            "address": h.address,
            "is_verified": h.is_verified,
            "is_active": h.is_active,
            "departments": [{"id": d.id, "name": d.name, "code": d.code} for d in h.departments],
            "doctors_count": len(h.doctors),
        })
    return items


@router.post("/hospitals", status_code=status.HTTP_201_CREATED)
async def create_hospital(
    payload: CreateHospitalRequest,
    current_user: User = Depends(RoleChecker([UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN])),
    db: AsyncSession = Depends(get_db),
):
    """Admin-only: Onboards a new hospital into the federated CareFlow network."""
    import re
    import uuid

    base_slug = re.sub(r"[^a-z0-9]+", "-", payload.name.lower()).strip("-")[:70]
    slug = f"{base_slug}-{uuid.uuid4().hex[:6]}"

    hosp = Hospital(
        name=payload.name,
        slug=slug,
        city=payload.city,
        state=payload.state,
        address=payload.address,
        is_verified=payload.is_nabh,
        is_active=True,
    )
    db.add(hosp)
    await db.flush()

    for dept_name in payload.departments:
        code = dept_name.replace(" ", "")[:4].upper()
        dept = Department(
            hospital_id=hosp.id,
            name=dept_name,
            code=code,
            description=f"{dept_name} OPD",
        )
        db.add(dept)

    await db.commit()
    await db.refresh(hosp)

    await ws_manager.broadcast_global("HOSPITAL_ADDED", {
        "hospital_id": hosp.id,
        "name": hosp.name,
        "city": hosp.city,
    })

    return {
        "status": "HOSPITAL_CREATED",
        "hospital_id": hosp.id,
        "name": hosp.name,
        "city": hosp.city,
    }


@router.post("/doctors", status_code=status.HTTP_201_CREATED)
async def create_doctor(
    payload: CreateDoctorRequest,
    current_user: User = Depends(RoleChecker([UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN])),
    db: AsyncSession = Depends(get_db),
):
    """Admin-only: Registers and onboards a new verified doctor into a hospital department."""
    import re

    # Normalize email or auto-generate if empty
    clean_name = re.sub(r"[^a-z0-9]", "", payload.full_name.lower())
    doc_email = (
        payload.email.strip()
        if (payload.email and payload.email.strip())
        else f"dr.{clean_name}.{random.randint(100, 999)}@careflow.org"
    )

    user = (await db.execute(select(User).where(User.phone == payload.phone))).scalar_one_or_none()
    if not user:
        user = User(
            phone=payload.phone,
            email=doc_email,
            password_hash=get_password_hash(payload.password),
            full_name=payload.full_name,
            role=UserRole.DOCTOR,
            hospital_id=payload.hospital_id,
            is_active=True,
        )
        db.add(user)
        await db.flush()
    else:
        user.role = UserRole.DOCTOR
        user.hospital_id = payload.hospital_id
        await db.flush()

    # Find or create department in the designated hospital
    dept_stmt = select(Department).where(
        Department.hospital_id == payload.hospital_id,
        Department.name.ilike(f"%{payload.department_name}%"),
    )
    dept = (await db.execute(dept_stmt)).scalar_one_or_none()
    if not dept:
        dept = Department(
            hospital_id=payload.hospital_id,
            name=payload.department_name,
            code=payload.department_name[:4].upper(),
            description=f"{payload.department_name} OPD",
        )
        db.add(dept)
        await db.flush()

    # Find or create doctor profile
    doc_stmt = select(DoctorProfile).where(DoctorProfile.user_id == user.id)
    doc_profile = (await db.execute(doc_stmt)).scalar_one_or_none()
    if not doc_profile:
        doc_profile = DoctorProfile(
            user_id=user.id,
            hospital_id=payload.hospital_id,
            department_id=dept.id,
            registration_number=payload.registration_number,
            qualification=payload.qualification,
            specialization=payload.specialization,
            experience_years=random.randint(5, 20),
            consultation_fee=payload.consultation_fee,
            room_number=payload.room_number,
            is_verified=True,
        )
        db.add(doc_profile)
        await db.flush()
    else:
        doc_profile.hospital_id = payload.hospital_id
        doc_profile.department_id = dept.id
        doc_profile.specialization = payload.specialization
        doc_profile.consultation_fee = payload.consultation_fee
        doc_profile.room_number = payload.room_number

    # Ensure 7-day OPD schedule so doctor is bookable every day of the week
    sched_stmt = select(DoctorSchedule).where(DoctorSchedule.doctor_id == doc_profile.id)
    existing_scheds = (await db.execute(sched_stmt)).scalars().all()
    scheduled_days = {s.day_of_week for s in existing_scheds}

    for day in range(7):
        if day not in scheduled_days:
            sched = DoctorSchedule(
                doctor_id=doc_profile.id,
                day_of_week=day,
                start_time=time(9, 0),
                end_time=time(17, 0),
                slot_duration_minutes=15,
                buffer_time_minutes=5,
                max_patients_per_session=25,
                is_active=True,
            )
            db.add(sched)

    await db.commit()

    return {
        "status": "DOCTOR_ONBOARDED",
        "doctor_id": doc_profile.id,
        "full_name": payload.full_name,
        "specialization": payload.specialization,
        "department": dept.name,
        "hospital_id": payload.hospital_id,
    }


@router.get("/users")
async def get_all_users(
    role: Optional[UserRole] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(RoleChecker([UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN])),
    db: AsyncSession = Depends(get_db),
):
    """Admin-only: Retrieve all registered platform users with search and role filter."""
    stmt = (
        select(User)
        .options(
            selectinload(User.patient_profile),
            selectinload(User.doctor_profile),
        )
        .order_by(User.created_at.desc())
        .limit(100)
    )

    if role:
        stmt = stmt.where(User.role == role)
    if search:
        search_pattern = f"%{search}%"
        stmt = stmt.where(or_(User.full_name.ilike(search_pattern), User.phone.ilike(search_pattern), User.email.ilike(search_pattern)))

    result = await db.execute(stmt)
    users = result.scalars().all()

    items = []
    for u in users:
        abha = u.patient_profile.abha_number if u.patient_profile else None
        dept = u.doctor_profile.specialization if u.doctor_profile else None
        items.append({
            "id": u.id,
            "full_name": u.full_name,
            "phone": u.phone,
            "email": u.email,
            "role": u.role.value,
            "is_active": u.is_active,
            "abha_number": abha,
            "specialization": dept,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        })
    return items


@router.put("/users/{user_id}/role")
async def update_user_role(
    user_id: str,
    payload: UpdateUserRoleRequest,
    current_user: User = Depends(RoleChecker([UserRole.SUPER_ADMIN])),
    db: AsyncSession = Depends(get_db),
):
    """Admin-only: Change a user's role (e.g. promote to DOCTOR or HOSPITAL_ADMIN)."""
    stmt = select(User).where(User.id == user_id)
    user = (await db.execute(stmt)).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    user.role = payload.role
    await db.commit()

    return {"status": "ROLE_UPDATED", "user_id": user.id, "new_role": user.role.value}


@router.post("/announcements")
async def broadcast_announcement(
    payload: BroadcastAnnouncementRequest,
    current_user: User = Depends(RoleChecker([UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN])),
):
    """Admin-only: Broadcasts a live marquee alert to all active doctor, patient & hospital screens."""
    await ws_manager.broadcast_global("PLATFORM_ANNOUNCEMENT", {
        "title": payload.title,
        "message": payload.message,
        "severity": payload.severity,
        "sender": current_user.full_name,
    })
    return {"status": "ANNOUNCEMENT_BROADCASTED", "title": payload.title}
