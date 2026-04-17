from django.db.models import Q
import requests
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import SiaggArea, SiaggDataEntry, SiaggGovernanceDocument, SiaggReport, SiaggReportFile
from .permissions import (
    IsAuthenticatedReadOnlyOrAreaWriter,
    IsAuthenticatedReadOnlyOrDataEntryWriter,
    IsAuthenticatedReadOnlyOrGovernanceWriter,
    IsAuthenticatedReadOnlyOrPncpRefreshWriter,
    IsAuthenticatedReadOnlyOrReportFileWriter,
    IsAuthenticatedReadOnlyOrReportWriter,
)
from .serializers import (
    SiaggAreaSerializer,
    SiaggDataEntrySerializer,
    SiaggGovernanceDocumentSerializer,
    SiaggReportFileSerializer,
    SiaggReportSerializer,
)
from .services.pncp_service import PncpService


class HealthView(APIView):
    def get(self, request):
        return Response({"module": "siagg", "status": "ok"})


class SiaggAreaViewSet(viewsets.ModelViewSet):
    queryset = SiaggArea.objects.all().order_by("nome")
    serializer_class = SiaggAreaSerializer
    permission_classes = [IsAuthenticatedReadOnlyOrAreaWriter]

    def get_queryset(self):
        queryset = super().get_queryset()
        ativo = self.request.query_params.get("ativo")
        search = (self.request.query_params.get("search") or "").strip()

        if ativo is not None:
            ativo_bool = str(ativo).lower() in {"1", "true", "t", "sim", "yes"}
            queryset = queryset.filter(ativo=ativo_bool)

        if search:
            queryset = queryset.filter(Q(nome__icontains=search) | Q(slug__icontains=search))

        return queryset


class SiaggDataEntryViewSet(viewsets.ModelViewSet):
    queryset = SiaggDataEntry.objects.select_related("area", "operador").all().order_by("-data_referencia", "-id")
    serializer_class = SiaggDataEntrySerializer
    permission_classes = [IsAuthenticatedReadOnlyOrDataEntryWriter]

    def get_queryset(self):
        queryset = super().get_queryset()
        area_id = self.request.query_params.get("area_id")
        data_inicio = self.request.query_params.get("data_inicio")
        data_fim = self.request.query_params.get("data_fim")

        if area_id:
            queryset = queryset.filter(area_id=area_id)
        if data_inicio:
            queryset = queryset.filter(data_referencia__gte=data_inicio)
        if data_fim:
            queryset = queryset.filter(data_referencia__lte=data_fim)

        return queryset


class SiaggReportViewSet(viewsets.ModelViewSet):
    queryset = SiaggReport.objects.select_related("area", "autor").prefetch_related("arquivos").all()
    serializer_class = SiaggReportSerializer
    permission_classes = [IsAuthenticatedReadOnlyOrReportWriter]

    def get_queryset(self):
        queryset = super().get_queryset()
        area_id = self.request.query_params.get("area_id")
        data_inicio = self.request.query_params.get("data_inicio")
        data_fim = self.request.query_params.get("data_fim")
        search = (self.request.query_params.get("search") or "").strip()

        if area_id:
            queryset = queryset.filter(area_id=area_id)
        if data_inicio:
            queryset = queryset.filter(data_referencia__gte=data_inicio)
        if data_fim:
            queryset = queryset.filter(data_referencia__lte=data_fim)
        if search:
            queryset = queryset.filter(Q(titulo__icontains=search) | Q(descricao__icontains=search))

        return queryset

    @action(detail=True, methods=["post"], parser_classes=[MultiPartParser, FormParser], url_path="arquivos")
    def upload_arquivo(self, request, pk=None):
        report = self.get_object()
        serializer = SiaggReportFileSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save(report=report, enviado_por=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class SiaggReportFileViewSet(viewsets.ModelViewSet):
    queryset = SiaggReportFile.objects.select_related("report", "enviado_por").all()
    serializer_class = SiaggReportFileSerializer
    permission_classes = [IsAuthenticatedReadOnlyOrReportFileWriter]
    http_method_names = ["get", "delete", "head", "options"]


class SiaggGovernanceDocumentViewSet(viewsets.ModelViewSet):
    queryset = SiaggGovernanceDocument.objects.select_related("enviado_por").all()
    serializer_class = SiaggGovernanceDocumentSerializer
    permission_classes = [IsAuthenticatedReadOnlyOrGovernanceWriter]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        queryset = super().get_queryset()
        categoria = (self.request.query_params.get("categoria") or "").strip()
        data_inicio = self.request.query_params.get("data_inicio")
        data_fim = self.request.query_params.get("data_fim")
        search = (self.request.query_params.get("search") or "").strip()

        if categoria:
            queryset = queryset.filter(categoria__iexact=categoria)
        if data_inicio:
            queryset = queryset.filter(criado_em__date__gte=data_inicio)
        if data_fim:
            queryset = queryset.filter(criado_em__date__lte=data_fim)
        if search:
            queryset = queryset.filter(Q(titulo__icontains=search) | Q(descricao__icontains=search))

        return queryset


class PncpPcaSummaryView(APIView):
    permission_classes = [IsAuthenticatedReadOnlyOrPncpRefreshWriter]

    @staticmethod
    def _validate_input(cnpj, ano_raw):
        cnpj_clean = str(cnpj or "").strip()
        if not cnpj_clean.isdigit() or len(cnpj_clean) != 14:
            return None, None, Response(
                {
                    "code": "validation_error",
                    "detail": "CNPJ invalido. Informe 14 digitos numericos.",
                    "fields": {"cnpj": ["Formato esperado: 14 digitos."]},
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            ano = int(ano_raw)
        except (TypeError, ValueError):
            return None, None, Response(
                {
                    "code": "validation_error",
                    "detail": "Ano invalido.",
                    "fields": {"ano": ["Informe um ano numerico."]},
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return cnpj_clean, ano, None

    def get(self, request):
        cnpj, ano, error = self._validate_input(
            request.query_params.get("cnpj", "00394452000103"),
            request.query_params.get("ano", "2026"),
        )
        if error:
            return error

        try:
            summary = PncpService.get_pca_summary(cnpj=cnpj, ano=ano, force_refresh=False)
            return Response(summary, status=status.HTTP_200_OK)
        except requests.RequestException:
            return Response(
                {
                    "code": "external_service_unavailable",
                    "detail": "Nao foi possivel consultar o servico PNCP no momento.",
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

    def post(self, request):
        cnpj, ano, error = self._validate_input(
            request.data.get("cnpj", "00394452000103"),
            request.data.get("ano", "2026"),
        )
        if error:
            return error

        try:
            summary = PncpService.get_pca_summary(cnpj=cnpj, ano=ano, force_refresh=True)
            return Response(summary, status=status.HTTP_200_OK)
        except requests.RequestException:
            return Response(
                {
                    "code": "external_service_unavailable",
                    "detail": "Nao foi possivel atualizar dados do PNCP no momento.",
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
