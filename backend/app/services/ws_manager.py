import json
import logging
import time

from fastapi import WebSocket

from app.schemas.ws import WSMessage

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info("WebSocket connected. Total: %d", len(self.active_connections))

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        logger.info("WebSocket disconnected. Total: %d", len(self.active_connections))

    async def broadcast(self, msg_type: str, data: dict):
        message = WSMessage(type=msg_type, data=data, timestamp=time.time())
        payload = message.model_dump_json()
        stale = []
        for connection in self.active_connections:
            try:
                await connection.send_text(payload)
            except Exception:
                stale.append(connection)
        for conn in stale:
            try:
                self.active_connections.remove(conn)
            except ValueError:
                pass


ws_manager = ConnectionManager()
