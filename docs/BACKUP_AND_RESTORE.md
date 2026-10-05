# Backup and restore

## Target

For the first MOMNT launch, plan for a recovery point of about 24 hours (daily backup) and a recovery time of a few hours. That is an operational target, not a contractual SLA.

## Configure backups

Use the managed MongoDB provider's automated daily backup. Keep several versions. Restrict restore permissions to operators. Confirm the application database user cannot drop the cluster.

The application does not ship a backup agent. Turning on provider backups, and testing a restore, is an operator step that has not been executed from this repository.

## Restore

1. Stop public booking by setting `MAINTENANCE_MODE=1` and redeploying the API. Health and `/api/admin` stay available. New public booking and payment writes return 503.
2. Restore the snapshot into a new database or a staging cluster. Do not overwrite production until the copy has been checked.
3. Point a staging API at the restored URI and open `GET /api/health/ready`.
4. Confirm events, bookings, payments, tickets, admins, and audit logs are present and that paid bookings still have tickets.
5. In Admin → Reports, open the integrity check. It reports mismatches and does not rewrite data.
6. Switch the production `MONGODB_URI` only after that check. Redeploy the API. Set `MAINTENANCE_MODE=0`.

## Backup failure

If the provider reports a failed backup job, treat the backup as missing. Take a manual snapshot before the event and before any migration. A scheduled job that ran is not proof that a restorable file exists.

## What was not tested

No staging restore has been performed from this workspace. Do not mark the launch checklist restore item complete until an operator restores a snapshot and reads back an event, a booking, a payment, a ticket, and an admin.
