from datetime import datetime, timezone

from sqlalchemy import BigInteger, Column, DateTime, Float, Index, String

from app.models.base import Base


class StockQuote(Base):
    __tablename__ = "stock_quotes"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    symbol = Column(String(20), nullable=False)
    price = Column(Float, nullable=False)
    change_pct = Column(Float, nullable=True)
    volume = Column(BigInteger, nullable=True)
    recorded_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        Index("ix_stock_symbol_time", "symbol", "recorded_at"),
    )
