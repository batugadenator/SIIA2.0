# 📦 SIIA 2.0 - Resumo de Preparação para Deploy Portainer

## ✅ Arquivos Modificados/Criados

### 1. **Caddyfile.siagg.siia** (Modificado)
**O que mudou**: Substituído roteamento SIAGG pelo SIIA2.0
- ❌ Removido: `/siagg/*` → `siagg-frontend:80`
- ❌ Removido: `/siagg-backend/*` → `siagg-backend:8000`
- ✅ Adicionado: `/siia-*/*` → `siia-backend:8000` (API, admin, static, media)
- ✅ Adicionado: `/` (raiz) → `siia-frontend:80` (React frontend)
- ✅ Mantido: `/api/*`, `/admin/*`, `/static/*` → `reabilita-backend:8000` (compatibilidade)
- ✅ Mantido: `/portainer/*` → `portainer:9000`

**Como usar**: Copie este arquivo para o Caddyfile principal do seu servidor ou importe-o.

---

### 2. **.env.local.example** (Novo)
**Propósito**: Template de variáveis de ambiente para configuração local

**Variáveis essenciais**:
```ini
SIIA_HOST=192.168.3.60              # IP/domínio do servidor
DEBUG=False                           # Desabilitar debug em produção
SECRET_KEY=<gerar-chave>             # Chave Django segura
SIIA_ENV=prod                        # Ambiente: prod ou dev

POSTGRES_HOST=<seu-postgres>         # Host do banco PostgreSQL
POSTGRES_USER=siia                   # Usuário do banco
POSTGRES_PASSWORD=<sua-senha>        # Senha do banco
POSTGRES_DB=siia                     # Nome do database

USE_LDAP_AUTH=false                  # Autenticação LDAP (opcional)
```

**Como usar**:
```bash
# 1. Copiar template
cp .env.local.example .env.local

# 2. Editar com credenciais reais
nano .env.local

# 3. Usar no docker-compose
docker-compose --env-file .env.local up -d

# OU no Portainer: adicionar variáveis diretamente na UI
```

**Segurança**: `.env.local` já está em `.gitignore` (não será commitado)

---

### 3. **docker-compose.yml** (Modificado)
**O que mudou**: Otimizado para Portainer (remover Caddy embutido, adicionar health checks)

#### Mudanças principais:

**Removido**:
- ❌ Serviço `siia-caddy` (Caddy é gerenciado separadamente)
- ❌ Volumes Caddy (`caddy_data`, `caddy_config`)
- ❌ Ports (80:80, 443:443) — Caddy gerencia isso

**Adicionado**:
- ✅ Health checks para `siia-backend` (testa `/admin/login/`)
- ✅ Health checks para `siia-frontend` (testa raiz `/`)
- ✅ Commentários descritivos por serviço
- ✅ Variáveis de ambiente melhor organizadas
- ✅ Rede named `siia_net` (facilita comunicação com Caddy)
- ✅ Volumes persistentes `siia_media` e `siia_static`

**Estrutura de serviços**:
```
siia-backend:8000 (Django)
  ├─ Porta: 8000 (interna, Caddy roteia)
  ├─ Health check: /admin/login/
  ├─ Volumes: /app/media, /app/staticfiles
  └─ Rede: siia_net

siia-frontend:80 (React)
  ├─ Porta: 80 (interna, Caddy roteia)
  ├─ Health check: GET / (HTTP 200)
  ├─ Depends on: siia-backend (healthy)
  └─ Rede: siia_net
```

---

### 4. **DEPLOYMENT_PORTAINER.md** (Novo)
**Propósito**: Guia passo-a-passo completo para deploy no Portainer

**Conteúdo**:
- ✅ Pré-requisitos (Portainer, Caddy, PostgreSQL)
- ✅ Configurar variáveis de ambiente (Opção A: .env.local | Opção B: Portainer UI)
- ✅ Criar stack no Portainer (Git ou Web Editor)
- ✅ Integrar com Caddy existente
- ✅ Validação pós-deploy (health checks, endpoints)
- ✅ Troubleshooting (DNS, migrations, CORS, volumes)
- ✅ Auto-deploy via GitHub (webhook)
- ✅ Checklist de segurança

---

## 🏗️ Arquitetura Resultante

```
┌─────────────────────────────────────────────────────────────────┐
│                          Caddy (Proxy Reverso)                   │
│                    http://192.168.3.60                            │
│                                                                   │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐   │
│  │ /            │ /siia-api/*  │ /siia-admin/*│ /siia-static*│   │
│  │ /siia-media/*│ /api/*       │ /admin/*     │ /static/*    │   │
│  │ /portainer/* │              │              │              │   │
│  └──────┬───────┴──────┬───────┴──────┬───────┴──────┬───────┘   │
│         │              │              │              │           │
│    ┌────▼────┐   ┌─────▼─────┐  ┌────▼────┐   ┌───▼─────┐      │
│    │ siia-   │   │ siia-     │  │reabilita│   │portainer│      │
│    │frontend │   │backend    │  │-backend │   │:9000    │      │
│    │:80      │   │:8000      │  │:8000    │   │         │      │
│    │(React)  │   │(Django)   │  │(Django) │   │(Manager)│      │
│    └─────────┘   └───────────┘  └─────────┘   └─────────┘      │
└─────────────────────────────────────────────────────────────────┘
         ▲              ▲              ▲
         │              │              │
         └──────┬───────┴──────┬───────┘
                │              │
         ┌──────▼──────┐  ┌───▼──────┐
         │PostgreSQL   │  │LDAP      │
         │(externo)    │  │(opcional)│
         └─────────────┘  └──────────┘
```

---

## 📋 Checklist de Implementação

- [x] Arquivo Caddyfile atualizado (SIAGG → SIIA2.0)
- [x] .env.local.example com todas as variáveis necessárias
- [x] docker-compose.yml otimizado para Portainer
- [x] DEPLOYMENT_PORTAINER.md com guia completo
- [x] Health checks configurados
- [x] Validação YAML OK ✅

---

## 🚀 Próximos Passos (Para Você)

1. **Edite `.env.local`** com suas credenciais reais
   ```bash
   cp .env.local.example .env.local
   nano .env.local
   ```

2. **Teste localmente** (opcional, antes de Portainer)
   ```bash
   docker-compose --env-file .env.local up -d
   docker logs -f siia-backend
   ```

3. **Crie a stack no Portainer**:
   - Acesse http://192.168.3.60:9000
   - Stacks → Add Stack → Selecione este repositório
   - Configure variáveis de ambiente
   - Deploy

4. **Configure o Caddyfile**:
   - Copie `Caddyfile.siagg.siia` para o Caddy principal
   - Ou importe com `@import` (se suportado)
   - Reload do Caddy

5. **Valide tudo** conforme DEPLOYMENT_PORTAINER.md

---

## ⚠️ Observações Importantes

### Compatibilidade com Reabilita
✅ **Reabilita mantém rotas originais**:
- `/api/*` → `reabilita-backend:8000`
- `/admin/*` → `reabilita-backend:8000`
- `/static/*` → `reabilita-backend:8000`
- `/` (fallback) → `siia-frontend:80` (novo padrão)

**Se quiser preservar Reabilita como raiz**:
- Mude SIIA2.0 para `/siia/*` e `/siia-api/*`
- Volte fallback para `reabilita-frontend:80`
- Descomente a integração SIAGG no seu Caddyfile atual

### Variáveis PostgreSQL
Certifique-se que:
- `POSTGRES_HOST` é resolvível dentro de Docker (use IP interno ou hostname da rede)
- Banco `siia` existe e foi migrado do SIAGG
- Usuário `siia` tem permissões corretas
- `POSTGRES_SEARCH_PATH` inclui schemas necessários

### LDAP
- Se não usa LDAP: deixe `USE_LDAP_AUTH=false`
- Se usa: configure credenciais LDAP (não incluídas neste template)

### SECRET_KEY
Gere uma chave segura com:
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

---

## 📚 Documentação Adicional

- **DEPLOYMENT_PORTAINER.md**: Guia completo de deploy
- **README.md** (original): Documentação geral do SIIA2.0
- **docker-compose.yml**: Orquestração de containers
- **.env.local.example**: Template de variáveis

---

**Status**: ✅ Pronto para deploy em Portainer + Caddy
**Data**: 2026-04-28
**Versão**: SIIA 2.0
