import logging
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.alert import Alert

logger = logging.getLogger(__name__)


async def create_alert(
    db: AsyncSession,
    *,
    severity: str,
    title: str,
    message: str | None = None,
    source: str | None = None,
    entity_id: UUID | None = None,
) -> Alert:
    alert = Alert(
        severity=severity,
        title=title,
        message=message,
        source=source,
        entity_id=entity_id,
    )
    db.add(alert)
    await db.flush()
    return alert


async def get_alerts(
    db: AsyncSession,
    severity: str | None = None,
    acknowledged: bool | None = None,
    limit: int = 50,
) -> list[Alert]:
    stmt = select(Alert)
    if severity:
        stmt = stmt.where(Alert.severity == severity)
    if acknowledged is not None:
        stmt = stmt.where(Alert.acknowledged == acknowledged)
    stmt = stmt.order_by(Alert.created_at.desc()).limit(limit)
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def acknowledge_alert(db: AsyncSession, alert_id: UUID) -> Alert | None:
    stmt = (
        update(Alert)
        .where(Alert.id == alert_id)
        .values(acknowledged=True, acknowledged_at=datetime.now(timezone.utc))
        .returning(Alert)
    )
    result = await db.execute(stmt)
    await db.flush()
    return result.scalar_one_or_none()
