from datetime import datetime, timezone

from sqlalchemy import BigInteger, Column, DateTime, String, Text

from app.models.base import Base


class IngestStatus(Base):
    __tablename__ = "ingest_status"

    id = Column(String(30), primary_key=True)  # ais, adsb, celestrak, stocks
    status = Column(String(20), nullable=False, default="offline")
    last_heartbeat = Column(DateTime(timezone=True), nullable=True)
    records_ingested = Column(BigInteger, default=0)
    error_message = Column(Text, nullable=True)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
