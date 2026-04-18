from django.db import models


class CadfuncionalRegistro(models.Model):
    nome = models.CharField(max_length=120)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "cadfuncional_registro"


class CadfuncionalAtendimentoClinico(models.Model):
    cadete = models.CharField(max_length=120)
    sexo = models.CharField(max_length=20, blank=True, default="")
    data_atendimento = models.DateField(db_index=True)
    tipo = models.CharField(max_length=20, default="inicial", db_index=True)
    perfil_encaminhamento = models.CharField(max_length=80, blank=True, default="")
    lesao = models.CharField(max_length=255, blank=True, default="")
    conduta = models.CharField(max_length=255, blank=True, default="")
    curso = models.CharField(max_length=40, blank=True, default="")
    atividade = models.CharField(max_length=120, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "cadfuncional_atendimento_clinico"


class CadfuncionalLDAPConfig(models.Model):
    enabled = models.BooleanField(default=False)
    server_uri = models.CharField(max_length=255, blank=True, default="")
    bind_dn = models.CharField(max_length=255, blank=True, default="")
    bind_password = models.CharField(max_length=255, blank=True, default="")
    user_search_base_dn = models.CharField(max_length=255, blank=True, default="")
    user_search_filter = models.CharField(max_length=255, default="(sAMAccountName=%(user)s)")
    start_tls = models.BooleanField(default=False)
    always_update_user = models.BooleanField(default=True)
    mirror_groups = models.BooleanField(default=False)
    cache_timeout = models.PositiveIntegerField(default=3600)
    attr_first_name = models.CharField(max_length=100, default="givenName")
    attr_last_name = models.CharField(max_length=100, default="sn")
    attr_email = models.CharField(max_length=100, default="mail")
    group_search_base_dn = models.CharField(max_length=255, blank=True, default="")
    group_search_filter = models.CharField(max_length=255, default="(objectClass=group)")
    group_type = models.CharField(max_length=50, default="GroupOfNamesType")
    posix_member_attr = models.CharField(max_length=100, default="memberUid")
    admin_group_dn = models.CharField(max_length=255, blank=True, default="")
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        "usuarios.Usuario",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="reabilita_ldap_configs_atualizadas",
    )

    class Meta:
        db_table = "cadfuncional_ldap_config"


class CadfuncionalUsuarioPerfil(models.Model):
    user = models.OneToOneField(
        "usuarios.Usuario",
        on_delete=models.CASCADE,
        related_name="reabilita_perfil",
    )
    cpf = models.CharField(max_length=11, unique=True)
    perfil = models.CharField(max_length=80, default="Consultor")
    especialidade_medica = models.CharField(max_length=80, blank=True, default="")
    funcao_instrutor = models.CharField(max_length=120, blank=True, default="")
    posto_graduacao = models.CharField(max_length=80, blank=True, default="")
    nome_guerra = models.CharField(max_length=120, blank=True, default="")
    setor = models.CharField(max_length=120, blank=True, default="")
    fracao = models.CharField(max_length=120, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "cadfuncional_usuario_perfil"


class CadfuncionalAtendimentoSaude(models.Model):
    data_registro = models.DateField(auto_now_add=True)
    cadete_id = models.PositiveIntegerField()
    cadete_nr_militar = models.CharField(max_length=40, blank=True, default="")
    cadete_nome_guerra = models.CharField(max_length=120, blank=True, default="")
    medico_id = models.PositiveIntegerField()
    atendimento_origem_id = models.PositiveIntegerField(null=True, blank=True)
    tipo_atendimento = models.CharField(max_length=30, default="Inicial")
    tipo_lesao = models.CharField(max_length=50, default="Muscular")
    origem_lesao = models.CharField(max_length=50, blank=True, default="")
    segmento_corporal = models.CharField(max_length=100)
    estrutura_anatomica = models.CharField(max_length=100)
    localizacao_lesao = models.CharField(max_length=100)
    lateralidade = models.CharField(max_length=30, default="Nao e o caso")
    classificacao_atividade = models.CharField(max_length=100, blank=True, default="")
    tipo_atividade = models.CharField(max_length=100, blank=True, default="")
    tfm_taf = models.CharField(max_length=100, blank=True, default="")
    modalidade_esportiva = models.CharField(max_length=100, blank=True, default="")
    conduta_terapeutica = models.CharField(max_length=150, blank=True, default="")
    decisao_sred = models.CharField(max_length=50, blank=True, default="")
    estado_fluxo = models.CharField(max_length=30, default="INICIAL")
    prontidao_instrutor = models.CharField(max_length=80, default="Em Avaliacao")
    medicamentoso = models.BooleanField(default=False)
    solicitar_exames_complementares = models.BooleanField(default=False)
    exames_complementares = models.JSONField(default=list, blank=True)
    encaminhamentos_multidisciplinares = models.JSONField(default=list, blank=True)
    disposicao_cadete = models.JSONField(default=list, blank=True)
    notas_clinicas = models.TextField(blank=True, default="")
    flag_sred = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "cadfuncional_atendimento_saude"
        ordering = ["-data_registro", "-id"]


class CadfuncionalEvolucaoMultidisciplinar(models.Model):
    atendimento = models.ForeignKey(
        CadfuncionalAtendimentoSaude,
        on_delete=models.CASCADE,
        related_name="evolucoes",
    )
    profissional_id = models.PositiveIntegerField()
    parecer_tecnico = models.TextField()
    data_evolucao = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "cadfuncional_evolucao_multidisciplinar"
        ordering = ["-data_evolucao", "-id"]


class CadfuncionalAvaliacaoFisioterapiaSRED(models.Model):
    atendimento = models.ForeignKey(
        CadfuncionalAtendimentoSaude,
        on_delete=models.CASCADE,
        related_name="avaliacoes_sred",
    )
    fisioterapeuta_id = models.PositiveIntegerField()
    gravidade_eva = models.PositiveSmallIntegerField()
    limitacao_funcional = models.TextField(blank=True, default="")
    sinais_vermelhos = models.TextField(blank=True, default="")
    reatividade = models.CharField(max_length=20)
    etiologia = models.CharField(max_length=40)
    etiologia_complemento = models.CharField(max_length=255, blank=True, default="")
    diagnostico_clinico = models.TextField()
    inspecao_palpacao = models.TextField(blank=True, default="")
    adm_ativa_graus = models.CharField(max_length=80, blank=True, default="")
    adm_passiva_graus = models.CharField(max_length=80, blank=True, default="")
    teste_forca = models.TextField(blank=True, default="")
    testes_especificos = models.TextField(blank=True, default="")
    objetivos_tratamento = models.TextField(blank=True, default="")
    plano_tratamento = models.TextField(blank=True, default="")
    liberado_para_pef = models.BooleanField(default=False)
    liberado_para_pef_em = models.DateTimeField(null=True, blank=True)
    liberado_para_pef_por = models.PositiveIntegerField(null=True, blank=True)
    liberado_para_pef_por_username = models.CharField(max_length=150, blank=True, default="")
    observacoes_liberacao_pef = models.TextField(blank=True, default="")
    data_avaliacao = models.DateField()
    atualizado_em = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "cadfuncional_avaliacao_fisioterapia_sred"
        ordering = ["-data_avaliacao", "-id"]

