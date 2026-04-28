# 🚀 SIIA 2.0 - Quick Start (5 minutos)

## TL;DR - Passos Rápidos

### 1️⃣ Preparar Configuração (1 min)

```bash
cd /seu/path/SIIA2.0

# Copiar template de ambiente
cp .env.local.example .env.local

# Editar com suas credenciais
# IMPORTANTE: Altere estas 4 variáveis:
# - SIIA_HOST: seu IP (ex: 192.168.3.60)
# - POSTGRES_HOST: IP do seu PostgreSQL
# - POSTGRES_PASSWORD: senha do banco
# - SECRET_KEY: gerar com: python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"

nano .env.local  # ou seu editor favorito
```

### 2️⃣ Testar Localmente (2 min) - OPCIONAL

```powershell
# Windows PowerShell
.\deploy-local.ps1 -Action setup
.\deploy-local.ps1 -Action start
.\deploy-local.ps1 -Action validate

# Aguarde ~60s para migrations completarem
docker logs -f siia-backend
```

Acessar:
- Frontend: http://localhost/
- Backend: http://localhost:8000/admin/

### 3️⃣ Deploy no Portainer (2 min)

1. **Acesse Portainer**: http://192.168.3.60:9000

2. **Stacks → Add Stack**

3. **Configure**:
   - Nome: `siia2.0`
   - Repository: `https://github.com/seu-repo/SIIA2.0.git`
   - Branch: `main`
   - Compose path: `docker-compose.yml`

4. **Variables** (adicionar no Portainer):
   ```
   SIIA_HOST=192.168.3.60
   DEBUG=False
   SECRET_KEY=<sua-chave>
   POSTGRES_HOST=<seu-postgres>
   POSTGRES_PASSWORD=<sua-senha>
   SIIA_ENV=prod
   ```

5. **Deploy!**

### 4️⃣ Configurar Caddy (1 min)

Edite seu Caddyfile:

```caddy
http://192.168.3.60 {
    # ...seu config atual...
    
    # ── SIIA 2.0 ──────────────────────────────────────────────────
    handle /siia-api/* {
        reverse_proxy siia-backend:8000
    }
    
    handle /siia-admin/* {
        reverse_proxy siia-backend:8000
    }
    
    handle /siia-static/* {
        reverse_proxy siia-backend:8000
    }
    
    handle /siia-media/* {
        reverse_proxy siia-backend:8000
    }
    
    # Frontend SIIA 2.0 (raiz, se for aplicação principal)
    handle {
        reverse_proxy siia-frontend:80
    }
}
```

Reload Caddy:
```bash
docker exec <seu-caddy-container> caddy reload --config /etc/caddy/Caddyfile
```

---

## 🎯 Validação Rápida

```bash
# Containers UP?
docker-compose ps

# Backend respondendo?
curl -i http://192.168.3.60/siia-admin/

# Frontend respondendo?
curl -i http://192.168.3.60/

# Logs OK?
docker logs siia-backend | tail -20
docker logs siia-frontend | tail -20
```

✅ Se tudo retornar 200 OK, você está pronto!

---

## 📚 Documentação Completa

Para mais detalhes, consulte:

| Documento | Para quem? |
|-----------|-----------|
| **DEPLOYMENT_PORTAINER.md** | Passo-a-passo completo com troubleshooting |
| **CADDYFILE_INTEGRATION.md** | Integrar com Caddy existente |
| **TECHNICAL_CHECKLIST.md** | Validação técnica detalhada |
| **DEPLOYMENT_SUMMARY.md** | Resumo das mudanças e arquitetura |

---

## ⚙️ Variáveis Essenciais

| Variável | Valor Exemplo | Obrigatório |
|----------|--------------|-----------|
| `SIIA_HOST` | `192.168.3.60` | ✅ |
| `POSTGRES_HOST` | `10.10.10.60` ou `postgres.local` | ✅ |
| `POSTGRES_PASSWORD` | `sua-senha-real` | ✅ |
| `SECRET_KEY` | `abc123...xyz` (50+ chars) | ✅ |
| `DEBUG` | `False` (produção) | ⚠️ |
| `SIIA_ENV` | `prod` ou `dev` | ✅ |

---

## 🔥 Se Algo Der Errado

```bash
# Ver logs detalhados
docker logs -f siia-backend
docker logs -f siia-frontend

# Verificar conectividade PostgreSQL
docker exec siia-backend python manage.py dbshell

# Reiniciar containers
docker-compose down
docker-compose --env-file .env.local up -d

# Reset total (CUIDADO: perde dados!)
docker-compose down -v
docker-compose --env-file .env.local up -d
```

Consulte **TECHNICAL_CHECKLIST.md** para troubleshooting completo.

---

## ✨ Próximas Features

Após deploy base funcionar:

- [ ] Habilitar HTTPS (Let's Encrypt ou certificado auto-assinado)
- [ ] Configurar LDAP (se necessário)
- [ ] Integrar uploads Nextcloud
- [ ] Backup automático do PostgreSQL
- [ ] Monitoramento (Prometheus + Grafana)

---

**Status**: Pronto para ir ao ar! 🚀

Para suporte, consulte documentação ou logs detalhados.
