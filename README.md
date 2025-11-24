# BillingSystem

`BillingSystem/` is an umbrella directory that houses two completely decoupled NestJS services. Each lives in its own folder, has its own Dockerfile, and can be promoted to an independent git repository at any time.

- `subscription-service` – manages customers, plans, and entitlements.
- `payment-service` – handles payment orchestration and processor simulations.

A shared `docker-compose.yml` is provided to spin up both APIs alongside their own PostgreSQL databases.

## Prerequisites

- Node.js 18+ and npm 10+ (only needed if you plan to run a service locally)
- Docker Desktop (or Docker Engine + Compose V2)

## Bootstrap

```bash
git clone <parent-repo-or-create-folder> BillingSystem
cd BillingSystem
cp .env.example .env
```

### Work on a single service

Each service is self-contained. From inside its directory you can:

```bash
cd subscription-service
npm install
npm run start:dev
```

Do the same inside `payment-service/` for payment APIs. Because dependencies, configs, and Dockerfiles are scoped per service, you can copy either folder into its own git repository without changes.

### Run the whole stack

```bash
docker compose up --build
```

Exposed endpoints (defaults can be changed in `.env`):

- Subscription API → http://localhost:3001
- Subscription Postgres → localhost:5432
- Payment API → http://localhost:3002
- Payment Postgres → localhost:5433

Stop everything with `docker compose down`. Append `-v` if you want to drop the persistent database volumes.

## Environment Variables

- `.env.example` lists every variable the compose file consumes.
- Each service loads configuration via `@nestjs/config`, so adding service-specific keys requires no extra wiring.

Key groups:

- `SUBSCRIPTION_*` variables scope the subscription service and its database.
- `PAYMENT_*` variables scope the payment service and its database.

## Repository Layout

```
BillingSystem/
├── subscription-service/   # Independent NestJS project + Dockerfile
├── payment-service/        # Independent NestJS project + Dockerfile
├── docker-compose.yml      # Spins up both services + dedicated Postgres DBs
├── .env.example            # Shared environment template
└── README.md
```

## Git Hooks

A tracked pre-commit hook lives in `.githooks/pre-commit`. It runs the full E2E suites for both services (`npm run test-only:e2e` inside `subscription-service/` and `payment-service/`) before every commit so broken builds never land.

Enable it once per clone:

```bash
git config core.hooksPath .githooks
```

## Next Steps

- Initialize separate git repositories per service (run `git init` inside each folder or promote them to their own remote repos).
- Implement real subscription and payment modules.
- Add integration tests that exercise the dockerized topology.
