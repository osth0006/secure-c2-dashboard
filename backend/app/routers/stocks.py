from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.stock import StockPointSchema, StockQuoteSchema
from app.services import stock_service

router = APIRouter(prefix="/api/stocks", tags=["stocks"])


@router.get("", response_model=list[StockQuoteSchema])
async def list_stocks(db: AsyncSession = Depends(get_db)):
    return await stock_service.get_latest_quotes(db)


@router.get("/{symbol}/history", response_model=list[StockPointSchema])
async def stock_history(
    symbol: str,
    limit: int = Query(30, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    return await stock_service.get_stock_history(db, symbol, limit=limit)
