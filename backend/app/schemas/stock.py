from datetime import datetime

from pydantic import BaseModel


class StockQuoteSchema(BaseModel):
    symbol: str
    name: str
    price: float
    change_pct: float | None = None
    volume: int | None = None
    sparkline: list[float] = []
    recorded_at: datetime

    model_config = {"from_attributes": True}


class StockPointSchema(BaseModel):
    price: float
    recorded_at: datetime

    model_config = {"from_attributes": True}


SYMBOL_NAMES: dict[str, str] = {
    "SPY": "S&P 500",
    "DIA": "DJIA",
    "QQQ": "NASDAQ 100",
    "IWM": "Russell 2000",
}
