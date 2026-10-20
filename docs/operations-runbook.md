# Backend Operations Runbook

This backend is not considered production-ready solely because it builds. Production approval requires passing the CI checks, staging restore test, authentication/authorization tests, provider contract tests, load tests, and security review.

## Deploy

1. Build the immutable image from the commit SHA.
2. Inject secrets from a managed secret store, never from the image or repository.
3. Run the image in staging with `NODE_ENV=production`, `COOKIE_SECURE=true`, and a TLS origin.
4. Verify `/health/live` and `/health/ready`.
5. Run smoke tests for registration, login, CSRF rejection, chat authorization, document isolation, and logout.
6. Promote the same image digest to production.

The application runs migrations at startup. For larger fleets, move migration execution to a single release job and remove startup migration after validating the process.

## Rollback

1. Stop promotion and keep the last healthy image digest available.
2. Roll back application traffic to the last healthy digest.
3. Do not automatically roll back database migrations; migrations are additive and must have a reviewed down/forward plan.
4. If a schema issue exists, restore a staging backup into an isolated database, validate a forward fix, and deploy the fix.
5. Record the incident, request IDs, impact window, and provider status.

## Backups and restoration

- Run `scripts/backup.ps1` daily against a least-privilege backup role.
- Encrypt backups at rest and retain them according to the tenant retention policy and legal hold policy.
- Test restoration monthly into an isolated database.
- Verify row counts, foreign keys, application readiness, and an authenticated smoke flow after restore.
- Never restore production data into developer environments without approved redaction.

## Monitoring and alerts

Alert on:

- `/health/ready` failures or database pool exhaustion.
- 5xx rate, authentication failures, CSRF failures, and rate-limit spikes.
- Provider timeout/error rate, p95 time-to-first-token, and cost per request.
- Daily quota exhaustion and unusual token use.
- Backup age and restore-test failure.

Logs contain event names, request IDs, status, latency, route, user ID hash, and provider/model metadata. Do not log prompts, completions, tokens, cookies, authorization headers, or document contents.

## Data deletion and retention

- `DELETE /api/documents/:id` marks a document deleted and removes its chunks through the foreign key.
- Account deletion is a scheduled workflow: set `pending_deletion`, revoke sessions, export on request, then delete user-owned rows after the grace period.
- Run `SELECT execute_due_deletions()` from a locked maintenance job after checking legal holds and cancellation requests.
- Run `SELECT purge_expired_data('90 days')` (with the configured retention interval) from a maintenance role.
- Apply legal holds before deletion. Document the hold owner and expiry.
- Data export must be generated asynchronously and delivered through a time-limited authenticated download.

## Incident response

1. Preserve logs and audit records within the retention/legal-hold policy.
2. Revoke affected sessions and rotate compromised provider or session secrets.
3. Disable the affected tool/provider route through configuration.
4. Restrict traffic or enable maintenance mode if tenant isolation is in doubt.
5. Assess notification obligations based on jurisdiction and contract.
