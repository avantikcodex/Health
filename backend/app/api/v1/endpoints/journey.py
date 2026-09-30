from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from backend.app.api.deps import get_current_patient, get_current_user
from backend.app.core.database import get_db
from backend.app.models.journey import CareJourney, CareJourneyEvent
from backend.app.models.user import PatientProfile, User
from backend.app.schemas.journey import CareJourneyEventResponse, CareJourneyResponse

router = APIRouter(prefix="/journey", tags=["Care Journey"])


@router.get("/my", response_model=Optional[CareJourneyResponse])
async def get_my_active_journey(
    current_patient: PatientProfile = Depends(get_current_patient),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns the patient's active, connected Care Journey timeline.
    Shows past encounters, prescriptions, lab tests, and next actions.
    """
    stmt = (
        select(CareJourney)
        .options(
            selectinload(CareJourney.events),
        )
        .where(CareJourney.patient_id == current_patient.id)
        .order_by(desc(CareJourney.started_at))
    )
    res = await db.execute(stmt)
    journey = res.scalars().first()

    if not journey:
        return None

    # Map events
    sorted_events = sorted(journey.events, key=lambda e: e.event_timestamp)
    return CareJourneyResponse(
        id=journey.id,
        patient_id=journey.patient_id,
        title=journey.title,
        status=journey.status,
        started_at=journey.started_at,
        completed_at=journey.completed_at,
        events=[CareJourneyEventResponse.model_validate(e) for e in sorted_events],
    )


@router.get("/patient/{patient_id}", response_model=Optional[CareJourneyResponse])
async def get_patient_journey(
    patient_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Clinician view: Loads the patient's care journey timeline for clinical context.
    """
    stmt = (
        select(CareJourney)
        .options(
            selectinload(CareJourney.events),
        )
        .where(CareJourney.patient_id == patient_id)
        .order_by(desc(CareJourney.started_at))
    )
    res = await db.execute(stmt)
    journey = res.scalars().first()
    if not journey:
        return None

    sorted_events = sorted(journey.events, key=lambda e: e.event_timestamp)
    return CareJourneyResponse(
        id=journey.id,
        patient_id=journey.patient_id,
        title=journey.title,
        status=journey.status,
        started_at=journey.started_at,
        completed_at=journey.completed_at,
        events=[CareJourneyEventResponse.model_validate(e) for e in sorted_events],
    )
