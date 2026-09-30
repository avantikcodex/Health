from typing import List, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.core.database import get_db
from backend.app.core.security import decode_token
from backend.app.models.enums import UserRole
from backend.app.models.user import User, PatientProfile
from backend.app.models.hospital import DoctorProfile

security_bearer = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Validates the Bearer JWT access token and loads the active user."""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    payload = decode_token(credentials.credentials)
    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token subject identifier missing.",
        )
    
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is disabled or does not exist.",
        )
    
    return user


class RoleChecker:
    """Enforces least-privilege role-based access control."""
    def __init__(self, allowed_roles: List[UserRole]) -> None:
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {[r.value for r in self.allowed_roles]}. User role: {current_user.role.value}",
            )
        return current_user


async def get_current_patient(
    current_user: User = Depends(RoleChecker([UserRole.PATIENT, UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN, UserRole.DOCTOR])),
    db: AsyncSession = Depends(get_db),
) -> PatientProfile:
    """Resolves the PatientProfile for the authenticated user, auto-provisioning if admin/clinician tests booking."""
    stmt = select(PatientProfile).where(PatientProfile.user_id == current_user.id)
    result = await db.execute(stmt)
    patient = result.scalar_one_or_none()
    if not patient:
        patient = PatientProfile(
            user_id=current_user.id,
            abha_number=f"91-4567-8901-{current_user.phone[-4:] if current_user.phone else '9999'}",
            abha_address=f"{current_user.full_name.lower().replace(' ', '')}@abdm",
            blood_group="O+",
            allergies=["Penicillin"],
            chronic_conditions=["Mild Hypertension"],
        )
        db.add(patient)
        await db.commit()
        await db.refresh(patient)
    return patient


async def get_current_doctor(
    current_user: User = Depends(RoleChecker([UserRole.DOCTOR])),
    db: AsyncSession = Depends(get_db),
) -> DoctorProfile:
    """Resolves the DoctorProfile for the authenticated clinician."""
    stmt = select(DoctorProfile).where(DoctorProfile.user_id == current_user.id)
    result = await db.execute(stmt)
    doctor = result.scalar_one_or_none()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor profile not found for current clinician.",
        )
    return doctor
