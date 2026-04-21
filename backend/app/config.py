"""Compatibility shim.

Use app.core.settings for all new imports.
"""

from app.core.settings import Settings, get_settings


__all__ = ["Settings", "get_settings"]
