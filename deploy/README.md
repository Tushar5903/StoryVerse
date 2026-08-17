# StoryVerse - production deployment notes

Single-instance app. The Caffeine caches, the in-memory rate limiter and the
Cloudinary/async mail state are per-JVM - do NOT run multiple app instances
without moving caches to Redis and the rate limiter to a shared store.

## Required environment variables (backend, via StoryVerse/.env)

| Variable | Value | Why |
|---|---|---|
| `DB_URL` | `jdbc:mysql://127.0.0.1:3306/storyverse_db?createDatabaseIfNotExist=true` | MySQL JDBC URL |
| `DB_USERNAME` / `DB_PASSWORD` | real DB credentials | |
| `JWT_SECRET` | long random string (`openssl rand -base64 48`) | JWT signing |
| `MAIL_USERNAME` / `MAIL_PASSWORD` | SMTP account | OTP + reset emails |
| `CLOUDINARY_CLOUD_NAME` / `API_KEY` / `API_SECRET` | Cloudinary account | uploads |
| `TRUSTED_PROXIES` | nginx server IP, e.g. `127.0.0.1` | **Mandatory** - empty means the rate limiter collapses every client behind the proxy into one bucket |
| `SWAGGER_ENABLED` | `false` | hide Swagger UI in prod |
| `PUBLIC_BASE_URL` | `https://storyverse.example.com` | used in reset-password email links |
| `CORS_ALLOWED_ORIGINS` | `https://storyverse.example.com` | the frontend origin |

Optional: `JWT_ACCESS_MINUTES` (default 30), `OTP_TTL_SECONDS`, `RATE_LIMIT_*`,
`CACHE_SPEC`, `DB_POOL_MAX`, `APP_LOG_LEVEL`.

## Frontend

`FRONTEND/.env.production` must contain:
- `VITE_API_URL=https://storyverse.example.com/api` (no trailing slash, must match
  `CORS_ALLOWED_ORIGINS` origin)

Build once: `npm run build` in `FRONTEND/` -> upload `FRONTEND/dist` to the nginx root.

## Serving (see nginx.conf)

- static files: `FRONTEND/dist` with `assets/*` cached `immutable 1y`, `index.html` `no-cache`
- `/api/*` proxied to `127.0.0.1:8082`
- gzip (or brotli) on; TLS 1.2+; `client_max_body_size 12m`

## MySQL (see mysql.cnf)

- buffer pool = 50-70% of RAM
- `innodb_ft_min_token_size = 3` + FULLTEXT index rebuild for 3-letter search terms
- slow query log on (threshold 1s)

## JVM

```
java -Xms256m -Xmx512m -XX:+UseG1GC -XX:MaxGCPauseMillis=200 -jar storyverse.jar
```

## Monitoring

- `/actuator/health` - uptime checks (add `management.endpoint.health.probes.enabled=true`
  for k8s-style liveness/readiness probes)
- `/actuator/metrics` - JVM/DB counters
- MySQL slow query log + nginx access log (`$request_time`)

## First-run checks

1. `TRUSTED_PROXIES` set, restart, verify: register an OTP twice quickly from one
   browser - the second must still be allowed (not rate-limited by IP collapse).
2. `PUBLIC_BASE_URL` set, request a password reset and click the emailed link - it
   must land on `/reset-password?token=...` on the real domain.
3. Books list page loads with `Cache-Control: public, max-age=30` on `/api/books*`.
