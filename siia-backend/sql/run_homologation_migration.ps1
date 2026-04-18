$ErrorActionPreference = 'Stop'

Set-StrictMode -Version Latest

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path (Join-Path $scriptRoot '..')

$env:PGPASSWORD = 'highlighter'
$env:PAGER = ''

$psql = 'psql'

function Invoke-PsqlFile {
    param(
        [Parameter(Mandatory = $true)]
        [string]$FilePath
    )

    if (-not (Test-Path $FilePath)) {
        throw "SQL script not found: $FilePath"
    }

    Write-Host "==> Executando $(Split-Path -Leaf $FilePath)"
    & $psql `
        -h localhost `
        -U siia `
        -d siia `
        -v ON_ERROR_STOP=1 `
        -P pager=off `
        -f $FilePath

    if ($LASTEXITCODE -ne 0) {
        throw "psql retornou codigo de erro $LASTEXITCODE ao executar $FilePath"
    }
}

$steps = @(
    (Join-Path $scriptRoot 'phases/principal/precheck.sql'),
    (Join-Path $scriptRoot 'phases/principal/migrate.sql'),
    (Join-Path $scriptRoot 'phases/cadfuncional/precheck.sql'),
    (Join-Path $scriptRoot 'phases/cadfuncional/migrate.sql'),
    (Join-Path $scriptRoot 'phases/cms/precheck.sql'),
    (Join-Path $scriptRoot 'phases/cms/migrate.sql')
)

Push-Location $repoRoot
try {
    foreach ($step in $steps) {
        Invoke-PsqlFile -FilePath $step
    }

    Write-Host '==> Migracao de homologacao concluida com sucesso.'
}
finally {
    Pop-Location
}
