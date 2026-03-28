from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://c2user:changeme@localhost:5432/c2dashboard"

    aisstream_api_key: str = ""
    adsb_rapidapi_key: str = ""

    stock_symbols: str = "SPY,DIA,QQQ,IWM"
    cors_origins: str = "http://localhost:3000"

    ingest_ais_enabled: bool = True
    ingest_adsb_enabled: bool = True
    ingest_celestrak_enabled: bool = True
    ingest_stocks_enabled: bool = True

    @property
    def stock_symbol_list(self) -> list[str]:
        return [s.strip() for s in self.stock_symbols.split(",") if s.strip()]

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
