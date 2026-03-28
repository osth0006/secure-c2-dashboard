from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.alert import AlertAckRequest, AlertSchema
from app.services import alert_service

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


@router.get("", response_model=list[AlertSchema])
async def list_alerts(
    severity: str | None = Query(None),
    ack: bool | None = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    return await alert_service.get_alerts(db, severity=severity, acknowledged=ack, limit=limit)


@router.patch("/{alert_id}/ack", response_model=AlertSchema)
async def acknowledge_alert(
    alert_id: UUID,
    body: AlertAckRequest,
    db: AsyncSession = Depends(get_db),
):
    alert = await alert_service.acknowledge_alert(db, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    await db.commit()
    return alert
