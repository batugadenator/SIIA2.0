# API v1 decommission checklist (CadFuncional)

## Objective

Decommission the legacy alias /api/v1 safely, keeping /api/cadfuncional as the canonical endpoint.

Communication support document:

- docs/api-v1-communication-plan.md
- docs/api-v1-plano-comunicacao.md
- docs/api-v1-resumo-executivo.md

## Current control point

- Code switch: API_V1_ALIAS_ENABLED
- Settings: core/settings.py
- Route gate: core/urls.py

## Scope

- In scope: CadFuncional endpoints exposed through /api/v1.
- Out of scope: /api/siagg, /api/cms, /api/usuarios.

## Success criteria

1. No active consumers calling /api/v1 during the observation window.
2. Backend check and frontend build are green before and after switch-off.
3. No error-rate or latency regression on /api/cadfuncional after cutover.
4. Rollback can be executed in less than 5 minutes.

## Preconditions

1. All known clients updated to /api/cadfuncional.
2. Monitoring available for request path, status code, p95/p99, and 5xx count.
3. Deployment window approved (hml first, then prod).

## Metrics to observe

1. Request volume by path:

   - /api/v1/*
   - /api/cadfuncional/*

2. HTTP status distribution (2xx/4xx/5xx) for both path groups.
3. Latency p95/p99 for /api/cadfuncional/*.
4. Error burst after deployment (first 30 min, first 2 h, first 24 h).

## Dry-run in HML

1. Set API_V1_ALIAS_ENABLED=false.
2. Restart backend.
3. Validate routes:

   - /api/cadfuncional/health/ returns 200
   - /api/v1/health/ returns 404

4. Execute smoke:

   - Backend: python manage.py check --settings=core.settings
   - Frontend: npm run build

5. Observe logs/metrics for at least one business cycle.

## Production cutover runbook

1. T-24h

   - Confirm no mandatory client still using /api/v1.
   - Publish final cutover notice.

2. T-0

   - Set API_V1_ALIAS_ENABLED=false.
   - Deploy/restart backend.

3. T+5min

   - Check health and key CadFuncional APIs.
   - Confirm no 5xx spike.

4. T+30min

   - Validate p95/p99 and 4xx rate.

5. T+2h

   - Confirm stable traffic only on /api/cadfuncional.

## Rollback

1. Set API_V1_ALIAS_ENABLED=true.
2. Restart backend.
3. Re-validate:

   - /api/v1/health/ returns 200
   - /api/cadfuncional/health/ remains 200

4. Open incident note with root cause and next attempt date.

## Post-cutover cleanup (after stabilization)

1. Keep API_V1_ALIAS_ENABLED=false as default in target environments.
2. Remove operational references to /api/v1 from docs/scripts.
3. Plan final code cleanup step:

   - remove conditional route block for /api/v1 in core/urls.py
   - remove API_V1_ALIAS_ENABLED setting from core/settings.py
   - update env template accordingly

## Suggested evidence for PR/change request

1. Screenshot or export of path-level traffic before/after.
2. Backend check output.
3. Frontend build output.
4. Incident-free observation summary for the agreed window.
