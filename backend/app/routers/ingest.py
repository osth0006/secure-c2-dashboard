from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.ingest_status import IngestStatus
from app.schemas.dashboard import IngestStatusSchema

router = APIRouter(prefix="/api/ingest", tags=["ingest"])


@router.get("/status", response_model=list[IngestStatusSchema])
async def ingest_status(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(IngestStatus))
    rows = result.scalars().all()
    statuses = []
    for r in rows:
        statuses.append(
            IngestStatusSchema(
                id=r.id,
                status=r.status,
                last_heartbeat=r.last_heartbeat.timestamp() if r.last_heartbeat else None,
                records_ingested=r.records_ingested or 0,
                error_message=r.error_message,
            )
        )
    return statuses
