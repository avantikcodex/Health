from typing import Optional, List
from datetime import date, datetime
from pydantic import BaseModel, Field
from backend.app.models.enums import Gender, UserRole


class UserBase(BaseModel):
    phone: str = Field(..., description="10-digit mobile number")
    email: Optional[str] = None
    full_name: str
    role: UserRole = UserRole.PATIENT


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)


class PatientRegisterRequest(BaseModel):
    phone: str
    password: str = Field(..., min_length=6)
    full_name: str
    email: Optional[str] = None
    dob: Optional[date] = None
    gender: Optional[Gender] = None
    blood_group: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    allergies: Optional[List[str]] = None
    chronic_conditions: Optional[List[str]] = None


class LoginRequest(BaseModel):
    identifier: str = Field(..., description="Email or phone number")
    password: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class UserSummary(BaseModel):
    id: str
    phone: str
    email: Optional[str] = None
    full_name: str
    role: UserRole
    hospital_id: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserSummary
