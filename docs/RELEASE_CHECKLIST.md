# Release checklist

Check an item only after it has been done on the environment you are launching. This file is the list, not a claim that production is live.

- [ ] Server tests pass (`cd server && npm test`)
- [ ] Production build passes (`npm run build`)
- [ ] `npm audit` reviewed; no unaccepted critical issue
- [ ] Host environment variables set from `server/.env.example` and root `.env.example`
- [ ] `JWT_SECRET` is a long random value, not the example placeholder
- [ ] MongoDB user is least-privilege and not reachable from the public internet
- [ ] Provider backups enabled
- [ ] A restore has been tested on staging
- [ ] HTTPS certificate active and HTTP redirects to HTTPS
- [ ] CORS allows only the real frontend origin
- [ ] `GET /api/health/live` returns 200
- [ ] `GET /api/health/ready` returns 200
- [ ] Frontend loads and refresh works on `/ticket/...` and `/admin/...`
- [ ] Booking, UTR submit, admin verify, ticket, and check-in completed on staging
- [ ] A controlled UPI transfer was checked against the real business account before public booking opens
- [ ] Mobile and desktop layouts checked on the deployed site
- [ ] Production database has no fake paid bookings
- [ ] Admin header shows Production
- [ ] `MAINTENANCE_MODE` is `0`
- [ ] Rollback build is recorded
- [ ] Operator is watching 5xx, payment, and check-in errors during launch

## Launch data for MOMNT #01

Confirm in the production database before opening bookings:

- Title: The Premium Sunday Experience
- Date: 25 Oct 2026, 11:00 AM – 4:00 PM IST
- Location: Ahmedabad
- Price: ₹3,000
- Capacity: 50
- Status: Published
- UPI ID matches the business account you will actually receive
