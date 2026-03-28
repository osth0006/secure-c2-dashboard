import asyncio
import logging
from datetime import datetime, timezone

import yfinance as yf

from app.config import settings
from app.database import async_session
from app.alerts.engine import check_stock_circuit_breaker
from app.ingest.base import BaseIngestWorker
from app.models.stock_quote import StockQuote
from app.schemas.stock import SYMBOL_NAMES
from app.services.ws_manager import ws_manager

logger = logging.getLogger(__name__)

MARKET_POLL_INTERVAL = 60  # seconds during market hours
OFF_HOURS_POLL_INTERVAL = 300  # 5 minutes off-hours


class StockWorker(BaseIngestWorker):
    name = "stocks"

    async def run(self):
        while self._running:
            try:
                await self._poll()
                await self.heartbeat()
            except Exception as e:
                logger.error("Stock poll error: %s", e)
                await self.heartbeat("degraded")

            interval = self._get_poll_interval()
            await asyncio.sleep(interval)

    def _get_poll_interval(self) -> int:
        now = datetime.now(timezone.utc)
        # US market hours: roughly 14:30 - 21:00 UTC (9:30 AM - 4:00 PM ET)
        if now.weekday() < 5 and 14 <= now.hour < 21:
            return MARKET_POLL_INTERVAL
        return OFF_HOURS_POLL_INTERVAL

    async def _poll(self):
        symbols = settings.stock_symbol_list
        quotes_data = []

        # yfinance is synchronous, run in executor
        loop = asyncio.get_event_loop()
        for symbol in symbols:
            try:
                info = await loop.run_in_executor(None, self._fetch_quote, symbol)
                if info:
                    quotes_data.append(info)
            except Exception as e:
                logger.error("Stock fetch error for %s: %s", symbol, e)

        if not quotes_data:
            return

        async with async_session() as db:
            for q in quotes_data:
                quote = StockQuote(
                    symbol=q["symbol"],
                    price=q["price"],
                    change_pct=q["change_pct"],
                    volume=q.get("volume"),
                    recorded_at=datetime.now(timezone.utc),
                )
                db.add(quote)
                self.increment_records()
                if q.get("change_pct") is not None:
                    await check_stock_circuit_breaker(q["symbol"], q["change_pct"], db)
            await db.commit()

        # Broadcast stock update
        await ws_manager.broadcast(
            "stock_update",
            {"quotes": quotes_data},
        )

    def _fetch_quote(self, symbol: str) -> dict | None:
        try:
            ticker = yf.Ticker(symbol)
            info = ticker.fast_info
            price = getattr(info, "last_price", None)
            prev_close = getattr(info, "previous_close", None)

            if price is None:
                return None

            change_pct = 0.0
            if prev_close and prev_close > 0:
                change_pct = ((price - prev_close) / prev_close) * 100

            return {
                "symbol": symbol,
                "name": SYMBOL_NAMES.get(symbol, symbol),
                "price": round(price, 2),
                "change_pct": round(change_pct, 2),
                "volume": getattr(info, "last_volume", None),
            }
        except Exception as e:
            logger.error("yfinance error for %s: %s", symbol, e)
            return None
