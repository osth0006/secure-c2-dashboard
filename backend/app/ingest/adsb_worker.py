import asyncio
import logging

import httpx

from app.config import settings
from app.database import async_session
from app.alerts.engine import evaluate_entity
from app.ingest.base import BaseIngestWorker
from app.services.entity_service import insert_track_point, upsert_entity
from app.services.ws_manager import ws_manager

logger = logging.getLogger(__name__)

ADSB_BASE_URL = "https://adsbexchange-com1.p.rapidapi.com"
POLL_INTERVAL = 15  # seconds


class ADSBWorker(BaseIngestWorker):
    name = "adsb"

    async def run(self):
        while self._running:
            try:
                await self._poll()
                await self.heartbeat()
            except Exception as e:
                logger.error("ADS-B poll error: %s", e)
                await self.heartbeat("degraded")
            await asyncio.sleep(POLL_INTERVAL)

    async def _poll(self):
        headers = {
            "X-RapidAPI-Key": settings.adsb_rapidapi_key,
            "X-RapidAPI-Host": "adsbexchange-com1.p.rapidapi.com",
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            # Fetch aircraft near a central point (e.g., 40N 74W = NYC area, 250nm radius)
            # You can expand to multiple regions
            resp = await client.get(
                f"{ADSB_BASE_URL}/v2/lat/40.0/lon/-74.0/dist/250/",
                headers=headers,
            )
            resp.raise_for_status()
            data = resp.json()

        aircraft_list = data.get("ac", [])
        if not aircraft_list:
            return

        logger.info("ADS-B: received %d aircraft", len(aircraft_list))

        async with async_session() as db:
            for ac in aircraft_list:
                icao = ac.get("hex", "").strip()
                if not icao:
                    continue

                lat = ac.get("lat")
                lon = ac.get("lon")
                if lat is None or lon is None:
                    continue

                alt = ac.get("alt_baro")
                if isinstance(alt, str):
                    alt = None  # "ground" etc.
                speed = ac.get("gs")  # ground speed in knots
                heading = ac.get("track")
                flight = ac.get("flight", "").strip()
                reg = ac.get("r", "").strip()
                ac_type = ac.get("t", "").strip()

                callsign = flight or reg or f"ICAO-{icao.upper()}"

                entity = await upsert_entity(
                    db,
                    source_id=icao,
                    data_source="adsb",
                    callsign=callsign,
                    category="aircraft",
                    latitude=lat,
                    longitude=lon,
                    heading=heading,
                    speed=speed,
                    altitude=alt,
                    metadata={
                        "icao": icao,
                        "flight": flight,
                        "registration": reg,
                        "aircraft_type": ac_type,
                        "squawk": ac.get("squawk"),
                        "category": ac.get("category"),
                    },
                )

                await insert_track_point(
                    db,
                    entity_id=entity.id,
                    latitude=lat,
                    longitude=lon,
                    heading=heading,
                    speed=speed,
                    altitude=alt,
                )

                await evaluate_entity(entity, db)
                self.increment_records()

            await db.commit()

        # Broadcast a batch update
        await ws_manager.broadcast(
            "entity_update",
            {
                "data_source": "adsb",
                "count": len(aircraft_list),
                "batch": True,
            },
        )
