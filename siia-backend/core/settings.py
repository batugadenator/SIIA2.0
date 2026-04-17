import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = "dev-only-secret-key-change-me"
DEBUG = True
ALLOWED_HOSTS = ["*"]

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "rest_framework",
    "rest_framework.authtoken",
    "apps.reabilita",
    "apps.siagg",
    "apps.cms",
    "apps.usuarios",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "core.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "core.wsgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("POSTGRES_DB", "siia"),
        "USER": os.getenv("POSTGRES_USER", "siia"),
        "PASSWORD": os.getenv("POSTGRES_PASSWORD", "highlighter"),
        "HOST": os.getenv("POSTGRES_HOST", "localhost"),
        "PORT": os.getenv("POSTGRES_PORT", "5432"),
        "OPTIONS": {
            "options": f"-c search_path={os.getenv('POSTGRES_SEARCH_PATH', 'reabilita,public')}",
        },
        "TEST": {
            "NAME": os.getenv("POSTGRES_TEST_DB", "test_siia"),
        },
    }
}

AUTH_USER_MODEL = "usuarios.Usuario"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.TokenAuthentication",
    ],
}

LDAP_SERVER_URI = os.getenv("LDAP_SERVER_URI", "")
LDAP_BIND_DN_TEMPLATE = os.getenv("LDAP_BIND_DN_TEMPLATE", "")
LDAP_USE_SSL = os.getenv("LDAP_USE_SSL", "false").lower() in {"1", "true", "yes"}
USE_LDAP_AUTH = os.getenv("USE_LDAP_AUTH", "false").lower() in {"1", "true", "yes"}

# LDAP (django-auth-ldap) - AMAN
AUTHENTICATION_BACKENDS = ["django.contrib.auth.backends.ModelBackend"]

if USE_LDAP_AUTH:
    AUTH_LDAP_SERVER_URI = os.getenv("AUTH_LDAP_SERVER_URI", LDAP_SERVER_URI or "ldap://servidor.aman.intranet")
    AUTH_LDAP_BIND_DN = os.getenv(
        "AUTH_LDAP_BIND_DN",
        "CN=UsuarioConsulta,OU=Usuarios,DC=aman,DC=eb,DC=mil,DC=br",
    )
    AUTH_LDAP_BIND_PASSWORD = os.getenv("AUTH_LDAP_BIND_PASSWORD", "")
    AUTH_LDAP_USER_SEARCH_BASE = os.getenv(
        "AUTH_LDAP_USER_SEARCH_BASE",
        "OU=Usuarios,DC=aman,DC=eb,DC=mil,DC=br",
    )
    AUTH_LDAP_USER_SEARCH_FILTER = os.getenv("AUTH_LDAP_USER_SEARCH_FILTER", "(sAMAccountName=%(user)s)")

    try:
        import ldap
        from django_auth_ldap.config import LDAPSearch

        AUTH_LDAP_USER_SEARCH = LDAPSearch(
            AUTH_LDAP_USER_SEARCH_BASE,
            ldap.SCOPE_SUBTREE,
            AUTH_LDAP_USER_SEARCH_FILTER,
        )

        AUTH_LDAP_USER_ATTR_MAP = {
            "first_name": "givenName",
            "last_name": "sn",
            "email": "mail",
        }

        AUTHENTICATION_BACKENDS = [
            "django_auth_ldap.backend.LDAPBackend",
            "django.contrib.auth.backends.ModelBackend",
        ]
    except Exception:
        # Keep local authentication available when LDAP libs are not installed.
        pass

AUTH_PASSWORD_VALIDATORS = []

LANGUAGE_CODE = "pt-br"
TIME_ZONE = "America/Sao_Paulo"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5175",
    "http://localhost:5176",
    "http://127.0.0.1:5176",
]

CORS_ALLOW_CREDENTIALS = True

# Allow header-based token auth from frontend requests.
CORS_ALLOW_HEADERS = [
    "accept",
    "accept-encoding",
    "authorization",
    "content-type",
    "dnt",
    "origin",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
]

CORS_ALLOW_METHODS = [
    "DELETE",
    "GET",
    "OPTIONS",
    "PATCH",
    "POST",
    "PUT",
]


def _csv_hosts(env_name: str, default: str = ""):
    raw = os.getenv(env_name, default)
    values = [item.strip().lower() for item in raw.split(",") if item.strip()]
    return values


SIIA_ENV = (os.getenv("SIIA_ENV", "dev") or "dev").strip().lower()
CMS_LEGACY_HOSTS_BY_ENV = {
    "dev": "siia-dev.eb.mil.br",
    "hml": "siia-hom.eb.mil.br",
    "prod": "siia.eb.mil.br",
}
DEFAULT_CMS_LEGACY_HOST = CMS_LEGACY_HOSTS_BY_ENV.get(SIIA_ENV, CMS_LEGACY_HOSTS_BY_ENV["prod"])


# Validação corporativa de URLs de menu (dev/hml/prod via env)
# Exemplo:
#   CMS_ALLOWED_NEXTCLOUD_HOSTS=nextcloud.aman.eb.mil.br,nextcloud.hml.aman.eb.mil.br
#   CMS_ALLOWED_LEGACY_HOSTS=siia.aman.eb.mil.br,legados.aman.eb.mil.br
#   CMS_ALLOWED_EXTERNAL_HOSTS=portal.gov.br,www.gov.br
CMS_ALLOWED_NEXTCLOUD_HOSTS = _csv_hosts(
    "CMS_ALLOWED_NEXTCLOUD_HOSTS",
    "nextcloud.aman.eb.mil.br,nextcloud.exemplo.gov.br",
)
CMS_ALLOWED_LEGACY_HOSTS = _csv_hosts(
    "CMS_ALLOWED_LEGACY_HOSTS",
    DEFAULT_CMS_LEGACY_HOST,
)
CMS_ALLOWED_EXTERNAL_HOSTS = _csv_hosts("CMS_ALLOWED_EXTERNAL_HOSTS", "")


CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "siia-cms-cache",
    }
}


LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "json_like": {
            "format": '{"time":"%(asctime)s","level":"%(levelname)s","logger":"%(name)s","message":"%(message)s"}',
        }
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "json_like",
        }
    },
    "loggers": {
        "cms.audit": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        }
    },
}
