import random
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.api.deps import get_current_user
from backend.app.core.database import get_db
from backend.app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    verify_password,
)
from backend.app.models.enums import UserRole
from backend.app.models.user import PatientProfile, User
from backend.app.models.hospital import DoctorProfile
from backend.app.schemas.auth import (
    LoginRequest,
    PatientRegisterRequest,
    RefreshTokenRequest,
    TokenResponse,
    UserSummary,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register_patient(
    payload: PatientRegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Registers a new patient account, generates an ABHA ID stub,
    and returns initial authentication tokens.
    """
    # Check if user already exists
    stmt = select(User).where(or_(User.phone == payload.phone, User.email == payload.email if payload.email else False))
    result = await db.execute(stmt)
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this phone number or email already exists.",
        )
    
    # Create user
    new_user = User(
        phone=payload.phone,
        email=payload.email,
        password_hash=get_password_hash(payload.password),
        full_name=payload.full_name,
        role=UserRole.PATIENT,
        is_active=True,
    )
    db.add(new_user)
    await db.flush()  # populate new_user.id
    
    # Generate simulated ABHA identifier for ABDM compliance demo
    # Format: 14-digit number e.g. "91-4567-8901-2345"
    rand_digits = "".join([str(random.randint(0, 9)) for _ in range(12)])
    abha_num = f"91-{rand_digits[:4]}-{rand_digits[4:8]}-{rand_digits[8:]}"
    clean_name = payload.full_name.lower().replace(" ", "")
    abha_addr = f"{clean_name}{random.randint(100, 999)}@abdm"

    # Create patient profile
    patient_profile = PatientProfile(
        user_id=new_user.id,
        abha_number=abha_num,
        abha_address=abha_addr,
        dob=payload.dob,
        gender=payload.gender,
        blood_group=payload.blood_group,
        emergency_contact_name=payload.emergency_contact_name,
        emergency_contact_phone=payload.emergency_contact_phone,
        allergies=payload.allergies or [],
        chronic_conditions=payload.chronic_conditions or [],
    )
    db.add(patient_profile)
    await db.commit()
    await db.refresh(new_user)

    access_token = create_access_token(subject=new_user.id, role=new_user.role.value)
    refresh_token = create_refresh_token(subject=new_user.id)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=UserSummary.model_validate(new_user),
    )


@router.post("/login", response_model=TokenResponse)
async def login(
    payload: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Authenticates a user by email or phone and returns access and refresh JWTs.
    """
    stmt = select(User).where(
        or_(User.email == payload.identifier, User.phone == payload.identifier)
    )
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Please verify your phone/email and password.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact hospital support.",
        )

    access_token = create_access_token(
        subject=user.id,
        role=user.role.value,
        hospital_id=user.hospital_id,
    )
    refresh_token = create_refresh_token(subject=user.id)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=UserSummary.model_validate(user),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_access_token(
    payload: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Issues a new access token using a valid refresh token.
    """
    token_data = decode_token(payload.refresh_token)
    if not token_data or token_data.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token.",
        )

    user_id = token_data.get("sub")
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User no longer active.",
        )

    new_access_token = create_access_token(
        subject=user.id,
        role=user.role.value,
        hospital_id=user.hospital_id,
    )
    new_refresh_token = create_refresh_token(subject=user.id)

    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
        user=UserSummary.model_validate(user),
    )


@router.get("/me")
async def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns the authenticated user's profile and role-specific details.
    """
    response_data = {
        "id": current_user.id,
        "phone": current_user.phone,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role.value,
        "hospital_id": current_user.hospital_id,
        "is_active": current_user.is_active,
    }

    if current_user.role == UserRole.PATIENT:
        stmt = select(PatientProfile).where(PatientProfile.user_id == current_user.id)
        res = await db.execute(stmt)
        patient = res.scalar_one_or_none()
        if patient:
            response_data["patient_profile"] = {
                "id": patient.id,
                "abha_number": patient.abha_number,
                "abha_address": patient.abha_address,
                "dob": patient.dob.isoformat() if patient.dob else None,
                "gender": patient.gender.value if patient.gender else None,
                "blood_group": patient.blood_group,
                "allergies": patient.allergies or [],
                "chronic_conditions": patient.chronic_conditions or [],
                "emergency_contact_name": patient.emergency_contact_name,
                "emergency_contact_phone": patient.emergency_contact_phone,
            }

    elif current_user.role == UserRole.DOCTOR:
        stmt = select(DoctorProfile).where(DoctorProfile.user_id == current_user.id)
        res = await db.execute(stmt)
        doctor = res.scalar_one_or_none()
        if doctor:
            response_data["doctor_profile"] = {
                "id": doctor.id,
                "hospital_id": doctor.hospital_id,
                "department_id": doctor.department_id,
                "hpr_id": doctor.hpr_id,
                "registration_number": doctor.registration_number,
                "qualification": doctor.qualification,
                "specialization": doctor.specialization,
                "experience_years": doctor.experience_years,
                "consultation_fee": doctor.consultation_fee,
                "room_number": doctor.room_number,
                "languages": doctor.languages or [],
                "is_verified": doctor.is_verified,
            }

    return response_data
