import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Float, Index, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from app.models.base import Base


class Entity(Base):
    __tablename__ = "entities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_id = Column(String(100), nullable=False)
    data_source = Column(String(20), nullable=False)  # ais, adsb, celestrak
    callsign = Column(String(100), nullable=True)
    entity_type = Column(String(20), nullable=False, default="neutral")
    category = Column(String(20), nullable=False)  # vessel, aircraft, satellite
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    heading = Column(Float, nullable=True)
    speed = Column(Float, nullable=True)
    altitude = Column(Float, nullable=True)
    metadata_ = Column("metadata", JSONB, nullable=True)
    first_seen = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    last_seen = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    track_points = relationship("TrackPoint", back_populates="entity", lazy="dynamic")

    __table_args__ = (
        Index("ix_entities_source", "data_source", "source_id", unique=True),
        Index("ix_entities_last_seen", "last_seen"),
    )
