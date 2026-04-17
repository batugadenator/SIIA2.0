from django.core.management.base import BaseCommand

from apps.siagg.models import SiaggArea


AREAS_PADRAO = [
    {
        "slug": "planejamento-estrategico",
        "nome": "Planejamento Estrategico",
        "descricao": "Planejamento e acompanhamento de metas institucionais.",
    },
    {
        "slug": "escritorio-processos",
        "nome": "Escritorio de Processos",
        "descricao": "Mapeamento e otimizacao de fluxos de trabalho.",
    },
    {
        "slug": "escritorio-projetos",
        "nome": "Escritorio de Projetos",
        "descricao": "Gestao de portfolio e execucao de projetos.",
    },
    {
        "slug": "risco-controle-integridade",
        "nome": "Risco, Controle Interno e Integridade",
        "descricao": "Gestao integrada de riscos, controle interno e integridade institucional.",
    },
    {
        "slug": "conhecimento-inovacao",
        "nome": "Conhecimento e Inovacao",
        "descricao": "Capital intelectual, melhoria continua e iniciativas de inovacao.",
    },
    {
        "slug": "orcamento-financas",
        "nome": "Orcamento e Financas",
        "descricao": "Planejamento, execucao e controle de recursos orcamentarios e financeiros.",
    },
    {
        "slug": "gestao-ambiental",
        "nome": "Gestao Ambiental",
        "descricao": "Sustentabilidade e conformidade com normas ambientais.",
    },
    {
        "slug": "tic",
        "nome": "Tecnologia da Informacao e Comunicacoes",
        "descricao": "Governanca e suporte de TIC alinhados aos objetivos institucionais.",
    },
]


class Command(BaseCommand):
    help = "Carrega as areas padrao do SIAGG no schema siagg"

    def handle(self, *args, **options):
        created = 0
        updated = 0

        for area in AREAS_PADRAO:
            _, was_created = SiaggArea.objects.update_or_create(
                slug=area["slug"],
                defaults={
                    "nome": area["nome"],
                    "descricao": area["descricao"],
                    "ativo": True,
                },
            )
            if was_created:
                created += 1
            else:
                updated += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Seed SIAGG finalizado: {created} criadas, {updated} atualizadas."
            )
        )
