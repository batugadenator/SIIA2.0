import os

from .settings import *  # noqa: F403, F401

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("POSTGRES_TEST_DB", "test_siia"),
        "USER": os.getenv("POSTGRES_USER", "siia"),
        "PASSWORD": os.getenv("POSTGRES_PASSWORD", "highlighter"),
        "HOST": os.getenv("POSTGRES_HOST", "localhost"),
        "PORT": os.getenv("POSTGRES_PORT", "5432"),
        "OPTIONS": {
            "options": f"-c search_path={os.getenv('POSTGRES_SEARCH_PATH', 'public,siagg,cadfuncional')}",
        },
    }
}

PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]

USE_LDAP_AUTH = False
