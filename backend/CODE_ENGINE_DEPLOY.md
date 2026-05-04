# Code Engine Deployment Notes

This backend executes code through Piston. It is production-safe only when Piston is deployed as a managed service and all required runtimes are installed.

## Required runtimes

- `python@3.10.0`
- `java@15.0.2`
- `gcc@10.2.0` (used for `cpp`)

## Startup behavior

Backend startup is strict by default:

- `STRICT_ENGINE_STARTUP=true` (default) -> backend exits if required runtimes are missing
- `STRICT_ENGINE_STARTUP=false` -> backend starts and only warns

## Bring up services

From `backend`:

```bash
docker compose up -d piston piston-init
```

Then verify:

```bash
curl http://localhost:2000/api/v2/runtimes
```

You should see `python`, `java`, and `gcc`.

## If C++ runtime fails to install

Sometimes package download from GitHub can fail due to transient network issues. The compose file already retries installs in `piston-init`.

If runtime is still missing:

1. Check Piston logs:

```bash
docker compose logs piston --tail 200
```

2. Retry install manually:

```bash
curl -X POST http://localhost:2000/api/v2/packages \
  -H "Content-Type: application/json" \
  -d '{"language":"gcc","version":"10.2.0"}'
```

3. Recheck runtimes:

```bash
curl http://localhost:2000/api/v2/runtimes
```

## Production recommendation

- Host Piston near backend (same VPC/region)
- Keep package volume persisted (`./data/piston/packages` equivalent in prod)
- Monitor runtime availability and alert if `gcc/python/java` disappear
