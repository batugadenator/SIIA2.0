#!/usr/bin/env bash
set -euo pipefail

TEST_PATH="${1:-}"
USE_POSTGRES_TEST_DB="${USE_POSTGRES_TEST_DB:-0}"

if [[ "$USE_POSTGRES_TEST_DB" == "1" ]]; then
  python manage.py prepare_postgres_test_db
  if [[ -z "$TEST_PATH" ]]; then
    python manage.py test -v 2
  else
    python manage.py test "$TEST_PATH" -v 2
  fi
else
  if [[ -z "$TEST_PATH" ]]; then
    python manage.py test --settings=core.settings_test -v 2
  else
    python manage.py test "$TEST_PATH" --settings=core.settings_test -v 2
  fi
fi
