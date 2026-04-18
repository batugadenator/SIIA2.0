from django.apps import AppConfig


class CadfuncionalConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.cadfuncional"
    # Keep historical migration label stable to avoid rewriting migration history.
    label = "reabilita"
