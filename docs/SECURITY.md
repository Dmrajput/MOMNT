# MOMNT security

## Authentication

Customers do not have accounts. A booking or ticket link is the customer access model, and public responses omit the QR token, email, mobile number, and UTR.

Admins authenticate with email and password. The password is hashed with bcrypt at cost 12. Login failures always return "Invalid email or password." The session is a JWT in the `HttpOnly` cookie `momnt_admin` (8 hours, issuer `momnt-admin`). A CSRF cookie `momnt_admin_csrf` is not `HttpOnly`; state-changing admin requests must send the same value in `X-CSRF-Token`. Production cookies are `Secure`. `SameSite` defaults to `strict` in production and `lax` otherwise.

## Authorization

Every `/api/admin/*` route requires a valid admin cookie. Missing cookie: 401. A signed-in role without the required permission: 403. `PAYMENT_MANAGER` cannot check in or manage events. `CHECK_IN_MANAGER` cannot verify payments or export financial reports. `ADMIN` does not receive `SUPER_ADMIN`-only actions such as creating other admins. The React route guard is a convenience. The API enforces access.

## Cookies, CORS, and CSRF

Production CORS allows only `CLIENT_URL` and `ADMIN_CLIENT_URL`. `origin: "*"` is not used. CSRF applies to admin `POST`, `PATCH`, and `DELETE`. Public booking and payment routes do not use cookies.

## Rate limiting

Admin login, booking creation, payment creation, UTR submission, ticket reads, ticket validation, and check-in are limited. Limits are skipped when `NODE_ENV=test`. A global limit is not applied to ordinary page traffic.

## Input and database

Request bodies and queries are validated with zod. Keys containing `$`, `.`, or `[` are rejected. Controllers build explicit query objects. User objects are never passed straight to `Model.find`.

## Payments and tickets

The server recalculates price, fee, and total. A client-supplied amount or `paid` status is ignored. Submitting a UTR moves a payment to `verification_pending`. It does not mark it paid. Only an authorized admin can verify or reject. Duplicate UTRs are rejected. Tickets are generated only after a verified payment. QR tokens are random, unique, and omitted from normal ticket responses. Check-in is an atomic status change from `active` to `checked_in`.

## Secrets and logs

Secrets belong in the host's environment manager. Request logs include a request id, method, path, status, and duration. They do not include query strings, passwords, cookies, or full UTRs. Connection strings in error messages are redacted. Production 500 responses use `INTERNAL_SERVER_ERROR` and do not include stack traces.

## Headers

Helmet sets baseline headers. HSTS and a restrictive Content-Security-Policy are enabled only when `NODE_ENV=production`, so local HTTP development is not forced onto HTTPS. Confirm the production CSP still allows the API, ticket QR images, and the check-in camera after the first deploy.

## What this document does not claim

This repository has not been deployed. HTTPS, a public domain, provider backups, and a restore drill have not been verified on a live host. Dependency review is recorded from `npm audit` at the time of the Phase 8 run, not from a penetration test.
