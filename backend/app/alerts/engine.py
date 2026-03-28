"""Alert evaluation engine. Called by ingest workers and periodic scanner."""

import asyncio
import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.alerts.anomaly import anomaly_detector
from app.alerts.rules import ENTITY_RULES, SCAN_RULES
from app.database import async_session
from app.models.alert import Alert
from app.models.entity import Entity
from app.services.alert_service import create_alert
from app.services.ws_manager import ws_manager

logger = logging.getLogger(__name__)

# Cooldown: don't re-fire the same rule+entity within this window
ALERT_COOLDOWN_SECONDS = 300  # 5 minutes
_recent_alerts: dict[str, float] = {}  # "rule:entity_id" -> timestamp


async def evaluate_entity(entity: Entity, db: AsyncSession):
    """Run all entity-level rules and anomaly checks against a single entity."""
    # Rule-based checks
    for rule_fn in ENTITY_RULES:
        try:
            result = await rule_fn(entity=entity, db=db)
            if result:
                await _emit_alert(db, result)
        except Exception as e:
            logger.error("Rule check error: %s", e)

    # Anomaly detection (synchronous, runs in-memory)
    try:
        anomalies = anomaly_detector.check(entity)
        for alert_data in anomalies:
            await _emit_alert(db, alert_data)
    except Exception as e:
        logger.error("Anomaly detection error: %s", e)


async def periodic_scan():
    """Run periodic scan rules (proximity, stale entity, etc.) every 60 seconds."""
    while True:
        await asyncio.sleep(60)
        try:
            async with async_session() as db:
                for rule_fn in SCAN_RULES:
                    try:
                        results = await rule_fn(db=db)
                        if isinstance(results, list):
                            for r in results:
                                await _emit_alert(db, r)
                        elif results:
                            await _emit_alert(db, results)
                    except Exception as e:
                        logger.error("Scan rule error: %s", e)
                await db.commit()
        except Exception as e:
            logger.error("Periodic scan error: %s", e)


async def check_stock_circuit_breaker(symbol: str, change_pct: float, db: AsyncSession):
    """Check if a stock has hit the circuit breaker threshold."""
    if abs(change_pct) >= 5.0:
        await _emit_alert(
            db,
            {
                "severity": "critical",
                "title": f"MARKET CIRCUIT BREAKER: {symbol}",
                "message": f"{symbol} moved {change_pct:+.2f}% in current session",
                "source": "rule:stock_circuit_breaker",
                "entity_id": None,
            },
        )


async def _emit_alert(db: AsyncSession, alert_data: dict):
    """Create an alert if not in cooldown, then broadcast via WebSocket."""
    source = alert_data.get("source", "unknown")
    entity_id = alert_data.get("entity_id")
    cooldown_key = f"{source}:{entity_id}"

    import time
    now = time.time()
    if cooldown_key in _recent_alerts:
        if now - _recent_alerts[cooldown_key] < ALERT_COOLDOWN_SECONDS:
            return
    _recent_alerts[cooldown_key] = now

    # Clean old cooldown entries periodically
    if len(_recent_alerts) > 10000:
        cutoff = now - ALERT_COOLDOWN_SECONDS
        to_remove = [k for k, v in _recent_alerts.items() if v < cutoff]
        for k in to_remove:
            del _recent_alerts[k]

    alert = await create_alert(
        db,
        severity=alert_data["severity"],
        title=alert_data["title"],
        message=alert_data.get("message"),
        source=source,
        entity_id=entity_id,
    )

    await ws_manager.broadcast(
        "new_alert",
        {
            "id": str(alert.id),
            "severity": alert.severity,
            "title": alert.title,
            "message": alert.message,
            "source": alert.source,
            "entity_id": str(alert.entity_id) if alert.entity_id else None,
            "created_at": alert.created_at.isoformat(),
        },
    )
