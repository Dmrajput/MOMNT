# MOMNT deployment

This document is host-agnostic. No hosting provider has been selected, and this repository has not been deployed to a public domain.

## Architecture

Use one frontend deployment. Admin lives at `/admin` on the same site.

- Public site: `https://momnt.example`
- API: `https://api.momnt.example`
- Database: managed MongoDB, reachable only from the API

Do not publish a separate admin domain unless you also set `ADMIN_CLIENT_URL` and `COOKIE_SAMESITE=none`. Split hosts require HTTPS and `SameSite=None` cookies. A reverse proxy that serves `/api` on the same host as the frontend can keep `SameSite=Lax`.

## Environments

Keep three isolated sets of variables: development, staging, and production. Commit only `.env.example` and `server/.env.example`. Store real values in the host's secret manager.

Staging must use its own database, API, frontend URL, and UPI configuration. Never point staging at the production database.

## Frontend

1. Set `VITE_API_BASE_URL` to the public API base, for example `https://api.momnt.example/api`.
2. Install with `npm ci`.
3. Run `npm test` inside `server` and `npm run build` at the repository root.
4. Deploy the `dist` directory.
5. Rewrite every client route to `index.html`, including `/experiences/*`, `/booking`, `/payment`, `/ticket/*`, and `/admin/*`.
6. Attach the domain and enable HTTPS at the host.
7. Confirm the built site calls the production API and not `localhost`.

`VITE_*` values are visible in the browser. Do not put the MongoDB URI, JWT secret, or any private key there.

## Backend

1. Set the variables listed in `server/.env.example`. Use a long random `JWT_SECRET`. Do not use the placeholder.
2. Set `NODE_ENV=production`, `CLIENT_URL` to the exact frontend origin, and `TRUST_PROXY=1` only when a reverse proxy sets `X-Forwarded-*`.
3. Install with `npm ci` inside `server`.
4. Start with `npm start` (`node server.js`). Do not use nodemon.
5. Let the platform restart the process. PM2 is optional and only needed on a VPS the platform does not supervise.
6. Confirm `GET /api/health/live` returns 200 and `GET /api/health/ready` returns 200.
7. Confirm an unknown origin does not receive `Access-Control-Allow-Origin`.

`SESSION_SECRET` is reserved in the example file. Admin sessions are signed with `JWT_SECRET` and stored in the `momnt_admin` cookie. The application does not read `SESSION_SECRET`.

## MongoDB

Create a dedicated database user that can read and write only the MOMNT database. Do not use the cluster admin user in the application. Restrict network access to the API host. Enable TLS. Enable the provider's backups before opening bookings.

Run `npm run seed` only for the published MOMNT #01 event. In production the script refuses to run unless `SEED_PRODUCTION=1`. It does not create bookings, payments, tickets, or customers. Create the first admin separately with `npm run seed:admin` and rotate that password immediately from Profile.

## HTTPS and DNS

Point the site and API hostnames at the chosen platform with the records that platform documents (usually CNAME, sometimes A). Enable the platform certificate. Redirect HTTP to HTTPS. Cookies are `Secure` only when `NODE_ENV=production`.

## Health checks

- Liveness: `GET /api/health/live` — process is up. Do not tie this to MongoDB.
- Readiness: `GET /api/health/ready` — MongoDB connected and required production configuration present. Returns 503 otherwise.
- Status: `GET /api/health` — environment name and version `1.0.0`. It does not return secrets.

## Rollback

Record the deployed frontend and backend versions before release. If payment, booking, tickets, admin login, or check-in break, redeploy the previous build. Do not drop or rewrite the database to roll back. Schema changes in this release are additive indexes and response fields.
