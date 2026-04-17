import os

import psycopg
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = "Garante permissões CREATEDB e existência do banco de testes PostgreSQL para execução automática de suíte."

    def handle(self, *args, **options):
        db = settings.DATABASES["default"]
        target_role = db.get("USER")
        test_db_name = (db.get("TEST") or {}).get("NAME") or f"test_{db.get('NAME')}"

        admin_user = os.getenv("POSTGRES_ADMIN_USER", "postgres")
        admin_password = os.getenv("POSTGRES_ADMIN_PASSWORD", "")
        admin_host = os.getenv("POSTGRES_ADMIN_HOST", db.get("HOST") or "localhost")
        admin_port = int(os.getenv("POSTGRES_ADMIN_PORT", str(db.get("PORT") or 5432)))
        admin_db = os.getenv("POSTGRES_ADMIN_DB", "postgres")

        if not target_role:
            raise CommandError("Usuário alvo do PostgreSQL não definido em DATABASES['default']['USER'].")

        try:
            conn = psycopg.connect(
                host=admin_host,
                port=admin_port,
                dbname=admin_db,
                user=admin_user,
                password=admin_password,
                autocommit=True,
            )
        except Exception as exc:  # noqa: BLE001
            raise CommandError(
                "Falha ao conectar como admin no PostgreSQL. "
                "Defina POSTGRES_ADMIN_USER/POSTGRES_ADMIN_PASSWORD corretos. "
                f"Detalhe: {exc}"
            ) from exc

        with conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1 FROM pg_roles WHERE rolname = %s", (target_role,))
                if cur.fetchone() is None:
                    raise CommandError(f"Role '{target_role}' não existe no PostgreSQL.")

                cur.execute(f'ALTER ROLE "{target_role}" CREATEDB')
                self.stdout.write(self.style.SUCCESS(f"Permissão CREATEDB garantida para role '{target_role}'."))

                cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", (test_db_name,))
                exists = cur.fetchone() is not None
                if not exists:
                    cur.execute(f'CREATE DATABASE "{test_db_name}" OWNER "{target_role}"')
                    self.stdout.write(self.style.SUCCESS(f"Banco de testes '{test_db_name}' criado."))
                else:
                    self.stdout.write(self.style.WARNING(f"Banco de testes '{test_db_name}' já existe."))

        self.stdout.write(self.style.SUCCESS("PostgreSQL de testes pronto para execução automática."))
