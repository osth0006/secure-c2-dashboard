import asyncio
import json
import logging
import time

import websockets

from app.config import settings
from app.database import async_session
from app.alerts.engine import evaluate_entity
from app.ingest.base import BaseIngestWorker
from app.services.entity_service import insert_track_point, upsert_entity
from app.services.ws_manager import ws_manager

logger = logging.getLogger(__name__)

AISSTREAM_URL = "wss://stream.aisstream.io/v0/stream"
THROTTLE_INTERVAL = 10  # seconds between DB writes per entity


class AISWorker(BaseIngestWorker):
    name = "ais"

    def __init__(self):
        super().__init__()
        self._last_write: dict[str, float] = {}  # mmsi -> timestamp

    async def run(self):
        while self._running:
            try:
                await self._connect_and_stream()
            except Exception as e:
                logger.error("AIS connection error: %s", e)
                await self.heartbeat("degraded")
                await asyncio.sleep(5)

    async def _connect_and_stream(self):
        subscribe_msg = json.dumps({
            "APIKey": settings.aisstream_api_key,
            "BoundingBoxes": [[[-90, -180], [90, 180]]],
            "FiltersShipMMSI": [],
            "FilterMessageTypes": ["PositionReport"],
        })

        async with websockets.connect(AISSTREAM_URL, ping_interval=20) as ws:
            await ws.send(subscribe_msg)
            logger.info("AIS: Connected to AISStream")
            await self.heartbeat()

            async for raw_msg in ws:
                if not self._running:
                    break

                try:
                    msg = json.loads(raw_msg)
                    await self._process_message(msg)
                except Exception as e:
                    logger.debug("AIS message processing error: %s", e)

    async def _process_message(self, msg: dict):
        msg_type = msg.get("MessageType", "")
        if msg_type != "PositionReport":
            return

        meta = msg.get("MetaData", {})
        pos = msg.get("Message", {}).get("PositionReport", {})
        if not pos:
            return

        mmsi = str(meta.get("MMSI", ""))
        if not mmsi:
            return

        # Throttle: only write to DB every THROTTLE_INTERVAL per entity
        now = time.time()
        last = self._last_write.get(mmsi, 0)
        if now - last < THROTTLE_INTERVAL:
            return
        self._last_write[mmsi] = now

        lat = pos.get("Latitude")
        lon = pos.get("Longitude")
        if lat is None or lon is None:
            return
        if lat == 0 and lon == 0:
            return  # Invalid position

        heading = pos.get("TrueHeading")
        if heading and heading >= 511:
            heading = None
        speed = pos.get("Sog")  # Speed over ground in knots
        cog = pos.get("Cog")

        ship_name = meta.get("ShipName", "").strip()
        callsign_str = ship_name if ship_name else f"MMSI-{mmsi}"

        async with async_session() as db:
            entity = await upsert_entity(
                db,
                source_id=mmsi,
                data_source="ais",
                callsign=callsign_str,
                category="vessel",
                latitude=lat,
                longitude=lon,
                heading=heading if heading else cog,
                speed=speed,
                altitude=0.0,
                metadata={
                    "mmsi": mmsi,
                    "ship_name": ship_name,
                    "ship_type": meta.get("ShipType"),
                    "country": meta.get("country"),
                    "destination": meta.get("Destination"),
                },
            )

            await insert_track_point(
                db,
                entity_id=entity.id,
                latitude=lat,
                longitude=lon,
                heading=heading if heading else cog,
                speed=speed,
                altitude=0.0,
            )

            await evaluate_entity(entity, db)
            await db.commit()
            self.increment_records()

        await ws_manager.broadcast(
            "entity_update",
            {
                "id": str(entity.id),
                "source_id": mmsi,
                "data_source": "ais",
                "callsign": callsign_str,
                "category": "vessel",
                "latitude": lat,
                "longitude": lon,
                "heading": heading if heading else cog,
                "speed": speed,
                "altitude": 0.0,
            },
        )
