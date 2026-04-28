#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Script para facilitar deploy local do SIIA2.0 em Docker Compose
    
.DESCRIPTION
    Prepara ambiente, valida configurações e inicia containers
    
.PARAMETER Action
    Ação a executar: setup, start, stop, logs, validate, clean
    
.PARAMETER EnvFile
    Caminho para arquivo .env.local (padrão: .env.local)
    
.EXAMPLE
    .\deploy-local.ps1 -Action setup
    .\deploy-local.ps1 -Action start -EnvFile .env.local
    .\deploy-local.ps1 -Action logs
#>

param(
    [ValidateSet('setup', 'start', 'stop', 'logs', 'validate', 'clean')]
    [string]$Action = 'start',
    
    [string]$EnvFile = '.env.local'
)

$ErrorActionPreference = 'Stop'

# ═════════════════════════════════════════════════════════════════════════════
# FUNÇÕES AUXILIARES
# ═════════════════════════════════════════════════════════════════════════════

function Write-Header {
    param([string]$Message)
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║ $Message" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️ $Message" -ForegroundColor Yellow
}

# ═════════════════════════════════════════════════════════════════════════════
# SETUP: Preparar ambiente
# ═════════════════════════════════════════════════════════════════════════════

function Invoke-Setup {
    Write-Header "SETUP: Preparando ambiente SIIA2.0"
    
    # Verificar se arquivo .env.local existe
    if (-not (Test-Path $EnvFile)) {
        Write-Error-Custom "Arquivo $EnvFile não encontrado"
        Write-Info "Copiando .env.local.example para $EnvFile..."
        
        if (Test-Path '.env.local.example') {
            Copy-Item '.env.local.example' $EnvFile
            Write-Success ".env.local criado de .env.local.example"
            Write-Info "⚠️  EDITE $EnvFile com suas credenciais reais antes de começar!"
            Write-Info "    Variáveis essenciais:"
            Write-Info "    - SIIA_HOST: IP do servidor (ex: 192.168.3.60)"
            Write-Info "    - POSTGRES_HOST: host do PostgreSQL"
            Write-Info "    - POSTGRES_PASSWORD: senha do banco"
            Write-Info "    - SECRET_KEY: gere com Python"
            exit 1
        } else {
            Write-Error-Custom ".env.local.example também não encontrado!"
            exit 1
        }
    }
    
    Write-Success "Arquivo $EnvFile existe"
    
    # Verificar Docker
    try {
        docker --version | Out-Null
        Write-Success "Docker está instalado"
    } catch {
        Write-Error-Custom "Docker não encontrado! Instale Docker Desktop ou Docker Engine."
        exit 1
    }
    
    # Verificar docker-compose
    try {
        docker-compose --version | Out-Null
        Write-Success "Docker Compose está instalado"
    } catch {
        Write-Error-Custom "Docker Compose não encontrado!"
        exit 1
    }
    
    # Validar YAML
    try {
        python -c "import yaml; yaml.safe_load(open('docker-compose.yml'))" 2>&1 | Out-Null
        Write-Success "Sintaxe docker-compose.yml válida"
    } catch {
        Write-Error-Custom "Erro na sintaxe docker-compose.yml: $_"
        exit 1
    }
    
    Write-Success "Setup concluído! Pronto para iniciar containers."
    Write-Info "Próximo passo: .\deploy-local.ps1 -Action start"
}

# ═════════════════════════════════════════════════════════════════════════════
# START: Iniciar containers
# ═════════════════════════════════════════════════════════════════════════════

function Invoke-Start {
    Write-Header "START: Iniciando containers SIIA2.0"
    
    if (-not (Test-Path $EnvFile)) {
        Write-Error-Custom "Arquivo $EnvFile não encontrado!"
        Write-Info "Execute: .\deploy-local.ps1 -Action setup"
        exit 1
    }
    
    Write-Info "Usando arquivo de configuração: $EnvFile"
    
    try {
        docker-compose --env-file $EnvFile up -d
        Write-Success "Containers iniciados!"
        Write-Info "Aguarde 30-60 segundos para migrations e startup..."
        Write-Info ""
        Write-Info "Próximos passos:"
        Write-Info "  1. Monitorar logs: .\deploy-local.ps1 -Action logs"
        Write-Info "  2. Validar saúde: docker-compose ps"
        Write-Info "  3. Acessar frontend: http://localhost/ ou http://192.168.3.60/"
    } catch {
        Write-Error-Custom "Erro ao iniciar containers: $_"
        exit 1
    }
}

# ═════════════════════════════════════════════════════════════════════════════
# STOP: Parar containers
# ═════════════════════════════════════════════════════════════════════════════

function Invoke-Stop {
    Write-Header "STOP: Parando containers"
    
    try {
        docker-compose down
        Write-Success "Containers parados"
        Write-Info "Volumes mantidos para próximo start"
    } catch {
        Write-Error-Custom "Erro ao parar containers: $_"
        exit 1
    }
}

# ═════════════════════════════════════════════════════════════════════════════
# LOGS: Mostrar logs dos containers
# ═════════════════════════════════════════════════════════════════════════════

function Invoke-Logs {
    Write-Header "LOGS: Backend SIIA2.0"
    
    Write-Info "Exibindo logs em tempo real (Ctrl+C para sair)..."
    Write-Host ""
    
    docker logs -f siia-backend
}

# ═════════════════════════════════════════════════════════════════════════════
# VALIDATE: Validar configuração e saúde
# ═════════════════════════════════════════════════════════════════════════════

function Invoke-Validate {
    Write-Header "VALIDATE: Verificando saúde da aplicação"
    
    # Status dos containers
    Write-Info "Status dos containers:"
    docker-compose ps
    
    Write-Host ""
    Write-Info "Health checks:"
    
    # Verificar backend
    try {
        $response = docker exec siia-backend curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/admin/login/
        if ($response -eq "200" -or $response -eq "301") {
            Write-Success "Backend respondendo (HTTP $response)"
        } else {
            Write-Error-Custom "Backend status HTTP $response"
        }
    } catch {
        Write-Error-Custom "Backend não respondendo: $_"
    }
    
    # Verificar frontend
    try {
        $response = docker exec siia-frontend curl -s -o /dev/null -w "%{http_code}" http://localhost:80/
        if ($response -eq "200" -or $response -eq "301") {
            Write-Success "Frontend respondendo (HTTP $response)"
        } else {
            Write-Error-Custom "Frontend status HTTP $response"
        }
    } catch {
        Write-Error-Custom "Frontend não respondendo: $_"
    }
    
    # Verificar PostgreSQL
    Write-Host ""
    Write-Info "Testando conexão PostgreSQL..."
    try {
        docker exec siia-backend python manage.py dbshell -c "SELECT 1" | Out-Null
        Write-Success "Conexão PostgreSQL OK"
    } catch {
        Write-Error-Custom "Erro ao conectar ao PostgreSQL (verifique credenciais)"
    }
    
    # Dicas
    Write-Host ""
    Write-Info "Endpoints para testar:"
    Write-Info "  - Frontend:  http://localhost/ (ou http://192.168.3.60/)"
    Write-Info "  - Backend:   http://localhost:8000/admin/login/"
    Write-Info "  - API:       http://localhost:8000/api/ (conforme suas rotas)"
}

# ═════════════════════════════════════════════════════════════════════════════
# CLEAN: Limpar containers e volumes
# ═════════════════════════════════════════════════════════════════════════════

function Invoke-Clean {
    Write-Header "CLEAN: Removendo containers e volumes"
    
    Write-Error-Custom "⚠️  Esta ação vai remover TODOS os dados (volumes, banco local, etc)"
    $confirm = Read-Host "Digite 'sim' para confirmar"
    
    if ($confirm -ne 'sim') {
        Write-Info "Cancelado"
        return
    }
    
    try {
        docker-compose down -v
        Write-Success "Containers e volumes removidos"
    } catch {
        Write-Error-Custom "Erro ao limpar: $_"
        exit 1
    }
}

# ═════════════════════════════════════════════════════════════════════════════
# MAIN
# ═════════════════════════════════════════════════════════════════════════════

Write-Host ""
Write-Host "🐳 SIIA 2.0 - Deploy Local Script" -ForegroundColor Magenta
Write-Host "   Portainer + Caddy compatible" -ForegroundColor Magenta
Write-Host ""

switch ($Action) {
    'setup' { Invoke-Setup }
    'start' { Invoke-Start }
    'stop' { Invoke-Stop }
    'logs' { Invoke-Logs }
    'validate' { Invoke-Validate }
    'clean' { Invoke-Clean }
    default { Write-Error-Custom "Ação desconhecida: $Action" }
}
