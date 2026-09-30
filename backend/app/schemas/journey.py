from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from backend.app.models.enums import JourneyEventStatus, JourneyEventType, JourneyStatus


class CareJourneyEventResponse(BaseModel):
    id: str
    event_type: JourneyEventType
    title: str
    description: Optional[str] = None
    provider_name: Optional[str] = None
    reference_id: Optional[str] = None
    status: JourneyEventStatus
    next_action_label: Optional[str] = None
    next_action_url: Optional[str] = None
    event_timestamp: datetime

    class Config:
        from_attributes = True


class CareJourneyResponse(BaseModel):
    id: str
    patient_id: str
    title: str
    status: JourneyStatus
    started_at: datetime
    completed_at: Optional[datetime] = None
    events: List[CareJourneyEventResponse]

    class Config:
        from_attributes = True
