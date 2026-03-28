from datetime import datetime, timezone

from sqlalchemy import BigInteger, Column, DateTime, Float, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import Base


class TrackPoint(Base):
    __tablename__ = "track_points"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    entity_id = Column(UUID(as_uuid=True), ForeignKey("entities.id", ondelete="CASCADE"), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    heading = Column(Float, nullable=True)
    speed = Column(Float, nullable=True)
    altitude = Column(Float, nullable=True)
    recorded_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    entity = relationship("Entity", back_populates="track_points")

    __table_args__ = (
        Index("ix_track_entity_time", "entity_id", "recorded_at"),
    )
