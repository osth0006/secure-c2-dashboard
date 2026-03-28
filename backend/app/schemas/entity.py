from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel


class TrackPointSchema(BaseModel):
    latitude: float
    longitude: float
    heading: float | None = None
    speed: float | None = None
    altitude: float | None = None
    recorded_at: datetime

    model_config = {"from_attributes": True}


class EntitySchema(BaseModel):
    id: UUID
    source_id: str
    data_source: str
    callsign: str | None = None
    entity_type: str
    category: str
    latitude: float
    longitude: float
    heading: float | None = None
    speed: float | None = None
    altitude: float | None = None
    metadata_: dict[str, Any] | None = None
    first_seen: datetime
    last_seen: datetime
    track: list[TrackPointSchema] = []

    model_config = {"from_attributes": True}
