from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.alert import Alert
from app.models.entity import Entity
from app.models.ingest_status import IngestStatus
from app.schemas.dashboard import DashboardSnapshot, IngestStatusSchema
from app.schemas.entity import EntitySchema
from app.schemas.alert import AlertSchema
from app.services import stock_service

router = APIRouter(prefix="/api", tags=["dashboard"])


@router.get("/dashboard", response_model=DashboardSnapshot)
async def get_dashboard(db: AsyncSession = Depends(get_db)):
    # Entities
    entity_result = await db.execute(
        select(Entity).order_by(Entity.last_seen.desc()).limit(500)
    )
    entities = [EntitySchema.model_validate(e) for e in entity_result.scalars().all()]

    # Recent alerts
    alert_result = await db.execute(
        select(Alert).order_by(Alert.created_at.desc()).limit(50)
    )
    alerts = [AlertSchema.model_validate(a) for a in alert_result.scalars().all()]

    # Stock quotes
    stocks = await stock_service.get_latest_quotes(db)

    # Ingest status
    ingest_result = await db.execute(select(IngestStatus))
    ingest_statuses = []
    for r in ingest_result.scalars().all():
        ingest_statuses.append(
            IngestStatusSchema(
                id=r.id,
                status=r.status,
                last_heartbeat=r.last_heartbeat.timestamp() if r.last_heartbeat else None,
                records_ingested=r.records_ingested or 0,
                error_message=r.error_message,
            )
        )

    return DashboardSnapshot(
        entities=entities,
        alerts=alerts,
        stocks=stocks,
        ingest_status=ingest_statuses,
    )
