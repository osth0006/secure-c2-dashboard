"""Statistical anomaly detection using z-scores on speed and heading."""

import logging
import math
from collections import defaultdict

import numpy as np

from app.models.entity import Entity

logger = logging.getLogger(__name__)

# Sliding window size
WINDOW_SIZE = 100
# Z-score threshold
Z_THRESHOLD = 3.0


class AnomalyDetector:
    def __init__(self):
        # Per-entity sliding windows: entity_id -> list of values
        self._speed_windows: dict[str, list[float]] = defaultdict(list)
        self._heading_delta_windows: dict[str, list[float]] = defaultdict(list)
        self._last_heading: dict[str, float] = {}
        self._last_position: dict[str, tuple[float, float, float]] = {}  # lat, lon, timestamp

    def check(self, entity: Entity) -> list[dict]:
        """Run all anomaly checks on an entity. Returns list of alert dicts."""
        alerts = []
        eid = str(entity.id)

        # Speed anomaly
        if entity.speed is not None:
            alert = self._check_speed(eid, entity)
            if alert:
                alerts.append(alert)

        # Heading rate of change anomaly
        if entity.heading is not None:
            alert = self._check_heading_change(eid, entity)
            if alert:
                alerts.append(alert)

        # Position jump detection
        if entity.latitude and entity.longitude:
            alert = self._check_position_jump(eid, entity)
            if alert:
                alerts.append(alert)

        return alerts

    def _check_speed(self, eid: str, entity: Entity) -> dict | None:
        window = self._speed_windows[eid]
        window.append(entity.speed)
        if len(window) > WINDOW_SIZE:
            window.pop(0)

        if len(window) < 10:
            return None

        arr = np.array(window)
        mean = np.mean(arr)
        std = np.std(arr)

        if std < 0.01:
            return None

        z = abs(entity.speed - mean) / std
        if z > Z_THRESHOLD:
            return {
                "severity": "medium",
                "title": f"SPEED ANOMALY (STATISTICAL): {entity.callsign or entity.source_id}",
                "message": (
                    f"Speed {entity.speed:.1f} is {z:.1f}σ from mean {mean:.1f} "
                    f"(window: {len(window)} samples)"
                ),
                "source": "anomaly:speed_zscore",
                "entity_id": entity.id,
            }
        return None

    def _check_heading_change(self, eid: str, entity: Entity) -> dict | None:
        prev = self._last_heading.get(eid)
        self._last_heading[eid] = entity.heading

        if prev is None:
            return None

        delta = abs(entity.heading - prev)
        if delta > 180:
            delta = 360 - delta

        window = self._heading_delta_windows[eid]
        window.append(delta)
        if len(window) > WINDOW_SIZE:
            window.pop(0)

        if len(window) < 10:
            return None

        arr = np.array(window)
        mean = np.mean(arr)
        std = np.std(arr)

        if std < 0.01:
            return None

        z = abs(delta - mean) / std
        if z > Z_THRESHOLD:
            return {
                "severity": "medium",
                "title": f"HEADING ANOMALY: {entity.callsign or entity.source_id}",
                "message": (
                    f"Heading change {delta:.1f}° is {z:.1f}σ from mean {mean:.1f}°"
                ),
                "source": "anomaly:heading_zscore",
                "entity_id": entity.id,
            }
        return None

    def _check_position_jump(self, eid: str, entity: Entity) -> dict | None:
        now_ts = entity.last_seen.timestamp() if entity.last_seen else 0
        prev = self._last_position.get(eid)
        self._last_position[eid] = (entity.latitude, entity.longitude, now_ts)

        if prev is None:
            return None

        plat, plon, pts = prev
        dt = now_ts - pts
        if dt <= 0:
            return None

        # Distance in nm (approximate)
        dlat = entity.latitude - plat
        dlon = entity.longitude - plon
        dist_nm = math.sqrt(dlat ** 2 + dlon ** 2) * 60

        # Max possible speed by category (knots)
        max_speeds = {"vessel": 50, "aircraft": 700, "satellite": 999999}
        max_speed = max_speeds.get(entity.category, 100)

        # Max distance = max_speed * time (hours) * 1.5 safety margin
        hours = dt / 3600
        max_dist = max_speed * hours * 1.5

        if dist_nm > max_dist and dist_nm > 5:  # Ignore tiny distances
            return {
                "severity": "high",
                "title": f"POSITION JUMP: {entity.callsign or entity.source_id}",
                "message": (
                    f"Moved {dist_nm:.1f}nm in {dt:.0f}s "
                    f"(max expected: {max_dist:.1f}nm)"
                ),
                "source": "anomaly:position_jump",
                "entity_id": entity.id,
            }
        return None


# Singleton
anomaly_detector = AnomalyDetector()
