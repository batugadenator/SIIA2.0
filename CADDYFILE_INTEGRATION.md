# Integração Caddyfile: SIIA 2.0 + Reabilita + Portainer

Este arquivo mostra como integrar o SIIA 2.0 ao seu Caddyfile existente que já roda Reabilita e Portainer.

## ✅ Opção 1: Substituição Completa (Recomendado)

Se você quer SIIA 2.0 como aplicação principal (raiz) e manter Reabilita em `/api/*`:

**Arquivo**: `Caddyfile` ou `Caddyfile.production`

```caddy
http://192.168.3.60 {
    # Logs de acesso (opcional)
    log {
        output file /var/log/caddy/siia-access.log
        level  INFO
    }

    # ── Portainer: gerenciador de containers ──────────────────────────────────
    handle_path /portainer/* {
        reverse_proxy portainer:9000
    }

    # ── SIIA 2.0: API REST, admin Django e arquivos estáticos ────────────────
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

    # ── Reabilita: API REST, admin Django e arquivos estáticos ───────────────
    handle /api/* {
        reverse_proxy reabilita-backend:8000
    }

    handle /admin/* {
        reverse_proxy reabilita-backend:8000
    }

    handle /static/* {
        reverse_proxy reabilita-backend:8000
    }

    # ── SIIA 2.0: Frontend SPA React (tudo o mais) ───────────────────────────
    handle {
        reverse_proxy siia-frontend:80
    }
}
```

**Características**:
- ✅ SIIA 2.0 como raiz (`/`)
- ✅ Reabilita em `/api/*` e `/admin/*`
- ✅ Portainer acessível em `/portainer/*`
- ✅ Roteamento claro e sem ambiguidade
- ✅ Fácil de entender e manter

**Como aplicar**:
```bash
# 1. Backup do Caddyfile atual
cp Caddyfile Caddyfile.backup.reabilita

# 2. Copiar nova configuração
cp Caddyfile.siagg.siia Caddyfile

# 3. Reload do Caddy
docker exec <caddy-container> caddy reload --config /etc/caddy/Caddyfile

# 4. Verificar
curl http://192.168.3.60/portainer/
curl http://192.168.3.60/siia-admin/
curl http://192.168.3.60/api/  # Reabilita
```

---

## 📌 Opção 2: Manter Reabilita como Principal

Se você quer manter Reabilita como aplicação principal e SIIA 2.0 em um subpath:

```caddy
http://192.168.3.60 {
    log {
        output file /var/log/caddy/access.log
        level  INFO
    }

    # ── Portainer ────────────────────────────────────────────────────────────
    handle_path /portainer/* {
        reverse_proxy portainer:9000
    }

    # ── Reabilita: API REST, admin Django e arquivos estáticos ───────────────
    handle /api/* {
        reverse_proxy reabilita-backend:8000
    }

    handle /admin/* {
        reverse_proxy reabilita-backend:8000
    }

    handle /static/* {
        reverse_proxy reabilita-backend:8000
    }

    # ── SIIA 2.0 em subpath ──────────────────────────────────────────────────
    handle_path /siia/* {
        reverse_proxy siia-frontend:80
    }

    handle_path /siia-api/* {
        reverse_proxy siia-backend:8000
    }

    # ── Reabilita: Frontend SPA React (raiz) ─────────────────────────────────
    handle {
        reverse_proxy reabilita-frontend:80
    }
}
```

**Características**:
- ✅ Reabilita em `/` (raiz)
- ✅ SIIA 2.0 em `/siia/*`
- ✅ API SIIA 2.0 em `/siia-api/*`
- ⚠️ Possíveis conflitos com assets estáticos

**Quando usar**: Se você quer manter Reabilita como app principal durante transição.

---

## 🔄 Opção 3: Usando `@import`

Se seu Caddyfile principal é grande, use `@import` para modularizar:

**Caddyfile principal**:
```caddy
http://192.168.3.60 {
    log {
        output file /var/log/caddy/access.log
        level  INFO
    }

    @import portainer.conf
    @import reabilita.conf
    @import siia2.0.conf
}
```

**portainer.conf**:
```caddy
handle_path /portainer/* {
    reverse_proxy portainer:9000
}
```

**reabilita.conf**:
```caddy
handle /api/* {
    reverse_proxy reabilita-backend:8000
}

handle /admin/* {
    reverse_proxy reabilita-backend:8000
}

handle /static/* {
    reverse_proxy reabilita-backend:8000
}

handle {
    reverse_proxy reabilita-frontend:80
}
```

**siia2.0.conf**:
```caddy
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
```

---

## 🐳 Configuração Docker Network

Para Caddy conseguir rotear para os containers SIIA2.0, eles precisam estar na mesma rede Docker:

### Verificar rede atual
```bash
docker network ls

# Output esperado:
# NETWORK ID     NAME              DRIVER
# xxxxx          siia_net          bridge
# xxxxx          caddy_net         bridge (ou reabilita_net)
```

### Conectar containers em rede existente

**Opção A**: Colocar SIIA2.0 na rede do Caddy

Edite `docker-compose.yml` do SIIA2.0:
```yaml
networks:
  default:
    name: caddy_net
    external: true
```

Então:
```bash
# Criar rede se não existir
docker network create caddy_net

# Ou usar rede existente do Caddy (verificar nome com docker network ls)
```

**Opção B**: Conectar Caddy à rede do SIIA2.0 manualmente

```bash
# Verificar rede SIIA2.0
docker network inspect siia_net

# Conectar container Caddy
docker network connect siia_net caddy  # (ou nome do seu container Caddy)
```

### Verificar conectividade

Dentro do container Caddy:
```bash
docker exec caddy_container nslookup siia-backend
docker exec caddy_container ping siia-frontend
```

---

## 🔥 Troubleshooting: Caddy não consegue rotear

### Erro: `[error] upstream: [no endpoints available]`

**Causa**: Caddy não consegue resolver `siia-backend` ou `siia-frontend`

**Solução**:
```bash
# 1. Verificar se containers estão rodando
docker ps | grep siia

# 2. Verificar rede
docker network inspect siia_net

# 3. Verificar DNS no Caddy
docker exec caddy nslookup siia-backend

# 4. Se ainda não funcionar, conectar Caddy à rede SIIA manualmente
docker network connect siia_net caddy

# 5. Reload Caddy
docker exec caddy caddy reload --config /etc/caddy/Caddyfile
```

### Erro: `502 Bad Gateway`

**Causa**: Backend respondendo lentamente ou não respondendo

**Solução**:
```bash
# 1. Verificar se backend está UP
docker logs siia-backend | tail -50

# 2. Verificar health check
curl http://localhost:8000/admin/login/  # direto no container

# 3. Aumentar timeout no Caddy (se necessário)
reverse_proxy siia-backend:8000 {
    policy random_choose 1
    health_timeout 10s
    health_interval 30s
}
```

---

## 📋 Checklist de Integração

- [ ] Caddy está rodando em container separado
- [ ] PostgreSQL está acessível
- [ ] SIIA2.0 backend inicia sem erros
- [ ] SIIA2.0 frontend inicia sem erros
- [ ] Rede Docker conecta Caddy ↔ SIIA2.0
- [ ] Testar: `curl http://192.168.3.60/` (frontend)
- [ ] Testar: `curl http://192.168.3.60/siia-admin/` (backend)
- [ ] Testar: `curl http://192.168.3.60/api/` (Reabilita)
- [ ] Verificar logs Caddy: `docker logs caddy`
- [ ] Sem erros 502 ou 503

---

## 📞 Próximos Passos

1. **Escolha uma das 3 opções acima** (Recomendado: Opção 1)

2. **Aplique o Caddyfile**:
   ```bash
   # Copiar arquivo
   cp Caddyfile.siagg.siia /seu/path/Caddyfile.siia2
   
   # Ou editar o existente manualmente
   nano /seu/path/Caddyfile
   ```

3. **Reload Caddy**:
   ```bash
   docker exec <seu-caddy-container> caddy reload --config /etc/caddy/Caddyfile
   ```

4. **Verificar**:
   ```bash
   curl -i http://192.168.3.60/
   docker logs <seu-caddy-container>
   ```

5. **Deploy SIIA2.0 no Portainer** conforme `DEPLOYMENT_PORTAINER.md`

---

**Dúvidas?** Consulte `DEPLOYMENT_PORTAINER.md` ou `TECHNICAL_CHECKLIST.md`
