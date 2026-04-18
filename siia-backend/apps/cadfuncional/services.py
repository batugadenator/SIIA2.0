from datetime import date
import logging
import re

from django.utils import timezone
from django.db import DatabaseError, connection
from django.db.models import Count
from django.db.models.functions import TruncMonth
from django.contrib.auth import get_user_model
from django.utils.dateparse import parse_date

from .models import (
    CadfuncionalAtendimentoClinico,
    CadfuncionalAtendimentoSaude,
    CadfuncionalAvaliacaoFisioterapiaSRED,
    CadfuncionalEvolucaoMultidisciplinar,
    CadfuncionalLDAPConfig,
    CadfuncionalUsuarioPerfil,
)

User = get_user_model()


DEFAULT_PERFIS = [
    "Medico",
    "Fisioterapeuta",
    "PEF",
    "Nutricionista",
    "Psicopedagogo",
]

logger = logging.getLogger(__name__)

LEGACY_MODULE_SYSTEM_CODES = {
    "cms": 26,
    "cadfuncional": 27,
}


def _build_missing_access_payload(module: str, cod_sist: int | None, reason: str):
    return {
        "module": module,
        "cod_sist": cod_sist,
        "allowed": False,
        "cod_pessoa": None,
        "cod_ni": None,
        "nivel": None,
        "reason": reason,
    }


def _resolve_module_cod_sist(module: str):
    return LEGACY_MODULE_SYSTEM_CODES.get((module or "").strip().lower())


def build_legacy_module_access_payload(user, module: str):
    cod_sist = _resolve_module_cod_sist(module)
    if not cod_sist:
        return _build_missing_access_payload(module, None, "module_not_mapped")

    if not user or not user.is_authenticated:
        return _build_missing_access_payload(module, cod_sist, "unauthenticated")

    query = """
    SELECT
        uv.cod_pessoa,
        ct.cod_ni,
        ni.nivel
    FROM principal.usuario_pessoa_vinculo uv
    LEFT JOIN principal.ct_aces_sist_perif ct
      ON ct.cod_pessoa = uv.cod_pessoa
     AND ct.cod_sist = %s
    LEFT JOIN principal.ni_aces_sist_perif ni
      ON ni.cod_sist = ct.cod_sist
     AND ni.cod_ni = ct.cod_ni
    WHERE uv.usuario_id = %s
      AND uv.ativo = TRUE
    LIMIT 1
    """

    try:
        with connection.cursor() as cursor:
            cursor.execute(query, [cod_sist, user.id])
            row = cursor.fetchone()
    except DatabaseError:
        logger.exception("Falha ao consultar autorizacao legada para modulo %s", module)
        return _build_missing_access_payload(module, cod_sist, "authorization_source_unavailable")

    if not row:
        return _build_missing_access_payload(module, cod_sist, "user_not_linked_to_cod_pessoa")

    cod_pessoa, cod_ni, nivel = row
    if cod_ni is None:
        return {
            "module": module,
            "cod_sist": cod_sist,
            "allowed": False,
            "cod_pessoa": cod_pessoa,
            "cod_ni": None,
            "nivel": None,
            "reason": "missing_access_grant",
        }

    return {
        "module": module,
        "cod_sist": cod_sist,
        "allowed": True,
        "cod_pessoa": cod_pessoa,
        "cod_ni": cod_ni,
        "nivel": nivel,
        "reason": "ok",
    }


def build_legacy_access_snapshot_payload(user):
    return {
        "cadfuncional": build_legacy_module_access_payload(user, "cadfuncional"),
        "cms": build_legacy_module_access_payload(user, "cms"),
    }


def _month_window_6(base_date: date):
    months = []
    for i in range(5, -1, -1):
        month = base_date.month - i
        year = base_date.year
        while month <= 0:
            month += 12
            year -= 1
        months.append((year, month))
    return months


def build_painel_clinico_payload(base_date: date | None = None):
    today = base_date or date.today()
    qs = CadfuncionalAtendimentoClinico.objects.all()

    total_atendimentos = qs.count()
    total_cadetes = qs.values("cadete").distinct().count()

    homens = qs.filter(sexo__iregex=r"^(m|masculino)$").count()
    mulheres = qs.filter(sexo__iregex=r"^(f|feminino)$").count()

    por_data = qs.filter(data_atendimento=today).count()
    retornos = qs.filter(tipo__iexact="retorno").count()

    grouped_month = (
        qs.annotate(month=TruncMonth("data_atendimento"))
        .values("month")
        .annotate(total=Count("id"))
        .order_by("month")
    )

    month_map = {
        (item["month"].year, item["month"].month): item["total"]
        for item in grouped_month
        if item["month"] is not None
    }

    months_window = _month_window_6(today)
    atendimentos_ultimos_6_meses = [
        {"mes": f"{month:02d}/{year}", "total": int(month_map.get((year, month), 0))}
        for (year, month) in months_window
    ]

    perfil_grouped = (
        qs.exclude(perfil_encaminhamento="")
        .values("perfil_encaminhamento")
        .annotate(total=Count("id"))
        .order_by("-total", "perfil_encaminhamento")
    )

    perfil_map = {item["perfil_encaminhamento"]: item["total"] for item in perfil_grouped}
    for perfil in DEFAULT_PERFIS:
        perfil_map.setdefault(perfil, 0)

    encaminhamentos = []
    for perfil, total in sorted(perfil_map.items(), key=lambda x: (-x[1], x[0])):
        percentual = (total / total_atendimentos * 100) if total_atendimentos else 0
        encaminhamentos.append(
            {
                "perfil": perfil,
                "percentual": round(float(percentual), 2),
                "total": int(total),
            }
        )

    ultimos = list(
        qs.order_by("-data_atendimento", "-id")
        .values("cadete", "data_atendimento", "tipo", "lesao", "conduta")[:10]
    )
    ultimos_atendimentos = [
        {
            "cadete": item["cadete"],
            "data": item["data_atendimento"].isoformat() if item["data_atendimento"] else "",
            "tipo": item["tipo"],
            "lesao": item["lesao"],
            "conduta": item["conduta"],
        }
        for item in ultimos
    ]

    analitico = list(
        qs.filter(tipo__iexact="inicial")
        .order_by("-data_atendimento", "-id")
        .values("data_atendimento", "curso", "sexo", "atividade")
    )
    atendimentos_iniciais_analitico = [
        {
            "ano": str(item["data_atendimento"].year) if item["data_atendimento"] else "",
            "curso": item["curso"],
            "sexo": item["sexo"],
            "atividade": item["atividade"],
        }
        for item in analitico
    ]

    return {
        "metricas": {
            "cadetes": int(total_cadetes),
            "atendimentos": int(total_atendimentos),
            "atendimentos_homens": int(homens),
            "atendimentos_mulheres": int(mulheres),
            "por_data": int(por_data),
            "retornos": int(retornos),
        },
        "atendimentos_ultimos_6_meses": atendimentos_ultimos_6_meses,
        "encaminhamentos_por_perfil": encaminhamentos,
        "ultimos_atendimentos": ultimos_atendimentos,
        "atendimentos_iniciais_analitico": atendimentos_iniciais_analitico,
    }


def build_atendimentos_referencias_payload():
    tipo_lesao_options = ["Ossea", "Articular", "Muscular", "Tendinosa", "Neurologica"]
    origem_lesao_options = ["Por Estresse", "Traumatica", "Outra", ""]
    classificacao_atividade_options = ["Militar", "Esportiva", "Academica"]
    tipo_atividade_options = ["Corrida", "Marcha", "Treinamento funcional", "Tiro"]
    tfm_taf_options = ["TFM", "TAF", "Nao se aplica"]
    modalidade_esportiva_options = ["Atletismo", "Natacao", "Futebol", "Volei"]
    conduta_terapeutica_options = ["Repouso", "Fisioterapia", "Retorno gradual", "Medicacao"]
    exames_complementares_options = ["Raio-X", "Ultrassom", "Ressonancia", "Exame laboratorial"]
    encaminhamentos_options = ["Fisioterapeuta", "PEF", "Nutricionista", "Psicopedagogo"]
    disposicao_options = ["Apto", "Apto com restricoes", "Inapto temporario"]
    segmentos_por_tipo_lesao = {
        "Ossea": ["Membro superior", "Membro inferior", "Coluna"],
        "Articular": ["Membro superior", "Membro inferior", "Coluna"],
        "Muscular": ["Membro superior", "Membro inferior", "Tronco"],
        "Tendinosa": ["Membro superior", "Membro inferior"],
        "Neurologica": ["Coluna", "Tronco"],
    }
    estruturas_por_tipo_segmento = {
        "Membro superior": {"Padrao": ["Ombro", "Cotovelo", "Punho"]},
        "Membro inferior": {"Padrao": ["Quadril", "Joelho", "Tornozelo"]},
        "Coluna": {"Padrao": ["Cervical", "Toracica", "Lombar"]},
        "Tronco": {"Padrao": ["Abdome", "Torax"]},
    }
    localizacoes_por_tipo_segmento = {
        "Membro superior": {"Padrao": ["Anterior", "Posterior", "Lateral"]},
        "Membro inferior": {"Padrao": ["Anterior", "Posterior", "Lateral"]},
        "Coluna": {"Padrao": ["Cervical", "Toracica", "Lombar"]},
        "Tronco": {"Padrao": ["Direita", "Esquerda", "Central"]},
    }
    lateralidade_por_estrutura = {
        "Ombro": "Bilateral",
        "Cotovelo": "Bilateral",
        "Punho": "Bilateral",
        "Quadril": "Bilateral",
        "Joelho": "Bilateral",
        "Tornozelo": "Bilateral",
        "Cervical": "Nao e o caso",
        "Toracica": "Nao e o caso",
        "Lombar": "Nao e o caso",
        "Abdome": "Nao e o caso",
        "Torax": "Nao e o caso",
    }

    return {
        "tipo_atendimento_options": ["Inicial", "Retorno"],
        "tipo_lesao_options": tipo_lesao_options,
        "origem_lesao_options": origem_lesao_options,
        "decisao_sred_options": ["Investigacao Pendente", "Em Investigacao", "S-RED Positivo", "S-RED Negativo"],
        "classificacao_atividade_options": classificacao_atividade_options,
        "tipo_atividade_options": tipo_atividade_options,
        "tfm_taf_options": tfm_taf_options,
        "modalidade_esportiva_options": modalidade_esportiva_options,
        "conduta_terapeutica_options": conduta_terapeutica_options,
        "exames_complementares_options": exames_complementares_options,
        "encaminhamentos_options": encaminhamentos_options,
        "disposicao_options": disposicao_options,
        "segmentos_por_tipo_lesao": segmentos_por_tipo_lesao,
        "estruturas_por_tipo_segmento": estruturas_por_tipo_segmento,
        "localizacoes_por_tipo_segmento": localizacoes_por_tipo_segmento,
        "lateralidade_por_estrutura": lateralidade_por_estrutura,
        # Legacy aliases to keep backward compatibility with the previous transitional payload.
        "tipos_lesao": tipo_lesao_options,
        "origens_lesao": origem_lesao_options,
        "segmentos": ["Membro superior", "Membro inferior", "Coluna", "Tronco"],
        "lateralidades": ["Direita", "Esquerda", "Bilateral", "Nao e o caso"],
        "atividades": tipo_atividade_options,
    }


def _get_or_create_ldap_config():
    config = CadfuncionalLDAPConfig.objects.order_by("id").first()
    if config:
        return config
    return CadfuncionalLDAPConfig.objects.create()


def build_ldap_config_payload():
    config = _get_or_create_ldap_config()
    return {
        "id": config.id,
        "enabled": config.enabled,
        "server_uri": config.server_uri,
        "bind_dn": config.bind_dn,
        "bind_password_configured": bool(config.bind_password),
        "user_search_base_dn": config.user_search_base_dn,
        "user_search_filter": config.user_search_filter,
        "start_tls": config.start_tls,
        "always_update_user": config.always_update_user,
        "mirror_groups": config.mirror_groups,
        "cache_timeout": config.cache_timeout,
        "attr_first_name": config.attr_first_name,
        "attr_last_name": config.attr_last_name,
        "attr_email": config.attr_email,
        "group_search_base_dn": config.group_search_base_dn,
        "group_search_filter": config.group_search_filter,
        "group_type": config.group_type,
        "posix_member_attr": config.posix_member_attr,
        "admin_group_dn": config.admin_group_dn,
        "updated_at": config.updated_at.isoformat() if config.updated_at else "",
        "updated_by_username": config.updated_by.username if config.updated_by else "",
    }


def update_ldap_config_payload(payload: dict, updated_by):
    config = _get_or_create_ldap_config()

    editable_fields = [
        "enabled",
        "server_uri",
        "bind_dn",
        "user_search_base_dn",
        "user_search_filter",
        "start_tls",
        "always_update_user",
        "mirror_groups",
        "cache_timeout",
        "attr_first_name",
        "attr_last_name",
        "attr_email",
        "group_search_base_dn",
        "group_search_filter",
        "group_type",
        "posix_member_attr",
        "admin_group_dn",
    ]

    for field in editable_fields:
        if field in payload:
            setattr(config, field, payload[field])

    if "bind_password" in payload and payload.get("bind_password"):
        config.bind_password = str(payload.get("bind_password") or "")

    config.updated_by = updated_by if updated_by and updated_by.is_authenticated else None
    config.save()
    return build_ldap_config_payload()


def _clean_cpf(value: str):
    return re.sub(r"\D", "", value or "")[:11]


def _full_name_parts(full_name: str):
    pieces = [piece for piece in (full_name or "").strip().split(" ") if piece]
    if not pieces:
        return "", ""
    if len(pieces) == 1:
        return pieces[0], ""
    return pieces[0], " ".join(pieces[1:])


def _build_system_user_detail_payload(profile: CadfuncionalUsuarioPerfil):
    user = profile.user
    return {
        "id": user.id,
        "username": user.username,
        "cpf": profile.cpf,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "perfil": profile.perfil,
        "especialidade_medica": profile.especialidade_medica,
        "funcao_instrutor": profile.funcao_instrutor,
        "posto_graduacao": profile.posto_graduacao,
        "nome_guerra": profile.nome_guerra,
        "setor": profile.setor,
        "fracao": profile.fracao,
        "is_active": user.is_active,
        "is_staff": user.is_staff,
    }


def _build_system_user_create_payload(profile: CadfuncionalUsuarioPerfil):
    user = profile.user
    return {
        "id": user.id,
        "username": user.username,
        "cpf": profile.cpf,
        "nome_completo": f"{user.first_name} {user.last_name}".strip() or user.username,
        "perfil": profile.perfil,
        "especialidade_medica": profile.especialidade_medica,
        "funcao_instrutor": profile.funcao_instrutor,
        "posto_graduacao": profile.posto_graduacao,
        "nome_guerra": profile.nome_guerra,
        "setor": profile.setor,
        "fracao": profile.fracao,
        "is_active": user.is_active,
        "is_staff": user.is_staff,
    }


def list_system_users_payload():
    profiles = CadfuncionalUsuarioPerfil.objects.select_related("user").order_by("user__first_name", "user__last_name", "user__username")
    return [_build_system_user_detail_payload(profile) for profile in profiles]


def create_system_user_payload(payload: dict):
    cpf = _clean_cpf(payload.get("cpf") or "")
    if len(cpf) != 11:
        raise ValueError("CPF invalido. Informe 11 digitos.")

    if CadfuncionalUsuarioPerfil.objects.filter(cpf=cpf).exists():
        raise ValueError("CPF ja cadastrado.")

    senha_inicial = payload.get("senha_inicial") or ""
    confirmar = payload.get("confirmar_senha_inicial") or ""
    if not senha_inicial:
        raise ValueError("Senha inicial e obrigatoria.")
    if senha_inicial != confirmar:
        raise ValueError("As senhas nao conferem.")

    nome_completo = (payload.get("nome_completo") or "").strip()
    if not nome_completo:
        raise ValueError("Nome completo e obrigatorio.")

    first_name, last_name = _full_name_parts(nome_completo)
    username = cpf

    if User.objects.filter(username=username).exists():
        raise ValueError("Ja existe usuario com este username.")

    perfil_nome = payload.get("perfil") or "Consultor"
    is_admin = perfil_nome == "Administrador"

    user = User.objects.create_user(
        username=username,
        password=senha_inicial,
        first_name=first_name,
        last_name=last_name,
        is_active=bool(payload.get("usuario_ativo", True)),
        is_staff=is_admin,
    )

    profile = CadfuncionalUsuarioPerfil.objects.create(
        user=user,
        cpf=cpf,
        perfil=perfil_nome,
        especialidade_medica=(payload.get("especialidade_medica") or "").strip(),
        funcao_instrutor=(payload.get("funcao_instrutor") or "").strip(),
        posto_graduacao=(payload.get("posto_graduacao") or "").strip(),
        nome_guerra=(payload.get("nome_guerra") or "").strip(),
        setor=(payload.get("setor") or "").strip(),
        fracao=(payload.get("fracao") or "").strip(),
    )
    return _build_system_user_create_payload(profile)


def get_system_user_profile_or_none(user_id: int):
    return CadfuncionalUsuarioPerfil.objects.select_related("user").filter(user_id=user_id).first()


def get_system_user_detail_payload(profile: CadfuncionalUsuarioPerfil):
    return _build_system_user_detail_payload(profile)


def update_system_user_payload(profile: CadfuncionalUsuarioPerfil, payload: dict):
    user = profile.user

    if "cpf" in payload:
        cpf = _clean_cpf(payload.get("cpf") or "")
        if len(cpf) != 11:
            raise ValueError("CPF invalido. Informe 11 digitos.")
        if CadfuncionalUsuarioPerfil.objects.exclude(pk=profile.pk).filter(cpf=cpf).exists():
            raise ValueError("CPF ja cadastrado.")
        profile.cpf = cpf

    if "perfil" in payload and payload.get("perfil"):
        profile.perfil = payload.get("perfil")

    if "especialidade_medica" in payload:
        profile.especialidade_medica = (payload.get("especialidade_medica") or "").strip()

    if "funcao_instrutor" in payload:
        profile.funcao_instrutor = (payload.get("funcao_instrutor") or "").strip()

    if "posto_graduacao" in payload:
        profile.posto_graduacao = (payload.get("posto_graduacao") or "").strip()

    if "nome_guerra" in payload:
        profile.nome_guerra = (payload.get("nome_guerra") or "").strip()

    if "setor" in payload:
        profile.setor = (payload.get("setor") or "").strip()

    if "fracao" in payload:
        profile.fracao = (payload.get("fracao") or "").strip()

    if "usuario_ativo" in payload:
        user.is_active = bool(payload.get("usuario_ativo"))

    user.is_staff = profile.perfil == "Administrador"

    profile.save()
    user.save(update_fields=["is_active", "is_staff"])
    return _build_system_user_detail_payload(profile)


def reset_system_user_password_payload(profile: CadfuncionalUsuarioPerfil):
    user = profile.user
    temporary_password = f"Temp#{user.id:06d}"
    user.set_password(temporary_password)
    user.save(update_fields=["password"])
    return {"detail": f"Senha temporaria redefinida para o usuario {user.username}."}


def change_password_payload(user, payload: dict):
    senha_atual = payload.get("senha_atual") or ""
    senha_nova = payload.get("senha_nova") or ""
    confirmar_senha_nova = payload.get("confirmar_senha_nova") or ""

    if not senha_atual or not senha_nova or not confirmar_senha_nova:
        raise ValueError("Campos senha_atual, senha_nova e confirmar_senha_nova sao obrigatorios.")

    if not user.check_password(senha_atual):
        raise ValueError("Senha atual invalida.")

    if senha_nova != confirmar_senha_nova:
        raise ValueError("As senhas novas nao conferem.")

    user.set_password(senha_nova)
    user.save(update_fields=["password"])
    return {"detail": "Senha alterada com sucesso."}


def request_password_reset_payload(payload: dict):
    cpf = _clean_cpf(payload.get("cpf") or "")
    if len(cpf) != 11:
        raise ValueError("CPF invalido. Informe 11 digitos.")

    profile = CadfuncionalUsuarioPerfil.objects.select_related("user").filter(cpf=cpf).first()
    if not profile:
        return {"detail": "Se o CPF estiver cadastrado, o reset de senha foi solicitado."}

    user = profile.user
    temporary_password = f"Rec#{user.id:06d}"
    user.set_password(temporary_password)
    user.save(update_fields=["password"])
    return {"detail": "Se o CPF estiver cadastrado, o reset de senha foi solicitado."}


def _serialize_atendimento(item: CadfuncionalAtendimentoSaude):
    return {
        "id": item.id,
        "data_registro": item.data_registro.isoformat() if item.data_registro else "",
        "cadete_id": item.cadete_id,
        "cadete_nr_militar": item.cadete_nr_militar,
        "cadete_nome_guerra": item.cadete_nome_guerra,
        "medico_id": item.medico_id,
        "atendimento_origem_id": item.atendimento_origem_id,
        "tipo_atendimento": item.tipo_atendimento,
        "tipo_lesao": item.tipo_lesao,
        "origem_lesao": item.origem_lesao,
        "segmento_corporal": item.segmento_corporal,
        "estrutura_anatomica": item.estrutura_anatomica,
        "localizacao_lesao": item.localizacao_lesao,
        "lateralidade": item.lateralidade,
        "classificacao_atividade": item.classificacao_atividade,
        "tipo_atividade": item.tipo_atividade,
        "tfm_taf": item.tfm_taf,
        "modalidade_esportiva": item.modalidade_esportiva,
        "conduta_terapeutica": item.conduta_terapeutica,
        "decisao_sred": item.decisao_sred,
        "estado_fluxo": item.estado_fluxo,
        "prontidao_instrutor": item.prontidao_instrutor,
        "medicamentoso": item.medicamentoso,
        "solicitar_exames_complementares": item.solicitar_exames_complementares,
        "exames_complementares": item.exames_complementares,
        "encaminhamentos_multidisciplinares": item.encaminhamentos_multidisciplinares,
        "disposicao_cadete": item.disposicao_cadete,
        "notas_clinicas": item.notas_clinicas,
        "flag_sred": item.flag_sred,
    }


def list_saude_atendimentos_payload():
    return [_serialize_atendimento(item) for item in CadfuncionalAtendimentoSaude.objects.all()]


def create_saude_atendimento_payload(payload: dict):
    required = [
        "cadete_id",
        "medico_id",
        "tipo_atendimento",
        "tipo_lesao",
        "origem_lesao",
        "segmento_corporal",
        "estrutura_anatomica",
        "localizacao_lesao",
        "lateralidade",
    ]
    for field in required:
        if field not in payload:
            raise ValueError(f"Campo obrigatorio ausente: {field}")

    item = CadfuncionalAtendimentoSaude.objects.create(
        cadete_id=int(payload.get("cadete_id")),
        cadete_nr_militar=str(payload.get("cadete_nr_militar") or ""),
        cadete_nome_guerra=str(payload.get("cadete_nome_guerra") or ""),
        medico_id=int(payload.get("medico_id")),
        atendimento_origem_id=payload.get("atendimento_origem_id"),
        tipo_atendimento=str(payload.get("tipo_atendimento") or "Inicial"),
        tipo_lesao=str(payload.get("tipo_lesao") or "Muscular"),
        origem_lesao=str(payload.get("origem_lesao") or ""),
        segmento_corporal=str(payload.get("segmento_corporal") or ""),
        estrutura_anatomica=str(payload.get("estrutura_anatomica") or ""),
        localizacao_lesao=str(payload.get("localizacao_lesao") or ""),
        lateralidade=str(payload.get("lateralidade") or "Nao e o caso"),
        classificacao_atividade=str(payload.get("classificacao_atividade") or ""),
        tipo_atividade=str(payload.get("tipo_atividade") or ""),
        tfm_taf=str(payload.get("tfm_taf") or ""),
        modalidade_esportiva=str(payload.get("modalidade_esportiva") or ""),
        conduta_terapeutica=str(payload.get("conduta_terapeutica") or ""),
        decisao_sred=str(payload.get("decisao_sred") or ""),
        estado_fluxo=str(payload.get("estado_fluxo") or "INICIAL"),
        prontidao_instrutor=str(payload.get("prontidao_instrutor") or "Em Avaliacao"),
        medicamentoso=bool(payload.get("medicamentoso", False)),
        solicitar_exames_complementares=bool(payload.get("solicitar_exames_complementares", False)),
        exames_complementares=list(payload.get("exames_complementares") or []),
        encaminhamentos_multidisciplinares=list(payload.get("encaminhamentos_multidisciplinares") or []),
        disposicao_cadete=list(payload.get("disposicao_cadete") or []),
        notas_clinicas=str(payload.get("notas_clinicas") or ""),
        flag_sred=bool(payload.get("flag_sred", False)),
    )

    # Keep painel clinico aggregates coherent with new atendimentos records.
    CadfuncionalAtendimentoClinico.objects.create(
        cadete=item.cadete_nome_guerra or f"Cadete {item.cadete_id}",
        data_atendimento=item.data_registro,
        tipo="retorno" if str(item.tipo_atendimento).lower() == "retorno" else "inicial",
        perfil_encaminhamento=(item.encaminhamentos_multidisciplinares[0] if item.encaminhamentos_multidisciplinares else ""),
        lesao=item.tipo_lesao,
        conduta=item.conduta_terapeutica,
        curso="",
        atividade=item.tipo_atividade,
    )

    return _serialize_atendimento(item)


def _serialize_evolucao(item: CadfuncionalEvolucaoMultidisciplinar):
    return {
        "id": item.id,
        "atendimento_id": item.atendimento_id,
        "profissional_id": item.profissional_id,
        "parecer_tecnico": item.parecer_tecnico,
        "data_evolucao": item.data_evolucao.isoformat() if item.data_evolucao else "",
    }


def list_saude_evolucoes_payload(atendimento_id: int | None = None):
    qs = CadfuncionalEvolucaoMultidisciplinar.objects.all()
    if atendimento_id is not None:
        qs = qs.filter(atendimento_id=atendimento_id)
    return [_serialize_evolucao(item) for item in qs]


def create_saude_evolucao_payload(payload: dict):
    required = ["atendimento_id", "profissional_id", "parecer_tecnico", "data_evolucao"]
    for field in required:
        if field not in payload:
            raise ValueError(f"Campo obrigatorio ausente: {field}")

    atendimento_id = int(payload.get("atendimento_id"))
    atendimento = CadfuncionalAtendimentoSaude.objects.filter(id=atendimento_id).first()
    if not atendimento:
        raise ValueError("Atendimento informado nao encontrado.")

    data_evolucao_raw = payload.get("data_evolucao")
    data_evolucao = parse_date(str(data_evolucao_raw)) if data_evolucao_raw is not None else None
    if data_evolucao is None:
        raise ValueError("Campo data_evolucao invalido. Use formato YYYY-MM-DD.")

    item = CadfuncionalEvolucaoMultidisciplinar.objects.create(
        atendimento=atendimento,
        profissional_id=int(payload.get("profissional_id")),
        parecer_tecnico=str(payload.get("parecer_tecnico") or ""),
        data_evolucao=data_evolucao,
    )
    return _serialize_evolucao(item)


SRED_REATIVIDADE_OPTIONS = ["Baixa", "Moderada", "Alta"]
SRED_ETIOLOGIA_OPTIONS = ["Traumatica", "Degenerativa", "Sobrecarga (Overuse)", "Pos-operatoria", "Idiopatica"]


def _serialize_avaliacao_sred(item: CadfuncionalAvaliacaoFisioterapiaSRED):
    atendimento = item.atendimento
    return {
        "id": item.id,
        "atendimento_id": item.atendimento_id,
        "fisioterapeuta_id": item.fisioterapeuta_id,
        "fisioterapeuta_nome": f"Profissional {item.fisioterapeuta_id}",
        "cadete_nome": atendimento.cadete_nome_guerra or f"Cadete {atendimento.cadete_id}",
        "gravidade_eva": item.gravidade_eva,
        "limitacao_funcional": item.limitacao_funcional,
        "sinais_vermelhos": item.sinais_vermelhos,
        "reatividade": item.reatividade,
        "reatividade_options": SRED_REATIVIDADE_OPTIONS,
        "etiologia": item.etiologia,
        "etiologia_options": SRED_ETIOLOGIA_OPTIONS,
        "etiologia_complemento": item.etiologia_complemento,
        "diagnostico_clinico": item.diagnostico_clinico,
        "inspecao_palpacao": item.inspecao_palpacao,
        "adm_ativa_graus": item.adm_ativa_graus,
        "adm_passiva_graus": item.adm_passiva_graus,
        "teste_forca": item.teste_forca,
        "testes_especificos": item.testes_especificos,
        "objetivos_tratamento": item.objetivos_tratamento,
        "plano_tratamento": item.plano_tratamento,
        "liberado_para_pef": item.liberado_para_pef,
        "liberado_para_pef_em": item.liberado_para_pef_em.isoformat() if item.liberado_para_pef_em else None,
        "liberado_para_pef_por": item.liberado_para_pef_por,
        "liberado_para_pef_por_username": item.liberado_para_pef_por_username,
        "observacoes_liberacao_pef": item.observacoes_liberacao_pef,
        "data_avaliacao": item.data_avaliacao.isoformat() if item.data_avaliacao else "",
        "atualizado_em": item.atualizado_em.isoformat() if item.atualizado_em else "",
    }


def list_saude_avaliacoes_sred_payload(atendimento_id: int | None = None):
    qs = CadfuncionalAvaliacaoFisioterapiaSRED.objects.select_related("atendimento").all()
    if atendimento_id is not None:
        qs = qs.filter(atendimento_id=atendimento_id)
    return [_serialize_avaliacao_sred(item) for item in qs]


def create_saude_avaliacao_sred_payload(payload: dict):
    required = ["atendimento_id", "fisioterapeuta_id", "gravidade_eva", "reatividade", "etiologia", "diagnostico_clinico"]
    for field in required:
        if field not in payload:
            raise ValueError(f"Campo obrigatorio ausente: {field}")

    atendimento_id = int(payload.get("atendimento_id"))
    atendimento = CadfuncionalAtendimentoSaude.objects.filter(id=atendimento_id).first()
    if not atendimento:
        raise ValueError("Atendimento informado nao encontrado.")

    reatividade = str(payload.get("reatividade") or "")
    etiologia = str(payload.get("etiologia") or "")
    if reatividade not in SRED_REATIVIDADE_OPTIONS:
        raise ValueError("Reatividade invalida.")
    if etiologia not in SRED_ETIOLOGIA_OPTIONS:
        raise ValueError("Etiologia invalida.")

    data_avaliacao_raw = payload.get("data_avaliacao")
    data_avaliacao = parse_date(str(data_avaliacao_raw)) if data_avaliacao_raw is not None else date.today()
    if data_avaliacao is None:
        raise ValueError("Campo data_avaliacao invalido. Use formato YYYY-MM-DD.")

    item = CadfuncionalAvaliacaoFisioterapiaSRED.objects.create(
        atendimento=atendimento,
        fisioterapeuta_id=int(payload.get("fisioterapeuta_id")),
        gravidade_eva=int(payload.get("gravidade_eva")),
        limitacao_funcional=str(payload.get("limitacao_funcional") or ""),
        sinais_vermelhos=str(payload.get("sinais_vermelhos") or ""),
        reatividade=reatividade,
        etiologia=etiologia,
        etiologia_complemento=str(payload.get("etiologia_complemento") or ""),
        diagnostico_clinico=str(payload.get("diagnostico_clinico") or ""),
        inspecao_palpacao=str(payload.get("inspecao_palpacao") or ""),
        adm_ativa_graus=str(payload.get("adm_ativa_graus") or ""),
        adm_passiva_graus=str(payload.get("adm_passiva_graus") or ""),
        teste_forca=str(payload.get("teste_forca") or ""),
        testes_especificos=str(payload.get("testes_especificos") or ""),
        objetivos_tratamento=str(payload.get("objetivos_tratamento") or ""),
        plano_tratamento=str(payload.get("plano_tratamento") or ""),
        liberado_para_pef=bool(payload.get("liberado_para_pef", False)),
        observacoes_liberacao_pef=str(payload.get("observacoes_liberacao_pef") or ""),
        data_avaliacao=data_avaliacao,
    )

    if item.liberado_para_pef:
        item.liberado_para_pef_em = timezone.now()
        item.save(update_fields=["liberado_para_pef_em"])

    return _serialize_avaliacao_sred(item)


def get_saude_avaliacao_sred_or_none(avaliacao_id: int):
    return CadfuncionalAvaliacaoFisioterapiaSRED.objects.select_related("atendimento").filter(id=avaliacao_id).first()


def update_saude_avaliacao_sred_payload(item: CadfuncionalAvaliacaoFisioterapiaSRED, payload: dict, acting_user=None):
    if "gravidade_eva" in payload:
        item.gravidade_eva = int(payload.get("gravidade_eva"))

    text_fields = [
        "limitacao_funcional",
        "sinais_vermelhos",
        "etiologia_complemento",
        "diagnostico_clinico",
        "inspecao_palpacao",
        "adm_ativa_graus",
        "adm_passiva_graus",
        "teste_forca",
        "testes_especificos",
        "objetivos_tratamento",
        "plano_tratamento",
        "observacoes_liberacao_pef",
    ]
    for field in text_fields:
        if field in payload:
            setattr(item, field, str(payload.get(field) or ""))

    if "reatividade" in payload:
        value = str(payload.get("reatividade") or "")
        if value not in SRED_REATIVIDADE_OPTIONS:
            raise ValueError("Reatividade invalida.")
        item.reatividade = value

    if "etiologia" in payload:
        value = str(payload.get("etiologia") or "")
        if value not in SRED_ETIOLOGIA_OPTIONS:
            raise ValueError("Etiologia invalida.")
        item.etiologia = value

    if "data_avaliacao" in payload:
        value = parse_date(str(payload.get("data_avaliacao")))
        if value is None:
            raise ValueError("Campo data_avaliacao invalido. Use formato YYYY-MM-DD.")
        item.data_avaliacao = value

    if "liberado_para_pef" in payload:
        liberado_para_pef = bool(payload.get("liberado_para_pef"))
        if liberado_para_pef and not item.liberado_para_pef:
            item.liberado_para_pef_em = timezone.now()
            if acting_user and getattr(acting_user, "is_authenticated", False):
                item.liberado_para_pef_por = acting_user.id
                item.liberado_para_pef_por_username = acting_user.username
        if not liberado_para_pef:
            item.liberado_para_pef_em = None
            item.liberado_para_pef_por = None
            item.liberado_para_pef_por_username = ""
        item.liberado_para_pef = liberado_para_pef

    item.save()
    return _serialize_avaliacao_sred(item)

