from django.conf import settings
from ldap3 import Connection, Server


def ldap_bind_authenticate(username: str, password: str) -> tuple[bool, str]:
    if not username or not password:
        return False, "Usuario e senha sao obrigatorios."

    if not settings.LDAP_SERVER_URI:
        return False, "LDAP_SERVER_URI nao configurado no ambiente."

    if not settings.LDAP_BIND_DN_TEMPLATE:
        return False, "LDAP_BIND_DN_TEMPLATE nao configurado no ambiente."

    user_dn = settings.LDAP_BIND_DN_TEMPLATE.format(username=username)

    try:
        server = Server(settings.LDAP_SERVER_URI, use_ssl=settings.LDAP_USE_SSL)
        connection = Connection(server, user=user_dn, password=password, auto_bind=True)
        connection.unbind()
        return True, "Autenticado com sucesso."
    except Exception:
        return False, "Falha na autenticacao LDAP."
