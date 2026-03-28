from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class AlertSchema(BaseModel):
    id: UUID
    severity: str
    title: str
    message: str | None = None
    source: str | None = None
    entity_id: UUID | None = None
    acknowledged: bool = False
    acknowledged_at: datetime | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class AlertAckRequest(BaseModel):
    acknowledged: bool = True
