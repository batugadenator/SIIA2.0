# 📦 SIIA 2.0 - Deploy em Portainer + Caddy

**Status**: ✅ **PRONTO PARA DEPLOY**

Todos os arquivos foram preparados para você subir o SIIA2.0 em seu servidor local com **Portainer** + **Caddy** proxy reverso, **substituindo o SIAGG**.

---

## 📋 O Que Mudou

### ✅ Arquivos Preparados (9 arquivos)

| Arquivo | Tipo | Status | Descrição |
|---------|------|--------|-----------|
| **Caddyfile.siagg.siia** | Config | ✅ Atualizado | Roteamento: SIAGG → SIIA2.0 |
| **.env.local.example** | Template | ✅ Novo | Variáveis de ambiente com comentários |
| **docker-compose.yml** | Orquestração | ✅ Otimizado | Health checks, sem Caddy embutido |
| **QUICKSTART.md** | 📖 Doc | ✅ Novo | 5 minutos para deploy (COMECE AQUI) |
| **DEPLOYMENT_PORTAINER.md** | 📖 Doc | ✅ Novo | Guia completo passo-a-passo |
| **TECHNICAL_CHECKLIST.md** | 📖 Doc | ✅ Novo | Validação em 8 fases |
| **CADDYFILE_INTEGRATION.md** | 📖 Doc | ✅ Novo | 3 opções de integração Caddy |
| **DEPLOYMENT_SUMMARY.md** | 📖 Doc | ✅ Novo | Resumo de mudanças e arquitetura |
| **deploy-local.ps1** | Script | ✅ Novo | PowerShell para setup/start/logs |

---

## 🚀 Comece Aqui (5 minutos)

### 1. Leia o QUICKSTART.md
```bash
cat QUICKSTART.md
```
→ Isso te dará uma visão geral em 5 minutos.

### 2. Prepare o Arquivo .env.local
```bash
cp .env.local.example .env.local
# Edite com suas credenciais:
# - SIIA_HOST
# - POSTGRES_HOST
# - POSTGRES_PASSWORD
# - SECRET_KEY
```

### 3. Escolha Sua Estratégia de Deploy

**Opção A: Deploy Local (testes)**
```powershell
.\deploy-local.ps1 -Action setup
.\deploy-local.ps1 -Action start
.\deploy-local.ps1 -Action validate
```

**Opção B: Deploy via Portainer (produção)**
1. Acesse: http://192.168.3.60:9000
2. Stacks → Add Stack
3. Aponte para este repositório GitHub
4. Configure variáveis de ambiente
5. Deploy!

Consulte **DEPLOYMENT_PORTAINER.md** para passo-a-passo detalhado.

### 4. Configure seu Caddyfile
Edite o Caddyfile existente e substitua referências a SIAGG por SIIA2.0.

Opções:
- **Simples**: Copie `Caddyfile.siagg.siia` para seu Caddyfile
- **Avançado**: Veja 3 opções em `CADDYFILE_INTEGRATION.md`

Reload Caddy:
```bash
docker exec <caddy-container> caddy reload --config /etc/caddy/Caddyfile
```

### 5. Validar
```bash
curl http://192.168.3.60/              # Frontend
curl http://192.168.3.60/siia-admin/   # Backend
curl http://192.168.3.60/api/          # Reabilita (mantido)
```

✅ Se tudo retorna 200 OK, você está pronto!

---

## 📚 Documentação por Caso de Uso

### 🟢 **"Quero subir agora!"**
→ Leia: **QUICKSTART.md** (4 min)

### 🟡 **"Quero entender tudo"**
→ Leia na ordem:
1. **DEPLOYMENT_SUMMARY.md** (10 min) - Visão geral
2. **CADDYFILE_INTEGRATION.md** (10 min) - Como integrar Caddy
3. **DEPLOYMENT_PORTAINER.md** (15 min) - Passo-a-passo Portainer

### 🔴 **"Algo não está funcionando"**
→ Vá direto para: **TECHNICAL_CHECKLIST.md** → seção "Troubleshooting"

### 🔵 **"Preciso validar tudo antes de ir ao ar"**
→ Use: **TECHNICAL_CHECKLIST.md** + **deploy-local.ps1**

---

## 🏗️ Arquitetura Resultante

```
┌──────────────────────────────────────────────────┐
│              Caddy (192.168.3.60)                │
│                                                  │
│  /            → siia-frontend:80  (React)       │
│  /siia-api/*  → siia-backend:8000 (Django)      │
│  /api/*       → reabilita-backend:8000 (Django) │
│  /portainer/* → portainer:9000                   │
└──────────────┬──────────────────────────────────┘
               │
      ┌────────┼────────┐
      ▼        ▼        ▼
   siia-   siia-   reabilita-
  backend frontend backend
   (Django) (React) (Django)
      │
      └─ PostgreSQL (externo)
```

---

## ⚠️ Checklist Pré-Deploy

Antes de colocar em produção:

- [ ] PostgreSQL banco `siia` existe e foi migrado
- [ ] Credenciais `.env.local` preenchidas (não deixar defaults)
- [ ] `SECRET_KEY` é única e segura (50+ caracteres)
- [ ] `DEBUG=False` em produção
- [ ] Caddy resolve `siia-backend` e `siia-frontend` (rede Docker)
- [ ] Health checks passam: `docker-compose ps`
- [ ] Endpoints retornam 200 OK (curl)
- [ ] Logs sem erros (docker logs)

Consulte **TECHNICAL_CHECKLIST.md** para validação completa.

---

## 🔐 Segurança

### ✅ Já Configurado
- `.env.local` está em `.gitignore` (não será commitado)
- Health checks validam saúde antes de rotear tráfego
- Variáveis de ambiente isoladas por container

### ⚠️ Faça Você Mesmo
- Alterar `SECRET_KEY` de um valor seguro gerado
- Manter `DEBUG=False` em produção
- HTTPS no Caddy (auto-assinado ou Let's Encrypt)
- Firewall: restringir acesso à rede interna

---

## 🛠️ Troubleshooting Rápido

| Problema | Solução |
|----------|---------|
| Caddy → "502 Bad Gateway" | Verificar rede Docker: `docker network inspect siia_net` |
| Django → "Connection refused (PostgreSQL)" | Verificar `POSTGRES_HOST` e credenciais |
| Frontend → "Cannot GET /" | Verificar se `siia-frontend` está UP |
| CORS error | Adicionar host ao `CORS_ALLOWED_ORIGINS` (Django settings) |

Consulte **TECHNICAL_CHECKLIST.md** para guia completo.

---

## 📞 Arquivo de Configuração Escondido?

Se não encontrar um arquivo:
```bash
# Backend
ls -la siia-backend/

# Frontend
ls -la siia-frontend/

# Root
ls -la .env* docker-compose.yml Caddyfile*
```

---

## ✨ Próximas Features (Após Deploy Base)

- [ ] HTTPS automático (Let's Encrypt)
- [ ] LDAP authentication
- [ ] Nextcloud integration
- [ ] PostgreSQL backup automático
- [ ] Monitoramento (Prometheus/Grafana)
- [ ] CI/CD (GitHub Actions)

---

## 📖 Resumo de Documentação

```
QUICKSTART.md
├─ 5 minutos para entender
└─ Próximos passos
    │
    ├─→ DEPLOYMENT_PORTAINER.md (guia completo)
    │   └─ Como criar stack no Portainer
    │   └─ Configurar variáveis
    │   └─ Validar pós-deploy
    │
    ├─→ CADDYFILE_INTEGRATION.md (integração Caddy)
    │   └─ 3 opções de roteamento
    │   └─ Troubleshooting de rede
    │
    └─→ TECHNICAL_CHECKLIST.md (validação completa)
        └─ 8 fases de teste
        └─ Problemas comuns
        └─ Rollback
```

---

## 🎯 Status Final

| Componente | Status |
|-----------|--------|
| Backend Django | ✅ Pronto |
| Frontend React | ✅ Pronto |
| docker-compose.yml | ✅ Otimizado para Portainer |
| Caddyfile | ✅ SIAGG → SIIA2.0 |
| Documentação | ✅ 5 docs + script |
| Variáveis de ambiente | ✅ Template completo |
| Validação YAML | ✅ OK |
| `.gitignore` | ✅ Credenciais protegidas |

---

**🚀 Tudo pronto! Comece pelo QUICKSTART.md**

**Data**: 2026-04-28  
**Versão**: SIIA 2.0  
**Compatibilidade**: Portainer, Caddy 2.8+, Docker Compose 3.8+
