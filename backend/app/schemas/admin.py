from typing import List, Optional
from pydantic import BaseModel, Field
from backend.app.models.enums import UserRole


class CreateHospitalRequest(BaseModel):
    name: str = Field(..., min_length=2)
    city: str
    state: str
    address: str
    departments: List[str] = Field(default=["General Medicine", "Cardiology OPD"])
    is_nabh: bool = True


class CreateDoctorRequest(BaseModel):
    full_name: str
    phone: str
    email: Optional[str] = None
    password: str = "password123"
    hospital_id: str
    department_name: str
    specialization: str
    qualification: str
    registration_number: str
    consultation_fee: float = 500.0
    room_number: str = "Room 101"


class UpdateUserRoleRequest(BaseModel):
    role: UserRole


class BroadcastAnnouncementRequest(BaseModel):
    title: str
    message: str
    severity: str = "INFO"
