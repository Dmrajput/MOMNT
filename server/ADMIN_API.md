# MOMNT Admin API

Internal routes for staff. Every route except login requires the `momnt_admin` HttpOnly cookie. Mutating requests also require the `X-CSRF-Token` header. The token is returned by login and `GET /api/admin/auth/me` because the admin site and API are on different ports in development.

Do not send a role, admin id, or payment status from the browser and expect the server to trust it. Permissions come from the admin record.

## Authentication

`POST /api/admin/auth/login`

```json
{ "email": "admin@example.com", "password": "..." }
```

Success sets `momnt_admin` (HttpOnly, 8 hours) and `momnt_admin_csrf`, and returns `{ success, admin, csrfToken }`. `admin` never includes `passwordHash`. Unknown emails and wrong passwords both return `401` with `Invalid email or password.` Failed attempts are limited to 5 per 15 minutes per IP. Successful requests are not counted. The limiter is skipped when `NODE_ENV=test`.

`POST /api/admin/auth/logout` clears both cookies and writes `ADMIN_LOGOUT`.

`GET /api/admin/auth/me` and `GET /api/admin/auth/session` return the current admin and a CSRF token. A missing, expired, or revoked session returns:

```json
{ "success": false, "error": { "code": "UNAUTHORIZED", "message": "Your admin session has expired. Please sign in again." } }
```

Changing the password increments `tokenVersion`, so older cookies stop working.

Cookies are `Secure` only when `NODE_ENV=production`. `SameSite` defaults to `strict` in production and `lax` otherwise (`COOKIE_SAMESITE`). A split admin host and API host may need `lax`.

## Roles

| Role | Access |
| --- | --- |
| SUPER_ADMIN | Everything below |
| ADMIN | Dashboard, events, bookings, payments, tickets, customers, check-in, reports, settings, profile |
| EVENT_MANAGER | Events (including edit), bookings, tickets, customers, check-in, profile |
| PAYMENT_MANAGER | Bookings, payments (including verify and reject), customers, payment reports, profile |
| CHECK_IN_MANAGER | Tickets, check-in, profile. No customer contact fields and no financial export |

Cancel event, cancel booking, and cancel ticket require `SUPER_ADMIN` or `ADMIN`.

## Responses

Lists return:

```json
{ "success": true, "data": [], "pagination": { "page": 1, "limit": 20, "total": 0, "totalPages": 1 } }
```

`limit` is 20, 50, or 100. Search text is capped and characters `$` and `{` are removed. Query keys containing `$`, `[`, or `.` are rejected with `400`.

Errors use `{ success: false, error: { code, message } }`. Codes include `UNAUTHORIZED` 401, `FORBIDDEN` 403, `CSRF_INVALID` 403, `NOT_FOUND` 404, `CONFLICT` 409, `VALIDATION_ERROR` 400 or 422, `429`, and `SERVER_ERROR` 500. Stack traces are not returned.

## Endpoints

Dashboard: `GET /api/admin/dashboard?eventId=momnt-01`. Omit `eventId` or pass `all` for every event. Stats, recent activity, and the 14-day series are aggregated. Revenue counts bookings that are both `paid` and `confirmed`. Refunded totals are separate. Net revenue is gross minus refunded.

Events:

- `GET /api/admin/events` — names for filters. Revenue and price are omitted for roles without events, payments, or reports access.
- `POST /api/admin/events` — create. Requires event id, slug, number, title, location, date, start and end times (`11:00 AM`), price, and capacity.
- `GET /api/admin/events/:eventId`
- `PATCH /api/admin/events/:eventId` — price changes are audited. Existing booking totals are not rewritten. Capacity below the booked quantity returns `409`.
- `POST /api/admin/events/:eventId/cancel` — status becomes `cancelled`. Bookings are kept.
- `POST /api/admin/events/:eventId/duplicate` — creates a draft. There is no hard delete.

Bookings: `GET /api/admin/bookings`, `GET /api/admin/bookings/:bookingId`, `POST /api/admin/bookings/:bookingId/cancel`. Search matches booking id, name, email, mobile, ticket id, and an exact uppercase UTR.

Payments: `GET /api/admin/payments`, `GET /api/admin/payments/:paymentId`.

`POST /api/admin/payments/:paymentId/verify` calls the existing payment service inside a transaction: payment `paid`, booking `confirmed`, ticket generated if missing. A second verify returns `409`.

`POST /api/admin/payments/:paymentId/reject` body `{ "reason": "UTR not found", "detail": "" }`. Reasons: UTR not found, Incorrect amount, Duplicate transaction, Wrong account, Suspicious payment, Other (detail required). Payment becomes `failed` and the booking returns to `payment_pending`.

Tickets: `GET /api/admin/tickets`, `GET /api/admin/tickets/:ticketId`, `POST /api/admin/tickets/:ticketId/cancel`, `POST /api/admin/tickets/:ticketId/check-in`. Check-in updates `active` to `checked_in` atomically. A second check-in returns `409`.

Customers: `GET /api/admin/customers`, `GET /api/admin/customers/:customerId`. The id is a hash of the email, not the email itself.

Check-in:

- `GET /api/admin/check-in/stats?eventId=momnt-01`
- `POST /api/admin/check-in/validate` with `{ "token": "..." }` or `{ "ticketId": "MOMNT-01-XXXXXX" }`. This does not check the guest in. An unknown code returns `valid: false` without saying whether a similar ticket exists.

Reports, for roles with `reports`: `GET /api/admin/reports/overview`, `/events`, `/check-ins`. Payment managers can call `GET /api/admin/reports/revenue`. `GET /api/admin/reports/export?type=bookings|payments|check-ins|events` writes `REPORT_EXPORTED`. Payment managers can export `payments` only. Ranges: `today`, `yesterday`, `7d`, `30d`, `month`, `custom` (`from`, `to`), or the default upcoming window.

Profile: `GET /api/admin/profile`, `PATCH /api/admin/profile` `{ "name": "..." }`, `POST /api/admin/profile/change-password` `{ "currentPassword", "newPassword", "confirmPassword" }`.

Settings: `GET /api/admin/settings` returns the business name, email, phone, currency, UPI display name, and payment expiry. It does not return the MongoDB URI, JWT secret, or UPI id.

## Audit

`AdminAuditLog` stores admin id, action, resource type, resource id, previous and new values, IP, and user agent. Passwords, tokens, and QR secrets are stripped before save. Actions include `ADMIN_LOGIN`, `ADMIN_LOGOUT`, `EVENT_CREATED`, `EVENT_UPDATED`, `EVENT_CANCELLED`, `BOOKING_VIEWED`, `BOOKING_CANCELLED`, `PAYMENT_VIEWED`, `PAYMENT_VERIFIED`, `PAYMENT_REJECTED`, `TICKET_VIEWED`, `TICKET_CANCELLED`, `CHECK_IN_VALIDATED`, `CHECK_IN_COMPLETED`, and `REPORT_EXPORTED`.
