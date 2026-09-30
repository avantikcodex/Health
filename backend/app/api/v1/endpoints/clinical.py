from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from backend.app.api.deps import get_current_doctor, get_current_patient, get_current_user
from backend.app.core.database import get_db
from backend.app.models.clinical import Encounter, Prescription
from backend.app.models.hospital import DoctorProfile
from backend.app.models.user import PatientProfile, User
from backend.app.schemas.clinical import (
    CompleteEncounterRequest,
    PrescriptionItemResponse,
    PrescriptionVerificationResponse,
)
from backend.app.services.clinical_service import ClinicalService

router = APIRouter(prefix="/clinical", tags=["Clinical Encounters & Prescriptions"])


@router.post("/encounters/complete")
async def complete_consultation(
    payload: CompleteEncounterRequest,
    current_doctor: DoctorProfile = Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db),
):
    encounter, prescription = await ClinicalService.complete_encounter(
        db=db,
        doctor_id=current_doctor.id,
        payload=payload,
    )

    return {
        "status": "COMPLETED",
        "encounter_id": encounter.id,
        "prescription_id": prescription.id if prescription else None,
        "verification_code": prescription.verification_code if prescription else None,
        "message": "Consultation successfully completed and digitally signed.",
    }


@router.get("/prescriptions/verify/{verification_code}", response_model=PrescriptionVerificationResponse)
async def public_verify_prescription(
    verification_code: str,
    db: AsyncSession = Depends(get_db),
):
    return await ClinicalService.verify_prescription(db, verification_code)


@router.get("/prescriptions/my")
async def list_my_prescriptions(
    current_patient: PatientProfile = Depends(get_current_patient),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Prescription)
        .options(
            selectinload(Prescription.items),
            selectinload(Prescription.doctor).selectinload(DoctorProfile.user),
            selectinload(Prescription.doctor).selectinload(DoctorProfile.hospital),
        )
        .where(Prescription.patient_id == current_patient.id)
        .order_by(desc(Prescription.created_at))
    )
    res = await db.execute(stmt)
    prescriptions = res.scalars().all()

    output = []
    for rx in prescriptions:
        output.append({
            "id": rx.id,
            "prescription_number": rx.prescription_number,
            "verification_code": rx.verification_code,
            "doctor_name": rx.doctor.user.full_name if (rx.doctor and rx.doctor.user) else "Doctor",
            "hospital_name": rx.doctor.hospital.name if (rx.doctor and rx.doctor.hospital) else "Hospital",
            "issued_at": rx.created_at.strftime("%B %d, %Y"),
            "follow_up_date": rx.follow_up_date.strftime("%B %d, %Y") if rx.follow_up_date else None,
            "instructions": rx.instructions,
            "items_count": len(rx.items),
            "items": [PrescriptionItemResponse.model_validate(it) for it in rx.items],
        })
    return output
