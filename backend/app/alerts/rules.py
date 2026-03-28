"""Rule-based alert checks. Each rule returns an alert dict or None."""

import logging
import math
from datetime import datetime, timedelta, timezone

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.entity import Entity
from app.models.track_point import TrackPoint

logger = logging.getLogger(__name__)

# Speed thresholds by category (in their native units)
SPEED_THRESHOLDS = {
    "vessel": 35.0,      # knots
    "aircraft": 600.0,   # knots ground speed
    "satellite": 10.0,   # km/s (unusual for LEO)
}

# Heading change threshold in degrees
HEADING_CHANGE_THRESHOLD = 90.0


async def check_speed_threshold(entity: Entity, **kwargs) -> dict | None:
    threshold = SPEED_THRESHOLDS.get(entity.category)
    if threshold is None or entity.speed is None:
        return None
    if entity.speed > threshold:
        return {
            "severity": "high",
            "title": f"SPEED ANOMALY: {entity.callsign or entity.source_id}",
            "message": f"{entity.category.title()} exceeding speed threshold: {entity.speed:.1f} (limit: {threshold})",
            "source": "rule:speed_threshold",
            "entity_id": entity.id,
        }
    return None


async def check_altitude_anomaly(entity: Entity, **kwargs) -> dict | None:
    if entity.category != "aircraft" or entity.altitude is None:
        return None
    if entity.altitude < 1000 and entity.speed and entity.speed > 100:
        return {
            "severity": "medium",
            "title": f"LOW ALTITUDE: {entity.callsign or entity.source_id}",
            "message": f"Aircraft at {entity.altitude:.0f}ft with ground speed {entity.speed:.0f}kts",
            "source": "rule:altitude_anomaly",
            "entity_id": entity.id,
        }
    return None


async def check_track_deviation(
    entity: Entity, db: AsyncSession, **kwargs
) -> dict | None:
    if entity.heading is None:
        return None

    stmt = (
        select(TrackPoint.heading)
        .where(TrackPoint.entity_id == entity.id)
        .where(TrackPoint.heading.isnot(None))
        .order_by(TrackPoint.recorded_at.desc())
        .limit(5)
    )
    result = await db.execute(stmt)
    headings = [row[0] for row in result.all()]

    if len(headings) < 3:
        return None

    # Check if heading changed more than threshold between first and last
    delta = abs(headings[0] - headings[-1])
    if delta > 180:
        delta = 360 - delta

    if delta > HEADING_CHANGE_THRESHOLD:
        return {
            "severity": "medium",
            "title": f"COURSE DEVIATION: {entity.callsign or entity.source_id}",
            "message": f"Heading changed {delta:.0f}° in recent track points",
            "source": "rule:track_deviation",
            "entity_id": entity.id,
        }
    return None


async def check_stale_entity(db: AsyncSession, **kwargs) -> list[dict]:
    """Check for entities that haven't updated in 5+ minutes."""
    cutoff = datetime.now(timezone.utc) - timedelta(minutes=5)
    stmt = (
        select(Entity)
        .where(Entity.last_seen < cutoff)
        .where(Entity.data_source != "celestrak")  # Satellites update less frequently
        .limit(20)
    )
    result = await db.execute(stmt)
    alerts = []
    for e in result.scalars().all():
        alerts.append({
            "severity": "low",
            "title": f"LOST CONTACT: {e.callsign or e.source_id}",
            "message": f"No update from {e.data_source} source since {e.last_seen.isoformat()}",
            "source": "rule:stale_entity",
            "entity_id": e.id,
        })
    return alerts


async def check_proximity(db: AsyncSession, distance_nm: float = 5.0, **kwargs) -> list[dict]:
    """Check for entities that are too close to each other. Simple distance check."""
    # Convert nm to approximate degrees (1 nm ≈ 1/60 degree)
    deg_threshold = distance_nm / 60.0

    stmt = select(Entity).where(Entity.category.in_(["vessel", "aircraft"]))
    result = await db.execute(stmt)
    entities = list(result.scalars().all())

    alerts = []
    checked = set()

    for i, e1 in enumerate(entities):
        for j, e2 in enumerate(entities):
            if i >= j:
                continue
            pair_key = tuple(sorted([str(e1.id), str(e2.id)]))
            if pair_key in checked:
                continue
            checked.add(pair_key)

            dlat = abs(e1.latitude - e2.latitude)
            dlon = abs(e1.longitude - e2.longitude)
            if dlat < deg_threshold and dlon < deg_threshold:
                dist = math.sqrt(dlat ** 2 + dlon ** 2) * 60  # rough nm
                if dist < distance_nm:
                    alerts.append({
                        "severity": "high",
                        "title": f"PROXIMITY ALERT",
                        "message": (
                            f"{e1.callsign or e1.source_id} and {e2.callsign or e2.source_id} "
                            f"within {dist:.1f}nm"
                        ),
                        "source": "rule:proximity",
                        "entity_id": e1.id,
                    })

    return alerts


async def check_dark_ship(entity: Entity, db: AsyncSession, **kwargs) -> dict | None:
    """Detect AIS gap: entity reappears after >30 min with >50nm position jump."""
    if entity.data_source != "ais":
        return None

    stmt = (
        select(TrackPoint)
        .where(TrackPoint.entity_id == entity.id)
        .order_by(TrackPoint.recorded_at.desc())
        .limit(2)
    )
    result = await db.execute(stmt)
    points = list(result.scalars().all())

    if len(points) < 2:
        return None

    latest = points[0]
    previous = points[1]

    time_gap = (latest.recorded_at - previous.recorded_at).total_seconds()
    if time_gap < 1800:  # 30 minutes
        return None

    dlat = latest.latitude - previous.latitude
    dlon = latest.longitude - previous.longitude
    dist_nm = math.sqrt(dlat ** 2 + dlon ** 2) * 60

    if dist_nm > 50:
        return {
            "severity": "critical",
            "title": f"DARK SHIP DETECTED: {entity.callsign or entity.source_id}",
            "message": (
                f"AIS gap of {time_gap / 60:.0f} minutes, position jumped {dist_nm:.0f}nm"
            ),
            "source": "rule:dark_ship",
            "entity_id": entity.id,
        }
    return None


# All single-entity rules
ENTITY_RULES = [
    check_speed_threshold,
    check_altitude_anomaly,
    check_track_deviation,
    check_dark_ship,
]

# Periodic scan rules (run independently, not per-entity)
SCAN_RULES = [
    check_stale_entity,
    check_proximity,
]
