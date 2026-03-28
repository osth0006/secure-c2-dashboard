import logging
from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.entity import Entity
from app.models.track_point import TrackPoint

logger = logging.getLogger(__name__)


async def upsert_entity(
    db: AsyncSession,
    *,
    source_id: str,
    data_source: str,
    callsign: str | None,
    entity_type: str = "neutral",
    category: str,
    latitude: float,
    longitude: float,
    heading: float | None = None,
    speed: float | None = None,
    altitude: float | None = None,
    metadata: dict[str, Any] | None = None,
) -> Entity:
    now = datetime.now(timezone.utc)

    stmt = pg_insert(Entity).values(
        source_id=source_id,
        data_source=data_source,
        callsign=callsign,
        entity_type=entity_type,
        category=category,
        latitude=latitude,
        longitude=longitude,
        heading=heading,
        speed=speed,
        altitude=altitude,
        metadata_=metadata,
        first_seen=now,
        last_seen=now,
        created_at=now,
        updated_at=now,
    )
    stmt = stmt.on_conflict_do_update(
        index_elements=["data_source", "source_id"],
        set_={
            "callsign": callsign,
            "latitude": latitude,
            "longitude": longitude,
            "heading": heading,
            "speed": speed,
            "altitude": altitude,
            "metadata_": metadata,
            "last_seen": now,
            "updated_at": now,
        },
    ).returning(Entity)

    result = await db.execute(stmt)
    entity = result.scalar_one()
    await db.flush()
    return entity


async def insert_track_point(
    db: AsyncSession,
    *,
    entity_id: UUID,
    latitude: float,
    longitude: float,
    heading: float | None = None,
    speed: float | None = None,
    altitude: float | None = None,
) -> TrackPoint:
    tp = TrackPoint(
        entity_id=entity_id,
        latitude=latitude,
        longitude=longitude,
        heading=heading,
        speed=speed,
        altitude=altitude,
        recorded_at=datetime.now(timezone.utc),
    )
    db.add(tp)
    await db.flush()
    return tp


async def get_active_entities(
    db: AsyncSession,
    data_source: str | None = None,
    category: str | None = None,
) -> list[Entity]:
    stmt = select(Entity)
    if data_source:
        stmt = stmt.where(Entity.data_source == data_source)
    if category:
        stmt = stmt.where(Entity.category == category)
    stmt = stmt.order_by(Entity.last_seen.desc())
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_entity_track(
    db: AsyncSession,
    entity_id: UUID,
    limit: int = 50,
) -> list[TrackPoint]:
    stmt = (
        select(TrackPoint)
        .where(TrackPoint.entity_id == entity_id)
        .order_by(TrackPoint.recorded_at.desc())
        .limit(limit)
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())
