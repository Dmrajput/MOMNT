# Incident response

No vendor support contacts are listed here. Use the account that owns the host you selected.

## API down

1. Open `GET /api/health/live`. If it fails, restart the API process.
2. Open `GET /api/health/ready`. A 503 with `database: unavailable` means MongoDB, not the Node process.
3. Read logs for the `X-Request-ID` customers saw, if they have one.
4. If the new release caused it, roll back the API. Do not drop the database.

## MongoDB down

1. Readiness returns 503. Customers should see "Service temporarily unavailable. Please try again."
2. Check the provider status and the network allow-list.
3. Do not point the API at a laptop database.
4. Restore from backup only after a staging restore check. See `docs/BACKUP_AND_RESTORE.md`.

## UPI unavailable

Guests can still create a booking. They cannot complete a transfer until the UPI app or bank is back. Leave payments in `created` or `verification_pending`. Do not mark them paid.

## Verification delayed

Tell the guest the transfer is waiting for MOMNT to confirm it. Check the business account, then Verify or Reject in admin. Reject sets the payment to `failed` and the booking back to `payment_pending`. It does not create a ticket.

## Scanner unavailable

Use manual ticket id lookup in Check-in. If the API is down, stop entry checks and say "Unable to verify ticket." Do not keep a paper list as a substitute for check-in unless MOMNT staff have a separate written process. The product will not record those entries later by itself.

## Admin or ticket page down

If the API is healthy and only the frontend failed, roll back `dist`. Ticket data remains in MongoDB. A refresh of `/ticket/:ticketId` should work after the frontend is restored.

## Rollback criteria

Roll back when payments, booking creation, ticket generation, admin login, or check-in are broken, or when there is a critical security issue. Do not roll back only for a minor visual issue.
