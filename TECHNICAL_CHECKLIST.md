# 🔍 SIIA 2.0 - Checklist Técnico de Validação

## 📋 Antes do Deploy (Pré-voo)

### Infraestrutura
- [ ] PostgreSQL está acessível e banco `siia` foi criado
- [ ] Usuário `siia` tem permissões no banco (`GRANT` executado)
- [ ] Portainer está rodando em `http://192.168.3.60:9000`
- [ ] Caddy está rodando e reachable
- [ ] Rede Docker permite comunicação inter-container
- [ ] Firewall não bloqueia portas internas (8000, 80)

### Arquivos de Configuração
- [ ] `.env.local` foi criado a partir de `.env.local.example`
- [ ] Variáveis preenchidas corretamente:
  - [ ] `SIIA_HOST`: IP do servidor (não `localhost`)
  - [ ] `POSTGRES_HOST`: host resolvível no Docker
  - [ ] `POSTGRES_PASSWORD`: senha correta
  - [ ] `POSTGRES_DB`: `siia`
  - [ ] `SECRET_KEY`: string não-vazia e diferente do default
  - [ ] `DEBUG`: `False` para produção
  - [ ] `SIIA_ENV`: `prod` para produção, `dev` para testes

- [ ] `docker-compose.yml` tem sintaxe YAML válida
  ```bash
  python -c "import yaml; yaml.safe_load(open('docker-compose.yml'))"
  ```

- [ ] `Caddyfile.siagg.siia` substitui SIAGG corretamente
  - [ ] Nenhuma referência a `/siagg-backend/*`
  - [ ] Nenhuma referência a `/siagg/*`
  - [ ] SIIA2.0 roteia em `/siia-api/*`, `/siia-admin/*`, etc
  - [ ] Fallback (raiz) vai para `siia-frontend:80`

### Repositório
- [ ] `.env.local` está em `.gitignore` (não será commitado)
- [ ] Sem senhas ou tokens em arquivos versionados
- [ ] Sem arquivos de build local (`node_modules/`, `dist/`, `__pycache__/`, `.venv/`)

---

## 🚀 Deployment - Build e Inicialização

### Build Backend
```bash
docker build -t siia-backend:latest ./siia-backend
```
- [ ] Build completou sem erros
- [ ] Nenhum erro de dependências Python
- [ ] Image foi criada
- [ ] Tamanho razoável (< 500MB)

### Build Frontend
```bash
docker build -t siia-frontend:latest ./siia-frontend
```
- [ ] Build completou sem erros
- [ ] Compilação Vite/TypeScript OK
- [ ] Nenhum erro de dependências Node
- [ ] Image foi criada
- [ ] Tamanho razoável (< 200MB)

### Iniciar Containers
```bash
docker-compose --env-file .env.local up -d
```
- [ ] Backend iniciou com sucesso
- [ ] Frontend iniciou com sucesso
- [ ] Sem erros de rede/DNS
- [ ] Containers em estado `Running`

---

## ✅ Pós-Deploy - Validação Funcional

### Health Checks
```bash
docker-compose ps
```
- [ ] `siia-backend`: UP (healthy)
- [ ] `siia-frontend`: UP (healthy)

### Backend - Migrações e Setup
```bash
docker logs siia-backend
```
- [ ] Log contém: `"Running migrations"` ✅
- [ ] Log contém: `"collectstatic"` ✅
- [ ] Nenhum erro de conexão PostgreSQL
- [ ] Nenhum erro de imports Django
- [ ] Gunicorn iniciou: `"Listening at: http://0.0.0.0:8000"`

### Frontend - Build e Serve
```bash
docker logs siia-frontend
```
- [ ] Vite build completou
- [ ] Nginx/servidor iniciou na porta 80
- [ ] Nenhum erro de assets faltando

### Conectividade Backend ↔ PostgreSQL
```bash
docker exec siia-backend python manage.py dbshell
```
Dentro do shell:
```sql
SELECT 1;
\dt  -- Listar tabelas
```
- [ ] Conexão bem-sucedida
- [ ] Database `siia` acessível
- [ ] Tabelas carregaram (não deve estar vazio)

### Conectividade Intra-Rede Docker
```bash
docker exec siia-backend ping siia-frontend
docker exec siia-frontend ping siia-backend
```
- [ ] Ambos resolvem por hostname
- [ ] Ping responde

---

## 🌐 Frontend - Testes HTTP

### Endpoint Raiz
```bash
curl -i http://192.168.3.60/
```
- [ ] Status: 200 OK (ou 301 redirect)
- [ ] Content-Type: `text/html` (ou `application/json`)
- [ ] Body contém código HTML/React

### Frontend via Caddy
```bash
curl -i http://192.168.3.60/
```
(Mesmo teste, através do Caddy)
- [ ] Status: 200 OK
- [ ] Caddy roteia corretamente
- [ ] Sem erro 502 Bad Gateway

---

## 🔧 Backend - Testes HTTP

### Admin Interface
```bash
curl -i http://192.168.3.60/siia-admin/login/
```
- [ ] Status: 200 OK ou 301 redirect
- [ ] Response contém Django login form (HTML)
- [ ] CSRF token presente

### Static Files (se houver)
```bash
curl -i http://192.168.3.60/siia-static/admin/css/base.css
```
- [ ] Status: 200 OK
- [ ] Content-Type: `text/css`
- [ ] Arquivo existe e é servido

### Media Files (uploads)
```bash
curl -i http://192.168.3.60/siia-media/test.txt
```
- [ ] Status: 200 OK (se arquivo existe) ou 404 (esperado se vazio)
- [ ] Sem erro 502

---

## 🔌 Caddy - Validação Proxy Reverso

### Listar blocos configurados
```bash
docker exec <caddy-container> caddy config export
```
- [ ] Bloco SIIA2.0 presente
- [ ] Hosts corretos (`siia-backend:8000`, `siia-frontend:80`)
- [ ] Sem referência a SIAGG
- [ ] Logging configurado

### Reload sem erro
```bash
docker exec <caddy-container> caddy reload --config /etc/caddy/Caddyfile
```
- [ ] Exit code 0
- [ ] Sem mensagens de erro
- [ ] Caddy continua rodando

### Verificar logs Caddy
```bash
docker logs -f <caddy-container>
```
- [ ] Requests chegando ao Caddy
- [ ] Reverse proxying para siia-backend/frontend
- [ ] Sem erros de `context deadline exceeded`

---

## 📊 Performance - Logs de Startup

### Backend Startup Time
```bash
docker logs siia-backend | grep -i "listening\|started\|ready"
```
- [ ] Backend respondendo em < 2 minutos
- [ ] Gunicorn iniciou 3 workers (default)
- [ ] Database migrations completadas

### Frontend Startup Time
- [ ] Frontend respondendo em < 30 segundos
- [ ] Nenhum erro de build/serve

### Memory Usage
```bash
docker stats
```
- [ ] Backend: < 500MB
- [ ] Frontend: < 200MB
- [ ] CPU: baixo quando idle

---

## 🔐 Segurança - Pós-Deploy

- [ ] DEBUG=False em produção
- [ ] SECRET_KEY alterada (não usar valor default)
- [ ] HTTPS habilitado no Caddy (auto-assinado mínimo)
- [ ] ALLOWED_HOSTS configurado (se aplicável em Django)
- [ ] CORS_ALLOWED_ORIGINS configurado (se aplicável)
- [ ] Credenciais PostgreSQL não estão hardcoded no código
- [ ] `.env.local` não será commitado (verificar `.gitignore`)

---

## 📝 Monitoramento - Contínuo

### Logs Diários
```bash
# Backend
docker logs siia-backend | tail -100

# Frontend  
docker logs siia-frontend | tail -50

# Caddy
docker logs <caddy-container> | tail -100
```
- [ ] Nenhum erro repetido
- [ ] Nenhum warning não-esperado
- [ ] Conectividade PostgreSQL OK

### Health Check Automático
```bash
# Ver se health checks passam
docker-compose ps
```
- [ ] siia-backend: UP (healthy) ou (running)
- [ ] siia-frontend: UP (healthy) ou (running)

### Atualizar via Stack Portainer
- [ ] Fazer commit e push no GitHub
- [ ] Portainer detecta mudança (webhook)
- [ ] Stack redeploy automático
- [ ] Containers reiniciam sem perder dados (volumes persistem)

---

## 🛠️ Rollback - Se Algo Não Funcionar

### Parar todos os containers
```bash
docker-compose down
```

### Reverter arquivo de configuração
```bash
git checkout Caddyfile.siagg.siia docker-compose.yml .env.local.example
```

### Reimplantar SIAGG (se necessário)
```bash
# Restaurar referências a siagg-backend e siagg-frontend no Caddyfile
docker-compose up -d  # (com compose que tinha SIAGG)
```

---

## 📚 Problemas Comuns e Soluções

| Problema | Causa | Solução |
|----------|-------|---------|
| 502 Bad Gateway | Caddy não enxerga siia-backend | Verificar rede Docker, DNS interno |
| Connection refused | PostgreSQL não acessível | Verificar POSTGRES_HOST, credenciais, firewall |
| Django migration error | Schema não existe | Executar migrations manualmente ou resetar DB |
| CORS error | ALLOWED_ORIGINS não configurado | Adicionar host ao Django settings |
| Frontend não carrega | Build failed ou serve error | Verificar logs, rebuildar com `docker build` |
| Volumes vazios | Paths incorretos | Verificar montagens em docker-compose.yml |

---

## ✨ Checklist Final

Marque como ✅ quando tudo estiver funcionando:

- [ ] **Infraestrutura**: Tudo online e acessível
- [ ] **Arquivos**: Configurados e validados
- [ ] **Build**: Backend e frontend buildaram OK
- [ ] **Deploy**: Containers UP e healthy
- [ ] **Banco**: Migrations OK, dados acessíveis
- [ ] **Proxy**: Caddy roteando corretamente
- [ ] **Frontend**: Acessível em http://192.168.3.60/
- [ ] **Backend**: Acessível em http://192.168.3.60/siia-admin/
- [ ] **Segurança**: DEBUG=False, SECRET_KEY único
- [ ] **Monitoramento**: Logs limpos, sem erros

---

**Se todos os itens estão marcados, SIIA 2.0 está pronto para produção! 🚀**

Para manutenção contínua, consulte `DEPLOYMENT_PORTAINER.md` e mantenha logs monitorados.
