import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, Float, Index, String, Text
from sqlalchemy.dialects.postgresql import UUID

from app.models.base import Base


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    severity = Column(String(10), nullable=False)  # critical, high, medium, low, info
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=True)
    source = Column(String(50), nullable=True)
    entity_id = Column(UUID(as_uuid=True), nullable=True)
    acknowledged = Column(Boolean, default=False)
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        Index("ix_alerts_created", "created_at"),
        Index("ix_alerts_ack_severity", "acknowledged", "severity"),
    )
