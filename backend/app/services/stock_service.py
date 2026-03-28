import logging

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.stock_quote import StockQuote
from app.schemas.stock import SYMBOL_NAMES, StockQuoteSchema, StockPointSchema

logger = logging.getLogger(__name__)


async def get_latest_quotes(db: AsyncSession) -> list[StockQuoteSchema]:
    """Get the latest quote for each tracked symbol, plus a sparkline of recent prices."""
    subq = (
        select(
            StockQuote.symbol,
            func.max(StockQuote.id).label("max_id"),
        )
        .group_by(StockQuote.symbol)
        .subquery()
    )
    stmt = select(StockQuote).join(subq, StockQuote.id == subq.c.max_id)
    result = await db.execute(stmt)
    latest = list(result.scalars().all())

    quotes = []
    for q in latest:
        sparkline_stmt = (
            select(StockQuote.price)
            .where(StockQuote.symbol == q.symbol)
            .order_by(StockQuote.recorded_at.desc())
            .limit(30)
        )
        spark_result = await db.execute(sparkline_stmt)
        sparkline = [row[0] for row in reversed(spark_result.all())]

        quotes.append(
            StockQuoteSchema(
                symbol=q.symbol,
                name=SYMBOL_NAMES.get(q.symbol, q.symbol),
                price=q.price,
                change_pct=q.change_pct,
                volume=q.volume,
                sparkline=sparkline,
                recorded_at=q.recorded_at,
            )
        )
    return quotes


async def get_stock_history(
    db: AsyncSession,
    symbol: str,
    limit: int = 30,
) -> list[StockPointSchema]:
    stmt = (
        select(StockQuote)
        .where(StockQuote.symbol == symbol.upper())
        .order_by(StockQuote.recorded_at.desc())
        .limit(limit)
    )
    result = await db.execute(stmt)
    rows = list(result.scalars().all())
    return [
        StockPointSchema(price=r.price, recorded_at=r.recorded_at)
        for r in reversed(rows)
    ]
