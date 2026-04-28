# 🚀 Guia de Deployment: SIIA 2.0 no Portainer

## 📋 Pré-requisitos

✅ **Infraestrutura Local**
- Portainer rodando em `http://192.168.3.60:9000`
- Caddy rodando como container/stack separada
- PostgreSQL acessível na rede (interno ou externo)
- Repositório GitHub com acesso via token (opcional)

✅ **Credenciais do Banco de Dados**
- Host PostgreSQL: `<seu-servidor-postgres>`
- Database: `siia`
- Usuário: `siia`
- Senha: `<sua-senha-postgres>`

---

## 1️⃣ Preparar Variáveis de Ambiente

### Opção A: Via arquivo `.env.local` (desenvolvimento local)

```bash
# No diretório raiz do SIIA2.0
cp .env.local.example .env.local

# Edite o arquivo com suas credenciais reais
nano .env.local
```

**Variáveis essenciais a customizar:**
- `SIIA_HOST`: IP ou domínio do seu servidor (ex: `192.168.3.60`)
- `POSTGRES_HOST`: IP do servidor PostgreSQL
- `POSTGRES_PASSWORD`: senha real do banco
- `SECRET_KEY`: gere com `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"`

### Opção B: Via UI do Portainer (produção)

Você pode sobrescrever variáveis diretamente na stack do Portainer sem arquivo `.env.local`.

---

## 2️⃣ Criar Stack no Portainer

### Passo a passo:

1. **Acesse o Portainer**: http://192.168.3.60:9000

2. **Navegue**: `Stacks` → `Add Stack`

3. **Nome da Stack**: `siia2.0`

4. **Escolha o repositório**:
   - Se usar GitHub: ative **Git** e configure:
     - Repository URL: `https://github.com/seu-usuario/SIIA2.0.git`
     - Branch: `main` (ou a branch desejada)
     - Compose path: `docker-compose.yml`
     - Authentication (se privado): use seu GitHub token
   
   - Se não usar Git: copie o conteúdo de `docker-compose.yml` no campo **Web Editor**

5. **Configurar Variáveis de Ambiente**:
   
   Clique em **Environment** e adicione:
   
   ```
   SIIA_HOST = 192.168.3.60
   DEBUG = False
   SECRET_KEY = <gerar-chave-segura>
   SIIA_ENV = prod
   
   POSTGRES_HOST = <seu-postgres-ip>
   POSTGRES_PORT = 5432
   POSTGRES_DB = siia
   POSTGRES_USER = siia
   POSTGRES_PASSWORD = <sua-senha>
   POSTGRES_SEARCH_PATH = reabilita,siagg,public
   
   USE_LDAP_AUTH = false
   CMS_ALLOWED_NEXTCLOUD_HOSTS = nextcloud.sua-rede.mil.br
   CMS_ALLOWED_LEGACY_HOSTS = 192.168.3.60
   ```

6. **Rede**: Verifique se está na mesma rede que o Caddy
   - Se usar rede existente: selecione `siia_net` (será criada automaticamente)
   - O Caddy precisa enxergar `siia-backend` e `siia-frontend` por nome

7. **Deploy**: Clique em **Deploy the Stack**

---

## 3️⃣ Integrar com Caddy Existente

### Opção A: Se Caddy está em outra stack

1. **Edite o Caddyfile do Caddy** existente:
   ```bash
   docker exec <caddy-container> vi /etc/caddy/Caddyfile
   ```

2. **Substitua o bloco SIAGG pelo SIIA2.0**:
   ```
   # ── SIIA 2.0: API REST, admin Django e arquivos estáticos ────────────
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

   # ── SIIA 2.0: Frontend SPA React (tudo o mais) ───────────────────────
   handle {
       reverse_proxy siia-frontend:80
   }
   ```

3. **Reload do Caddy**:
   ```bash
   docker exec <caddy-container> caddy reload --config /etc/caddy/Caddyfile
   ```

### Opção B: Se Caddy está no mesmo docker-compose.yml

Copie o arquivo `Caddyfile.siagg.siia` para sua stack Caddy e recarregue.

---

## 4️⃣ Validação Pós-Deploy

### ✅ Verificar saúde dos containers

```bash
# Ver status dos containers
docker ps | grep siia

# Ver logs do backend
docker logs -f siia-backend

# Ver logs do frontend
docker logs -f siia-frontend
```

### ✅ Testar endpoints

```bash
# Frontend (raiz)
curl -i http://192.168.3.60/

# Backend (admin)
curl -i http://192.168.3.60/siia-admin/login/

# API exemplo (se houver)
curl -i http://192.168.3.60/siia-api/
```

### ✅ Verificar conectividade PostgreSQL

```bash
# Dentro do container backend
docker exec siia-backend python manage.py dbshell

# Ou testar migrações
docker exec siia-backend python manage.py migrate --check
```

---

## 5️⃣ Troubleshooting

### ❌ Caddy não consegue rotear para siia-backend

**Problema**: `reverse_proxy siia-backend:8000` retorna erro de DNS

**Solução**:
```bash
# Verificar se os containers estão na mesma rede
docker network ls
docker network inspect siia_net

# Se não estão, conecte manualmente
docker network connect siia_net siia-backend
docker network connect siia_net siia-frontend
docker network connect siia_net caddy  # (ou o container do Caddy)
```

### ❌ Backend está lento ou não responde

**Problema**: Migrations demoram muito ou falham

**Solução**:
```bash
# Verificar logs detalhados
docker logs siia-backend

# Executar migrate manualmente
docker exec siia-backend python manage.py migrate --verbosity 3

# Se trava, aumentar timeout do health check em docker-compose.yml
# Alterar "start_period: 40s" para "start_period: 120s"
```

### ❌ Frontend mostra erro CORS

**Problema**: React não consegue chamar APIs do backend

**Solução**:
- Verificar se `CORS_ALLOWED_ORIGINS` no Django inclui `http://192.168.3.60`
- Ou desabilitar CORS para testes (apenas desenvolvimento!)

### ❌ Volumes não persistem

**Problema**: Media/static sumiram após reiniciar container

**Solução**:
```bash
# Verificar volumes
docker volume ls | grep siia

# Inspecionar volume
docker volume inspect siia_siia_media

# Se volume estiver vazio, verificar permissões
docker exec siia-backend ls -la /app/media
```

---

## 6️⃣ Atualizar via GitHub (Auto-Deploy)

Se configurou Git na stack:

1. **Fazer commit no GitHub**:
   ```bash
   git add .
   git commit -m "Deploy SIIA2.0"
   git push origin main
   ```

2. **Portainer detecta mudança automaticamente**:
   - Webhook do GitHub → Portainer
   - Stack redeploy automático
   - Containers reiniciam com novo código

3. **Verificar status no Portainer**:
   - `Stacks` → `siia2.0` → ver logs de atualização

---

## 📝 Checklist Final de Deploy

- [ ] PostgreSQL acessível da rede Docker
- [ ] Arquivo `.env.local` ou variáveis no Portainer configuradas
- [ ] Stack `siia2.0` criada no Portainer
- [ ] Caddy configurado para rotear `/siia-*` → `siia-backend:8000` e `/` → `siia-frontend:80`
- [ ] Containers passando em health checks
- [ ] Frontend acessível em `http://192.168.3.60/`
- [ ] Backend acessível em `http://192.168.3.60/siia-admin/`
- [ ] Logs sem erros de conexão PostgreSQL
- [ ] GitHub webhook configurado (se usar auto-deploy)

---

## 🔐 Segurança

⚠️ **Antes de produção**:
- [ ] Alterar `SECRET_KEY` para valor seguro
- [ ] `DEBUG = False` em produção
- [ ] HTTPS habilitado no Caddy (gerar certificado auto-assinado ou Let's Encrypt)
- [ ] Credenciais em secrets do Docker, não em .env.local
- [ ] Firewall: restringir acesso à rede interna

---

**Dúvidas?** Consulte os logs:
```bash
docker logs -f siia-backend
docker logs -f siia-frontend
docker logs -f <caddy-container>
```
