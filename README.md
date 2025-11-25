# BillingSystem

`BillingSystem/` is an umbrella directory that houses two completely decoupled NestJS services. Each lives in its own folder, has its own Dockerfile, and can be promoted to an independent git repository at any time.

- `subscription-service` – manages users, plans, subscriptions, renewals and admin dashboards.
- `payment-service` – handles payment orchestration and processor simulations.

A shared `docker-compose.yml` is provided to spin up both APIs alongside their own PostgreSQL databases. It also has a redis db that has been used to mock the payment gateway, a queue system using rebbitMq and test cases services that exits afte runing the test cases.

## Prerequisites

- Node.js 18+ and npm 10+ (only needed if you plan to run a service locally)
- Docker Desktop (or Docker Engine + Compose V2)
- PlantUml extensions and graphviz on your machine.

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

### Run test cases only
```bash
cd subscription-service
npm run build
npm run test-only:e2e
```

Exposed endpoints (defaults can be changed in `.env`):

- Subscription API → http://localhost:3001
- Subscription Postgres → localhost:5432
- Payment API → http://localhost:3002
- Payment Postgres → localhost:5433
- Swagger Docs for Subscription Api → http://localhost:3001/docs
- Swagger Docs for Payment Api → http://localhost:3002/docs


Stop everything with `docker compose down`. Append `-v` if you want to drop the persistent database volumes.

## Environment Variables

- `.env.example` lists every variable the compose file consumes.
- Each service loads configuration via `@nestjs/config`, so adding service-specific keys requires no extra wiring.

Key groups:

- `SUBSCRIPTION_*` variables scope the subscription service and its database.
- `PAYMENT_*` variables scope the payment service and its database.
- `BYPASS_TEST_DB_RESET=true` tells both services to detect the test environment but skip TypeORM `dropSchema`, which preserves seed data when you run the test containers through `docker compose up --build`.


## Repository Layout
```
BillingSystem/
├── subscription-service/   # Independent NestJS project + Dockerfile
├── payment-service/        # Independent NestJS project + Dockerfile
├── docker-compose.yml      # Spins up both services + dedicated Postgres DBs
├── .env.example  
├── docs                    # Plant uml
└── README.md
```

### Tech stack and tools
BillingSystem/
|── subscription-service
|       |- NestJS + TypeOrm + Supertest
|       |- PostgresSQL
|       |- Redis
|       |- RabbitMQ
|── payment-service
|       |- NestJS + TypeOrm + Supertest
|       |- Redis

## Git Hooks
A tracked pre-commit hook lives in `.git/hooks/pre-commit`. It runs the full E2E suites for both services (`npm run test-only:e2e` inside `subscription-service/` and `payment-service/`) before every commit so broken builds never land.

## Architecture Diagram
A PlantUML diagram describing the end-to-end topology lives at `docs/architecture.puml`. Render it with any PlantUML-compatible tool (VS Code plugin, IntelliJ plugin, or the CLI). Example using the PlantUML CLI:

```bash
plantuml docs/SubscriptionAndLogin.puml
plantuml docs/DowngradeSubscription.puml
plantuml docs/UpgradeSubscription.puml
```
The diagram highlights how the subscription and payment services exchange HTTP requests, RabbitMQ messages, and interact with their dedicated Postgres + Redis instances.

## API FLOWS
    New users => User login -> update profile -> get quote -> initiate payment -> Create pending subscription -> initiate payment on paymentService -> receives webhook from paymentService -> Validate charges amount with plan -> update subscription

    Upgrade => User login -> get upgrade quote -> Update subscription confirm -> New pending subscription -> init payment on paymen service with amount difference -> receives webhook from paymentService -> Validate charges amount with plan -> update subscription


    Downgrade => User login -> get downgrade quote -> downgrade subscription confirm -> new pending subscription with inactive state -> picked by renewal cron -> Deactivate old subscription -> initiate payment with new plan price on payment service -> receives webhook from paymentService -> Validate charges amount with plan -> update subscription


    Cancel =>  User login -> cancel -> subscription confirm -> new pending subscription with inactive state -> picked by renewal cron -> check status subscription status -> mark active active subscription as inactive

## Key User Api and curls
    - Register and login
        The user is expected to login using either mobile or email and with a passoword that is store on the backed as hashkeys. Upon login, the same is retrieved and check for validation. Mobile and Email are unique in the system.
            curl -X 'POST' \
            'http://localhost:3001/login' \
            -H 'accept: */*' \
            -H 'Content-Type: application/json' \
            -d '{
            "mobile": "9599241900",
            "password": "DevInPlace"
            }'

        The user will be registered the first time and login with same credentials to get a token generated using JWT and is the point of reference to be used in entire project. This token should be passed on in every request as Bearer token and is valid for 2 hours.
        
        Key "isProfileComplete" in response indicates if the user has provided both "email" and "mobile" or not. If this key is false, user will be blocked to subscribe any plan.
                
    - Update Profile update
        Once the login is complete, the user will be able to fetch thier profile and update their profile.
        
        Profile Get
            curl -X 'GET' \
            'http://localhost:3001/users/profile' \
            -H 'accept: */*' \
            -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiIiwidXNlcklkIjozLCJtb2JpbGUiOiJSaXNoYWJoIiwiZW1haWwiOiIiLCJ1c2VyVHlwZSI6ImN1c3RvbWVyIiwiaWF0IjoxNzY0MDc2MzAxLCJleHAiOjE3NjQwODM1MDF9.zDhIFU07P7qQFIpyiVezeWa-arNFEhT3Rg0F1BFNP84'
        
        Update Profile
            curl -X 'PATCH' \
            'http://localhost:3001/users/profile' \
            -H 'accept: */*' \
            -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiIiwidXNlcklkIjozLCJtb2JpbGUiOiI5NTk5MjQxOTAwIiwiZW1haWwiOiIiLCJ1c2VyVHlwZSI6ImN1c3RvbWVyIiwiaWF0IjoxNzY0MDc2OTcxLCJleHAiOjE3NjQwODQxNzF9.u5nbgSPjSqH7VeTIkUqIz6qlIwzAMjEA_-w6MzlCje0' \
            -H 'Content-Type: application/json' \
            -d '{
            "name": "Rishabh",
            "age": 34,
            "bio": "My awesome bio",
            "email": "rishabh.bisht2302@gmail.com"
            }'

        update profile api will return "updatedToken" key which should be updated on client side to make sure the changes are reflected in token as well.

    - Get Available Plans
        User can request to see all the available plans in the system. Following api will return the active as well as available plan that user can subscribed to or upgrade/downgrade
        Get all available plans(with pagination)
            curl -X 'GET' \
            'http://localhost:3001/plans/active?limit=20&offset=1' \
            -H 'accept: */*' \
            -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiIiwidXNlcklkIjozLCJtb2JpbGUiOiI5NTk5MjQxOTAwIiwiZW1haWwiOiIiLCJ1c2VyVHlwZSI6ImN1c3RvbWVyIiwiaWF0IjoxNzY0MDc2OTcxLCJleHAiOjE3NjQwODQxNzF9.u5nbgSPjSqH7VeTIkUqIz6qlIwzAMjEA_-w6MzlCje0'
            
    - Get Payment Quote
        Authenticated users can estimate the amount needed to subscribe to a plan or upgrade/downgrade.
            curl -X 'GET' \
            'http://localhost:3001/plans/quote?targetPlanId=2' \
            -H 'accept: */*' \
            -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiIiwidXNlcklkIjozLCJtb2JpbGUiOiI5NTk5MjQxOTAwIiwiZW1haWwiOiIiLCJ1c2VyVHlwZSI6ImN1c3RvbWVyIiwiaWF0IjoxNzY0MDc2OTcxLCJleHAiOjE3NjQwODQxNzF9.u5nbgSPjSqH7VeTIkUqIz6qlIwzAMjEA_-w6MzlCje0'

    - Initiate Payment
        Begin a checkout session for a selected plan.
            curl -X 'POST' \
            'http://localhost:3001/payment/initiate' \
            -H 'accept: */*' \
            -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiIiwidXNlcklkIjozLCJtb2JpbGUiOiI5NTk5MjQxOTAwIiwiZW1haWwiOiIiLCJ1c2VyVHlwZSI6ImN1c3RvbWVyIiwiaWF0IjoxNzY0MDc2OTcxLCJleHAiOjE3NjQwODQxNzF9.u5nbgSPjSqH7VeTIkUqIz6qlIwzAMjEA_-w6MzlCje0' \
            -H 'Content-Type: application/json' \
            -d '{
            "planId": 2,
            "amount": 2499,
            "gateway": "razorpay",
            "planName": "Professional",
            "subscriptionId": 10 // null initially
            }'

    - Payment Webhook
        Simulate a callback from the payment provider to finalize the subscription.
            curl -X 'POST' \
            'http://localhost:3001/payment/webhook' \
            -H 'accept: */*' \
            -H 'Content-Type: application/json' \
            -d '{
            "subscriptionId": 10,
            "paymentId": 12345,
            "transactionId": "txn_987",
            "paymentStatus": "success",
            "amount": 2499,
            "mandateId": "mandate_123",
            "paymentMethodToken": "token_987",
            "receiptUrl": "https://example.com/receipt",
            "metaData": {
                "gateway": "razorpay"
            }
            }'

    - Cancel Subscription
        Users can cancel their active subscription with a reason.
            curl -X 'PATCH' \
            'http://localhost:3001/subscription/update' \
            -H 'accept: */*' \
            -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiIiwidXNlcklkIjozLCJtb2JpbGUiOiI5NTk5MjQxOTAwIiwiZW1haWwiOiIiLCJ1c2VyVHlwZSI6ImN1c3RvbWVyIiwiaWF0IjoxNzY0MDc2OTcxLCJleHAiOjE3NjQwODQxNzF9.u5nbgSPjSqH7VeTIkUqIz6qlIwzAMjEA_-w6MzlCje0' \
            -H 'Content-Type: application/json' \
            -d '{
            "action": "cancel",
            "reason": "Found a better plan"
            }'

## Admin dashboard apis
    - Generate Admin Token
        Admin dashboards call this helper to get a service JWT for further calls.
            curl -X 'POST' \
            'http://localhost:3001/auth/token' \
            -H 'accept: */*'

    - List Users
        Fetch paginated/filterable user data for management screens.
            curl -X 'GET' \
            'http://localhost:3001/users?isActive=true&minAge=18&maxAge=45' \
            -H 'accept: */*' \
            -H 'Authorization: Bearer <ADMIN_TOKEN>'

    - Create User
        Seed new accounts on behalf of support teams.
            curl -X 'POST' \
            'http://localhost:3001/users' \
            -H 'accept: */*' \
            -H 'Authorization: Bearer <ADMIN_TOKEN>' \
            -H 'Content-Type: application/json' \
            -d '{
            "name": "Dashboard User",
            "email": "dashboard.user@example.com",
            "mobile": "1234567890",
            "password": "Password123!",
            "userType": "admin",
            "age": 32,
            "bio": "Created from dashboard"
            }'

    - Update User
        Modify profile details or toggle activation state.
            curl -X 'PUT' \
            'http://localhost:3001/users/15' \
            -H 'accept: */*' \
            -H 'Authorization: Bearer <ADMIN_TOKEN>' \
            -H 'Content-Type: application/json' \
            -d '{
            "name": "Updated User",
            "isActive": false
            }'

    - Delete User
        Soft-delete/deactivate users when required.
            curl -X 'DELETE' \
            'http://localhost:3001/users/15' \
            -H 'accept: */*' \
            -H 'Authorization: Bearer <ADMIN_TOKEN>'

    - List Plans
        Show all plans (active, inactive, promotional, etc.).
            curl -X 'GET' \
            'http://localhost:3001/plans?isActive=true&limit=20&offset=0' \
            -H 'accept: */*' \
            -H 'Authorization: Bearer <ADMIN_TOKEN>'

    - Create Plan
        Add new plans from the dashboard.
            curl -X 'POST' \
            'http://localhost:3001/plans' \
            -H 'accept: */*' \
            -H 'Authorization: Bearer <ADMIN_TOKEN>' \
            -H 'Content-Type: application/json' \
            -d '{
            "planName": "Enterprise",
            "price": 4999,
            "validityInDays": 90,
            "isNew": true,
            "isPromotional": false,
            "descriptionOfPlan": "Enterprise tier with all add-ons"
            }'

    - Update Plan
        Patch pricing or metadata without recreating the plan.
            curl -X 'PUT' \
            'http://localhost:3001/plans/5' \
            -H 'accept: */*' \
            -H 'Authorization: Bearer <ADMIN_TOKEN>' \
            -H 'Content-Type: application/json' \
            -d '{
            "price": 4499,
            "isPromotional": true
            }'

    - Delete Plan
        Soft-delete a plan to hide it from users.
            curl -X 'DELETE' \
            'http://localhost:3001/plans/5' \
            -H 'accept: */*' \
            -H 'Authorization: Bearer <ADMIN_TOKEN>'

    - List Subscriptions
        Review all subscriptions with optional filters for activity/date ranges.
            curl -X 'GET' \
            'http://localhost:3001/subscription/all?isActive=true&from=2024-01-01&to=2024-12-31' \
            -H 'accept: */*' \
            -H 'Authorization: Bearer <ADMIN_TOKEN>'

## Assumptions made
    - Each subscription is uniquely tied to one email + mobile combination to avoid duplicate identities.
    - Users must finish their profile (email + mobile + optional metadata) before they are allowed to purchase or upgrade plans.
    - System roles are currently limited to two buckets: `customer` and `admin`. Additional roles would require code/config changes.
    - All monetary values are denominated in USD; currency conversion is out of scope for this release.
    - The mocked payment service may respond with either `success` or `failed`, and other statuses (refunds/disputes) are   simulated in tests only.
    - Scheduled cron jobs (renewals, etc) run once per day using the configured NestJS scheduler.
    - 90% of payments will be Successful
    - Failed refund cases are delegated to an external back-office service that consumes the `refund-failures` queue and reconciles payouts asynchronously.
    - Downgrades are scheduled for the next billing cycle, while upgrades settle the price delta immediately and extend the subscription expiry in real time.


## Scope of expansion
- **Repository split:** Promote `subscription-service/` and `payment-service/` into standalone repos (or submodules) so each team can release independently.
- **Production-grade payments:** Replace the mocked payment adapters with real PSP integrations (webhooks, retries, reconciliation).
- **Advanced subscription lifecycle:** Add proration, scheduled plan changes, trial management, and richer downgrade logic.
- **Observability:** Layer in structured logging, distributed tracing, and dashboards for cron jobs, queues, and webhook processing.
- **Hardening and governance:** Introduce role-based access control beyond admin/customer, audit logs, and security scanners.
- **Continuous verification:** Extend the current E2E suites with integration tests that run inside the docker topology plus contract tests between services.

