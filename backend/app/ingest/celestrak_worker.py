import asyncio
import logging
import math
from datetime import datetime, timezone

import httpx
from sgp4.api import Satrec, WGS72
from sgp4.api import jday

from app.database import async_session
from app.ingest.base import BaseIngestWorker
from app.services.entity_service import insert_track_point, upsert_entity
from app.services.ws_manager import ws_manager

logger = logging.getLogger(__name__)

CELESTRAK_URL = "https://celestrak.org/NORAD/elements/gp.php"
GROUPS = ["stations", "visual", "active"]
POLL_INTERVAL = 1800  # 30 minutes
POSITION_UPDATE_INTERVAL = 60  # Recompute positions every 60 seconds


class CelesTrakWorker(BaseIngestWorker):
    name = "celestrak"

    def __init__(self):
        super().__init__()
        self._satellites: dict[str, dict] = {}  # norad_id -> sat data with Satrec

    async def run(self):
        while self._running:
            try:
                await self._fetch_tle_data()
                await self.heartbeat()
            except Exception as e:
                logger.error("CelesTrak fetch error: %s", e)
                await self.heartbeat("degraded")

            # Between TLE fetches, recompute positions periodically
            for _ in range(POLL_INTERVAL // POSITION_UPDATE_INTERVAL):
                if not self._running:
                    break
                await asyncio.sleep(POSITION_UPDATE_INTERVAL)
                try:
                    await self._propagate_and_update()
                except Exception as e:
                    logger.error("CelesTrak propagation error: %s", e)

    async def _fetch_tle_data(self):
        async with httpx.AsyncClient(timeout=30.0) as client:
            for group in GROUPS:
                try:
                    resp = await client.get(
                        CELESTRAK_URL,
                        params={"GROUP": group, "FORMAT": "json"},
                    )
                    resp.raise_for_status()
                    records = resp.json()
                    logger.info("CelesTrak: fetched %d records from group '%s'", len(records), group)

                    for rec in records:
                        norad_id = str(rec.get("NORAD_CAT_ID", ""))
                        if not norad_id:
                            continue
                        tle1 = rec.get("TLE_LINE1", "")
                        tle2 = rec.get("TLE_LINE2", "")
                        if not tle1 or not tle2:
                            continue

                        try:
                            sat = Satrec.twoline2rv(tle1, tle2, WGS72)
                            self._satellites[norad_id] = {
                                "satrec": sat,
                                "name": rec.get("OBJECT_NAME", f"SAT-{norad_id}"),
                                "norad_id": norad_id,
                                "tle1": tle1,
                                "tle2": tle2,
                                "inclination": rec.get("INCLINATION"),
                                "period": rec.get("PERIOD"),
                            }
                        except Exception:
                            continue

                except Exception as e:
                    logger.error("CelesTrak group '%s' error: %s", group, e)

        logger.info("CelesTrak: tracking %d satellites total", len(self._satellites))
        await self._propagate_and_update()

    async def _propagate_and_update(self):
        now = datetime.now(timezone.utc)
        jd, fr = jday(now.year, now.month, now.day, now.hour, now.minute, now.second + now.microsecond / 1e6)

        count = 0
        async with async_session() as db:
            for norad_id, sat_data in self._satellites.items():
                sat = sat_data["satrec"]
                e, r, v = sat.sgp4(jd, fr)
                if e != 0:
                    continue

                # Convert ECI to lat/lon/alt
                lat, lon, alt = eci_to_geodetic(r, jd + fr)
                speed = math.sqrt(v[0] ** 2 + v[1] ** 2 + v[2] ** 2)  # km/s

                entity = await upsert_entity(
                    db,
                    source_id=norad_id,
                    data_source="celestrak",
                    callsign=sat_data["name"],
                    category="satellite",
                    latitude=lat,
                    longitude=lon,
                    heading=0.0,
                    speed=speed,
                    altitude=alt * 1000,  # km to meters
                    metadata={
                        "norad_id": norad_id,
                        "tle1": sat_data["tle1"],
                        "tle2": sat_data["tle2"],
                        "inclination": sat_data.get("inclination"),
                        "period": sat_data.get("period"),
                    },
                )

                await insert_track_point(
                    db,
                    entity_id=entity.id,
                    latitude=lat,
                    longitude=lon,
                    heading=0.0,
                    speed=speed,
                    altitude=alt * 1000,
                )

                count += 1

                # Broadcast every 50th entity to avoid flooding WebSocket
                if count % 50 == 0:
                    await ws_manager.broadcast(
                        "entity_update",
                        {
                            "id": str(entity.id),
                            "source_id": norad_id,
                            "data_source": "celestrak",
                            "callsign": sat_data["name"],
                            "category": "satellite",
                            "latitude": lat,
                            "longitude": lon,
                            "speed": speed,
                            "altitude": alt * 1000,
                        },
                    )

            await db.commit()
            self.increment_records(count)
            logger.info("CelesTrak: updated %d satellite positions", count)


def eci_to_geodetic(r: tuple, jd_total: float) -> tuple[float, float, float]:
    """Convert ECI (km) coordinates to geodetic lat/lon/alt."""
    x, y, z = r

    # Earth parameters (WGS84)
    a = 6378.137  # equatorial radius km
    f = 1 / 298.257223563
    b = a * (1 - f)
    e2 = 1 - (b / a) ** 2

    # Greenwich Mean Sidereal Time
    t_ut1 = (jd_total - 2451545.0) / 36525.0
    gmst = (
        67310.54841
        + (876600 * 3600 + 8640184.812866) * t_ut1
        + 0.093104 * t_ut1 ** 2
        - 6.2e-6 * t_ut1 ** 3
    )
    gmst = math.radians((gmst % 86400) / 240.0)

    # Longitude
    lon = math.atan2(y, x) - gmst
    lon = math.degrees(lon)
    while lon > 180:
        lon -= 360
    while lon < -180:
        lon += 360

    # Latitude (iterative)
    p = math.sqrt(x ** 2 + y ** 2)
    lat = math.atan2(z, p)
    for _ in range(10):
        sin_lat = math.sin(lat)
        n = a / math.sqrt(1 - e2 * sin_lat ** 2)
        lat = math.atan2(z + e2 * n * sin_lat, p)

    lat = math.degrees(lat)
    sin_lat = math.sin(math.radians(lat))
    n = a / math.sqrt(1 - e2 * sin_lat ** 2)
    alt = p / math.cos(math.radians(lat)) - n  # km

    return lat, lon, alt
