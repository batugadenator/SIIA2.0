from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/reabilita/", include("apps.reabilita.urls")),
    path("api/v1/", include("apps.reabilita.urls")),
    path("api/siagg/", include("apps.siagg.urls")),
    path("api/cms/", include("apps.cms.urls")),
    path("api/usuarios/", include("apps.usuarios.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
