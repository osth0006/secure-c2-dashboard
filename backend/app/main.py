import asyncio
import logging

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine
from app.models import Base
from app.routers import alerts, dashboard, entities, ingest, stocks, ws

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# Workers will be stored here after startup
_workers = []


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables and start ingest workers
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables created/verified")

    # Start ingest workers
    if settings.ingest_celestrak_enabled:
        from app.ingest.celestrak_worker import CelesTrakWorker
        w = CelesTrakWorker()
        await w.start()
        _workers.append(w)

    if settings.ingest_ais_enabled and settings.aisstream_api_key:
        from app.ingest.ais_worker import AISWorker
        w = AISWorker()
        await w.start()
        _workers.append(w)

    if settings.ingest_adsb_enabled and settings.adsb_rapidapi_key:
        from app.ingest.adsb_worker import ADSBWorker
        w = ADSBWorker()
        await w.start()
        _workers.append(w)

    if settings.ingest_stocks_enabled:
        from app.ingest.stock_worker import StockWorker
        w = StockWorker()
        await w.start()
        _workers.append(w)

    logger.info("Started %d ingest workers", len(_workers))

    # Start alert engine periodic scan
    from app.alerts.engine import periodic_scan
    scan_task = asyncio.create_task(periodic_scan())

    yield

    scan_task.cancel()
    try:
        await scan_task
    except asyncio.CancelledError:
        pass

    # Shutdown: stop all workers
    for w in _workers:
        await w.stop()
    await engine.dispose()
    logger.info("Shutdown complete")


app = FastAPI(
    title="Secure C2 Dashboard API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(dashboard.router)
app.include_router(entities.router)
app.include_router(alerts.router)
app.include_router(stocks.router)
app.include_router(ingest.router)
app.include_router(ws.router)


@app.get("/api/health")
async def health():
    return {"status": "ok"}
