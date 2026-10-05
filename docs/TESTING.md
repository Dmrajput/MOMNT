# Testing

The automated suite is Node's built-in test runner plus Supertest, using an in-memory MongoDB replica set. Vitest, React Testing Library, and Playwright are not installed. Do not treat a manual browser pass as an automated end-to-end result.

## Commands

From `server`:

```bash
npm ci
npm test
```

From the repository root:

```bash
npm ci
npm run build
npm audit
```

`npm test` in `server` runs booking, payment, ticket, admin, and production checks with `--test-concurrency=1`. `NODE_ENV=test` disables rate limits.

## What the suite covers

- Price calculation, capacity, duplicate booking protection, and status rules
- Payment creation that ignores a client amount, UTR submit, duplicate UTR, verify, and reject
- Ticket generation only after payment, QR validation, and atomic check-in
- Admin login, roles, CSRF, and dashboard access
- Health, readiness, liveness, 404 shape, anonymous admin 401, and production CORS

## What is still manual

Run these on staging, not production:

- Full booking, UPI transfer, UTR, admin verify, ticket, and check-in
- Mobile widths 360, 390, and 414, plus desktop
- Camera permission on the check-in page only
- Refresh and back during booking and payment, confirming no duplicate booking

A Cursor browser session previously exercised admin login, verify, and check-in on the local development database. That is not a Playwright run and not a production test.

## Staging event

Create a draft or published test event in the staging database only. Do not seed it into production. `npm run seed` upserts MOMNT #01 and nothing else. Production refuses that script unless `SEED_PRODUCTION=1`.
