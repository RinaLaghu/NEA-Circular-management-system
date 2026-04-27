from functools import lru_cache

from pydantic import computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
	app_name: str = "NEA Circular Management API"
	app_env: str = "development"
	allowed_origins_raw: str = (
		"http://127.0.0.1:5500,http://localhost:5500,http://127.0.0.1:3000,http://localhost:3000"
	)
	database_url: str = "sqlite:///./nea_circular.db"
	secret_key: str = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
	algorithm: str = "HS256"
	access_token_expire_minutes: int = 60

	model_config = SettingsConfigDict(
		env_file=".env",
		env_file_encoding="utf-8",
		case_sensitive=False,
		extra="ignore",
	)

	@computed_field
	@property
	def allowed_origins(self) -> list[str]:
		return [origin.strip() for origin in self.allowed_origins_raw.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
	return Settings()
