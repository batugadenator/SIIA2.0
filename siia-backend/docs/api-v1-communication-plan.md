# API v1 communication plan (CadFuncional)

## Goal

Coordinate the decommission of the legacy alias /api/v1 with clear notice windows, low operational risk, and explicit rollback messaging.

## Audience

1. Internal frontend/backend teams.
2. Integration consumers (automation scripts, gateways, external callers).
3. Operations/observability and service desk.

## Timeline

1. T-7 days: initial notice and migration guidance.
2. T-1 day: final reminder and freeze window details.
3. T-0: start and completion notices during cutover.
4. T+1 day: post-cutover summary and residual action list.

## Message channels

1. Team channel (primary): release announcement.
2. Ticketing/change request: formal evidence and approvals.
3. Email list for integration consumers.
4. Optional banner in internal portal for broad visibility.

## Templates

### T-7 notice

Subject: Deprecation notice - /api/v1 alias for CadFuncional

Message:

We will decommission the legacy alias /api/v1 for CadFuncional.

- Canonical endpoint: /api/cadfuncional
- Planned cutover window: [DATE/TIME, TZ]
- Environment progression: HML first, PROD after validation
- Action required: update integrations to /api/cadfuncional
- Temporary control: API_V1_ALIAS_ENABLED

Please confirm affected consumers by [DATE].

### T-1 reminder

Subject: Final reminder - /api/v1 cutover in 24h

Message:

This is the final reminder for the /api/v1 alias cutover.

- Start: [DATE/TIME, TZ]
- Expected impact: calls to /api/v1 may return 404 after cutover
- No impact expected for /api/cadfuncional
- Rollback plan: re-enable API_V1_ALIAS_ENABLED if needed

If you still depend on /api/v1, notify immediately.

### T-0 start

Subject: Change started - /api/v1 alias decommission

Message:

Cutover has started.

- Change: API_V1_ALIAS_ENABLED=false
- Validation in progress:
  - /api/cadfuncional/health -> expected 200
  - /api/v1/health -> expected 404

Next update in [X] minutes.

### T-0 completion

Subject: Change completed - /api/v1 alias decommission

Message:

Cutover completed successfully.

- /api/cadfuncional is the only supported endpoint for this domain.
- /api/v1 is disabled.
- Monitoring window remains active for [X] hours.

Report any anomaly with timestamp, endpoint, and status code.

### Rollback notice

Subject: Rollback executed - /api/v1 alias temporarily restored

Message:

Rollback executed due to [SHORT REASON].

- Action: API_V1_ALIAS_ENABLED=true
- Current status:
  - /api/v1 available again
  - /api/cadfuncional remains available

A new cutover date will be communicated after root-cause review.

## Changelog template

Title: CadFuncional API - alias deprecation

Summary:

- Deprecated: /api/v1/* (CadFuncional scope)
- Canonical: /api/cadfuncional/*
- Feature flag: API_V1_ALIAS_ENABLED

Breaking change:

- When API_V1_ALIAS_ENABLED=false, /api/v1/* returns 404.

Migration notes:

1. Replace /api/v1 with /api/cadfuncional in all consumers.
2. Validate auth/session/token behavior remains unchanged.
3. Re-run smoke tests after endpoint switch.

## Readiness checklist for communications

1. Consumer inventory updated and owners assigned.
2. T-7 notice sent with acknowledgment tracking.
3. T-1 reminder sent and unanswered risks escalated.
4. T-0 operational channel staffed during the full window.
5. Post-cutover summary published with metrics.
