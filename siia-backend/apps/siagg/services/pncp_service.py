import logging
from datetime import datetime

import requests
from django.core.cache import cache


logger = logging.getLogger(__name__)

PNCP_API_BASE_URL = "https://pncp.gov.br/api/pca"
PNCP_TIMEOUT_SECONDS = 12
PNCP_CACHE_SECONDS = 3600


class PncpService:
    @staticmethod
    def _cache_key(cnpj: str, ano: int) -> str:
        return f"siagg:pncp:pca_summary:{cnpj}:{ano}"

    @staticmethod
    def _normalize_category(raw_name: str) -> str:
        if not raw_name:
            return "Outros"

        value = raw_name.lower().strip()
        mapping = {
            "material": "Material",
            "servico": "Servico",
            "serviço": "Servico",
            "obras": "Obras",
            "tic": "Solucoes de TIC",
            "tecnologia": "Solucoes de TIC",
            "consultoria": "Consultoria",
            "treinamento": "Treinamento",
            "equipamento": "Equipamentos",
        }

        for key, normalized in mapping.items():
            if key in value:
                return normalized

        return raw_name.strip().title()

    @staticmethod
    def _parse_payload(raw_payload):
        if isinstance(raw_payload, dict):
            return raw_payload.get("items", [])
        if isinstance(raw_payload, list):
            return raw_payload
        return []

    @classmethod
    def _build_summary(cls, cnpj: str, ano: int, raw_payload):
        items = cls._parse_payload(raw_payload)
        grouped = {}
        total_itens = 0
        valor_total = 0.0

        for item in items:
            categoria = cls._normalize_category(str(item.get("categoria") or ""))
            valor_item = float(item.get("valor_estimado") or 0)

            if categoria not in grouped:
                grouped[categoria] = {"name": categoria, "value": 0.0, "quantity": 0}

            grouped[categoria]["value"] += valor_item
            grouped[categoria]["quantity"] += 1
            total_itens += 1
            valor_total += valor_item

        categorias = list(grouped.values())
        categorias.sort(key=lambda c: c["value"], reverse=True)

        return {
            "ano": ano,
            "cnpj": cnpj,
            "total_itens": total_itens,
            "valor_total": valor_total,
            "quantidade_categorias": len(categorias),
            "categorias": categorias,
            "atualizado_em": datetime.utcnow().isoformat() + "Z",
            "fonte": "Portal Nacional de Contratacoes Publicas (PNCP)",
        }

    @classmethod
    def _fetch_raw(cls, cnpj: str, ano: int):
        url = f"{PNCP_API_BASE_URL}/{cnpj}/{ano}"
        response = requests.get(
            url,
            headers={"Accept": "application/json", "User-Agent": "SIIA2-SIAGG/1.0"},
            timeout=PNCP_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
        return response.json()

    @classmethod
    def get_pca_summary(cls, cnpj: str, ano: int, force_refresh: bool = False):
        cache_key = cls._cache_key(cnpj, ano)

        if not force_refresh:
            cached = cache.get(cache_key)
            if cached is not None:
                return cached

        raw_payload = cls._fetch_raw(cnpj, ano)
        summary = cls._build_summary(cnpj, ano, raw_payload)
        cache.set(cache_key, summary, PNCP_CACHE_SECONDS)
        return summary
