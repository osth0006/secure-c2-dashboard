from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.entity import EntitySchema, TrackPointSchema
from app.services import entity_service

router = APIRouter(prefix="/api/entities", tags=["entities"])


@router.get("", response_model=list[EntitySchema])
async def list_entities(
    source: str | None = Query(None),
    category: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    entities = await entity_service.get_active_entities(db, data_source=source, category=category)
    return entities


@router.get("/{entity_id}/track", response_model=list[TrackPointSchema])
async def get_entity_track(
    entity_id: UUID,
    limit: int = Query(50, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
):
    return await entity_service.get_entity_track(db, entity_id, limit=limit)
