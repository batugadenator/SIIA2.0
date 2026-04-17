from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    HealthView,
    SiaggAreaViewSet,
    SiaggDataEntryViewSet,
    SiaggGovernanceDocumentViewSet,
    PncpPcaSummaryView,
    SiaggReportFileViewSet,
    SiaggReportViewSet,
)

router = DefaultRouter()
router.register("areas", SiaggAreaViewSet, basename="siagg-area")
router.register("data-entries", SiaggDataEntryViewSet, basename="siagg-data-entry")
router.register("reports", SiaggReportViewSet, basename="siagg-report")
router.register("report-files", SiaggReportFileViewSet, basename="siagg-report-file")
router.register("governance-documents", SiaggGovernanceDocumentViewSet, basename="siagg-governance-document")

urlpatterns = [
    path("health/", HealthView.as_view(), name="siagg-health"),
    path("pncp/pca-summary/", PncpPcaSummaryView.as_view(), name="siagg-pncp-pca-summary"),
    path("", include(router.urls)),
]
