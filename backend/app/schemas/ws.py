from typing import Any

from pydantic import BaseModel


class WSMessage(BaseModel):
    type: str  # entity_update, new_alert, stock_update, ingest_status
    data: dict[str, Any]
    timestamp: float
