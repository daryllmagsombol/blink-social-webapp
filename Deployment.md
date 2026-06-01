# Deployment Plan

Target: one Azure Linux VM running both apps with Docker Compose, PostgreSQL in Docker, nginx in front, Cloudflare already handling public DNS.

## What Runs Where

- `blink-social-media`: `apps/server`, `apps/web`, shared packages, and local uploads volume.
- PostgreSQL: single container on the VM with persistent volume.
- nginx: public entrypoint for `blink.darjosh.dev`

## Implementation Plan

1. Build production images for each app.
2. Keep app config env-driven, not `localhost`-driven.
3. Run PostgreSQL as a persistent container.
4. Route each domain through nginx to its own web app and API.
5. Keep backend ports private inside Docker.
6. Add HTTPS origin support for Cloudflare Full (strict).
7. Validate migrations, auth, uploads, and restart behavior.

## VM Runbook

1. Provision Ubuntu LTS VM in Azure.
   - **Minimum SKU**: `Standard_B2s` (2 vCPU, 4 GB RAM).
   - `B1s` (1 GB RAM) is insufficient — `pnpm install` will exhaust memory and hang.
2. Open NSG for `22` from your IP only, `80` and `443` from Internet.
3. Install Docker (v24+ with BuildKit — required for cache mounts).
4. Install Docker Compose plugin, git, and nginx tooling.
5. Create `.env` or `.env.prod` from `deploy/azure-vm/.env.example`.
6. Start PostgreSQL first, then run Prisma migrations.
7. Start app services.
8. Put nginx in front and verify both domains.
9. Set Cloudflare SSL mode to `Full (strict)`.
10. Check logs with `docker compose logs -f`.

### Troubleshooting

**Build hangs during `pnpm install`**
- Verify VM memory: `free -h` (need ≥ 4 GB total).
- Ensure Docker BuildKit is enabled: `docker buildx ls` should show a default builder.
- The Dockerfiles use `--mount=type=cache,target=/pnpm/store` so the pnpm store is cached on disk across rebuilds. The first build will be slow; subsequent builds will be much faster (cache hits → `reused` > 0).
- If the VM is still struggling, lower concurrency further by editing the Dockerfiles: change `--config.workspace-concurrency=1` to `--config.workspace-concurrency=1 --config.network-concurrency=2`.

## GitHub Trigger

- On `push` to `main`, GitHub Actions can SSH into the VM and run `docker compose up -d --build` for changed services.
- Add a `workflow_dispatch` trigger too, so you can deploy by clicking button in GitHub.
- Use repo secrets for `AZURE_VM_HOST`, `AZURE_VM_USER`, `AZURE_VM_SSH_KEY`, and `DEPLOY_ROOT`.
- `DEPLOY_ROOT` should be the parent folder that contains both repos, for example `/opt/apps`.

## Current Files

- [deploy/azure-vm/docker-compose.yml](deploy/azure-vm/docker-compose.yml)
- [deploy/azure-vm/nginx.conf](deploy/azure-vm/nginx.conf)
- [deploy/azure-vm/postgres-init.sql](deploy/azure-vm/postgres-init.sql)
- [deploy/azure-vm/.env.example](deploy/azure-vm/.env.example)

## Notes

- Cloudflare already handles DNS, so no DNS work here.
- If uploads need durability later, move them to Azure Blob Storage.
- If availability becomes important, move PostgreSQL to Azure Database for PostgreSQL.
