import asyncio
import logging
from abc import ABC, abstractmethod
from datetime import datetime, timezone

from sqlalchemy import update
from sqlalchemy.dialects.postgresql import insert as pg_insert

from app.database import async_session
from app.models.ingest_status import IngestStatus

logger = logging.getLogger(__name__)


class BaseIngestWorker(ABC):
    name: str = "unknown"
    heartbeat_interval: float = 30.0

    def __init__(self):
        self._running = False
        self._task: asyncio.Task | None = None
        self._records_ingested: int = 0

    async def start(self):
        self._running = True
        await self._init_status()
        self._task = asyncio.create_task(self._run_loop())
        logger.info("Ingest worker '%s' started", self.name)

    async def stop(self):
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        await self._update_status("offline")
        logger.info("Ingest worker '%s' stopped", self.name)

    async def _run_loop(self):
        try:
            await self.run()
        except asyncio.CancelledError:
            raise
        except Exception as e:
            logger.exception("Ingest worker '%s' crashed: %s", self.name, e)
            await self._update_status("offline", error=str(e))

    @abstractmethod
    async def run(self):
        ...

    async def heartbeat(self, status: str = "operational"):
        await self._update_status(status)

    async def _init_status(self):
        async with async_session() as db:
            stmt = pg_insert(IngestStatus).values(
                id=self.name,
                status="operational",
                last_heartbeat=datetime.now(timezone.utc),
                records_ingested=0,
            ).on_conflict_do_update(
                index_elements=["id"],
                set_={
                    "status": "operational",
                    "last_heartbeat": datetime.now(timezone.utc),
                    "error_message": None,
                },
            )
            await db.execute(stmt)
            await db.commit()

    async def _update_status(self, status: str, error: str | None = None):
        async with async_session() as db:
            stmt = (
                update(IngestStatus)
                .where(IngestStatus.id == self.name)
                .values(
                    status=status,
                    last_heartbeat=datetime.now(timezone.utc),
                    records_ingested=self._records_ingested,
                    error_message=error,
                )
            )
            await db.execute(stmt)
            await db.commit()

    def increment_records(self, count: int = 1):
        self._records_ingested += count
