from pydantic import BaseModel

from app.schemas.alert import AlertSchema
from app.schemas.entity import EntitySchema
from app.schemas.stock import StockQuoteSchema


class IngestStatusSchema(BaseModel):
    id: str
    status: str
    last_heartbeat: float | None = None
    records_ingested: int = 0
    error_message: str | None = None

    model_config = {"from_attributes": True}


class DashboardSnapshot(BaseModel):
    entities: list[EntitySchema] = []
    alerts: list[AlertSchema] = []
    stocks: list[StockQuoteSchema] = []
    ingest_status: list[IngestStatusSchema] = []
