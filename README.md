# Exec Dashboard Local workflow

Since the Exec Dashboard depends on other ACM services, this repo root contains a `docker-compose` setup to conveniently run the dashboard and its dependencies locally.

The `Makefile` provides commands for ease of use.

## Services in local compose

- `exec-frontend`
- `exec-backend`
- `postgres`
- `kartana`
- `membership-portal`

Only exec-dashboard frontend and backend are exposed to the host.

## Quick start

1. Configure compose env:

   ```bash
   cp .env.compose.example .env.compose
   # Edit as needed
   ```

2. Configure backend env:

   ```bash
   cp backend/.env.example backend/.env
   # Edit as needed
   ```

3. Ensure dependent service env files exist:
   - `../kartana/.env`
   - `../membership-portal/.env`

   If your local paths differ, update `KARTANA_ENV_FILE` and `MEMBERSHIP_PORTAL_ENV_FILE` in `.env.compose`.

   For Kartana in this stack, set `GOOGLE_SHEETS_KEY_FILE` to a JSON string in `../kartana/.env`.

4. Start stack using remote Kartana/Membership Portal images:

   ```bash
   make up
   ```

   `make up` always rebuilds Exec Dashboard images (`exec-backend`, `exec-frontend`).

## Use local images

Set local build contexts in `.env.compose`, then run:

```bash
make up-local
```

This uses `docker-compose.build.yml` and rebuilds local images for Exec Dashboard, Kartana, and Membership Portal.

## Env ownership

- `.env.compose` is for compose wiring only (ports, image tags, build contexts, env-file paths).
- `backend/.env` is for Exec Dashboard backend runtime config/secrets.
- `../kartana/.env` is for Kartana runtime config/secrets.
- `../membership-portal/.env` is for Membership Portal runtime config/secrets.

When the same key appears in both `env_file` and compose `environment`, the compose `environment` value wins. This is only used for container-network overrides like internal hostnames and DB URLs.

Membership Portal is overridden to use Docker Postgres networking (`RDS_HOST=postgres`, `RDS_PORT=5432`) and shared Postgres credentials from compose.
