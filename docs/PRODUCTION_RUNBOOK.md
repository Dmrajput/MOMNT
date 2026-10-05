# Production runbook

Version 1.0.0. Replace hostnames with the ones you actually configure.

## Deploy

Follow `docs/DEPLOYMENT.md`. Deploy the API first, confirm readiness, then deploy the frontend.

## Environment

Required API variables: `NODE_ENV`, `PORT`, `MONGODB_URI`, `CLIENT_URL`, `JWT_SECRET`, `UPI_ID`, `UPI_NAME`, `PAYMENT_EXPIRY_MINUTES`.

Also used: `ADMIN_CLIENT_URL`, `COOKIE_SAMESITE`, `TRUST_PROXY`, `MAINTENANCE_MODE`, `TICKET_PUBLIC_BASE_URL`, `BUSINESS_NAME`, `BUSINESS_EMAIL`, `SUPPORT_PHONE`.

Frontend: `VITE_API_BASE_URL` only.

Admin sessions use `JWT_SECRET`. `SESSION_SECRET` is listed in the example and is not read by the server.

## Health

- `GET /api/health/live` — process up
- `GET /api/health/ready` — database and configuration
- `GET /api/health` — environment and version

The admin header shows Development, Staging, or Production from that endpoint.

## Logs

Each request logs JSON with `requestId`, method, path, status, and duration. The response header `X-Request-ID` matches the log. Search logs by that id when a customer reports an error. Do not ask customers to send screenshots of admin cookies.

## Payment problem

If a guest says they paid and have no ticket:

1. Find the booking and payment in admin. Do not ask them to pay again yet.
2. If status is `verification_pending`, verify the UTR against the business account, then use Verify.
3. If status is already `paid` and the booking is `confirmed` but the ticket is missing, the integrity report will flag `PAID_TICKET_MISSING`. Generate the ticket with the existing ticket service. It is idempotent for a booking that already has one.
4. If the UTR is not in the account, leave the payment unverified.

Verification is manual. Submitting a UTR does not mark a payment paid.

## Ticket or check-in problem

If the scanner or network fails, say "Unable to verify ticket." Look up the ticket id manually only while the API is reachable. Do not mark anyone checked in without a successful API response. There is no offline check-in mode.

## Maintenance

Set `MAINTENANCE_MODE=1` to block new public booking and payment writes. Leave it at `0` for normal operation. Admin and health checks stay up.

## Rollback

Redeploy the previous frontend `dist` and the previous API release. Leave the database in place. See `docs/INCIDENT_RESPONSE.md`.
