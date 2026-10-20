# Release Gates

The application must not be promoted until every applicable gate is evidenced in CI or staging.

| Gate | Required evidence | Current status |
|---|---|---|
| TypeScript/build | `npm run build` exit 0 | Passed |
| Unit/regression | `npm test` exit 0 and critical-path counts parsed | Passed by exit code; parser reported unknown framework |
| Dependency security | `npm audit --omit=dev --audit-level=high` exit 0 | Passed |
| Browser smoke | Landing, auth, chat, model menu, settings, mobile navigation | Partial manual Playwright run; auth is client-only |
| API auth | PostgreSQL-backed register/login/refresh/logout/CSRF/RBAC integration suite | Blocked: no staging PostgreSQL configured |
| Persistence/RLS | Cross-user conversation/document isolation tests | Blocked: no staging PostgreSQL configured |
| AI provider | Mock-provider streaming, timeout, partial stream, retry, duplicate request tests | Not yet implemented |
| RAG benchmark | `evals/benchmark-v1.json` scored against a pinned provider/model | Not run: provider credentials unavailable |
| Security | Prompt injection, malicious upload, SSRF, XSS, unauthorized tool tests | Partial static/unit coverage; upload parser and tool registry are not complete |
| Performance | p95 latency, throughput, error rate, token/cost budget report | Not run: no provider/load environment |
| Accessibility | Keyboard traversal, focus visibility, semantic labels, automated axe scan | Manual semantic snapshot partial; automated axe not run |
| Backup/restore | Staging restore test and post-restore smoke test | Not run: no PostgreSQL environment |

## Budget thresholds

Set concrete values before production approval:

- API p95 non-model latency: <= 300 ms.
- Time to first model token p95: <= 3 seconds.
- Chat error rate: < 1% over a 30-minute canary.
- Stream interruption recovery: >= 99% of resumable streams.
- Cost per successful benchmark task: defined per model route and plan.
- Critical-path automated test coverage: >= 90%.
- Critical or high security findings: 0 unaccepted.

## Release decision

The release manager signs off only when all red or blocked gates are resolved, benchmark scores meet the target for the selected task set, and rollback plus restoration evidence is attached to the release.
