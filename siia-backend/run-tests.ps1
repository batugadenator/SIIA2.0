param(
    [string]$TestPath = "",
    [switch]$UsePostgres = $false
)

$ErrorActionPreference = "Stop"

if ($UsePostgres) {
    python manage.py prepare_postgres_test_db
    if ([string]::IsNullOrWhiteSpace($TestPath)) {
        python manage.py test -v 2
    }
    else {
        python manage.py test $TestPath -v 2
    }
}
else {
    if ([string]::IsNullOrWhiteSpace($TestPath)) {
        python manage.py test --settings=core.settings_test -v 2
    }
    else {
        python manage.py test $TestPath --settings=core.settings_test -v 2
    }
}
