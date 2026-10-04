# MOMNT payment API

The server calculates price, availability, and payment status. The browser cannot mark a payment as paid.

Customer responses never include a UPI PIN, bank credentials, admin notes, or the stored UTR.

## Shared responses

Success responses include `"success": true`.

Errors:

```json
{
  "success": false,
  "error": {
    "code": "PAYMENT_EXPIRED",
    "message": "This payment session has expired."
  }
}
```

Error codes: `BOOKING_NOT_FOUND`, `BOOKING_EXPIRED`, `BOOKING_ALREADY_PAID`, `PAYMENT_NOT_FOUND`, `PAYMENT_EXPIRED`, `PAYMENT_ALREADY_SUBMITTED`, `INVALID_UTR`, `DUPLICATE_UTR`, `PAYMENT_ALREADY_PAID`, `INVALID_PAYMENT_STATE`, `INVALID_AMOUNT`, `EVENT_SOLD_OUT`, `VALIDATION_ERROR`, `RATE_LIMITED`, `SERVER_ERROR`, `NOT_IMPLEMENTED`, `TICKET_NOT_FOUND`, `TICKET_NOT_AVAILABLE`, `TICKET_ALREADY_CHECKED_IN`, `ALREADY_CHECKED_IN`, `TICKET_CANCELLED`, `TICKET_REFUNDED`, `TICKET_EXPIRED`, `INVALID_QR_TOKEN`, `EVENT_ENDED`, `BOOKING_NOT_CONFIRMED`, `PAYMENT_NOT_CONFIRMED`.

Authentication: customer routes are public. Admin routes are blocked until a later phase.

## POST /api/bookings

Creates a booking and reserves passes. Price, fee, and total are calculated from the event record. `total` and `price` in the body are ignored.

Rate limit: none beyond normal traffic. Payment creation is limited separately.

Request:

```json
{
  "eventId": "momnt-01",
  "quantity": 2,
  "customer": {
    "name": "Raj Patel",
    "mobile": "9876543210",
    "email": "raj@example.com"
  },
  "guestNames": "Asha, Neel"
}
```

Optional header: `Idempotency-Key`.

Response `201`:

```json
{
  "success": true,
  "data": {
    "booking": {
      "bookingId": "MOMNT-20261004-4821",
      "total": 6000,
      "bookingFee": 0,
      "paymentStatus": "pending",
      "bookingStatus": "payment_pending"
    }
  }
}
```

Possible errors: `VALIDATION_ERROR` 400, `BOOKING_NOT_FOUND` 404, `EVENT_SOLD_OUT` 409.

## POST /api/payments/create

Opens a UPI payment session for an existing booking. The amount is `booking.total` after the server recalculates `event.price * quantity + fee`.

Rate limit: 10 requests / 15 minutes per IP.

Request:

```json
{
  "bookingId": "MOMNT-20261004-4821"
}
```

Optional header: `Idempotency-Key`.

A repeated request returns the open payment session instead of creating another one.

Response `201`:

```json
{
  "success": true,
  "payment": {
    "paymentId": "PAY-20261004-1001",
    "bookingId": "MOMNT-20261004-4821",
    "amount": 6000,
    "currency": "INR",
    "method": "upi",
    "upiId": "your-business-upi@provider",
    "upiName": "MOMNT",
    "upiIntentUrl": "upi://pay?...",
    "status": "payment_initiated",
    "expiresAt": "2026-10-04T12:30:00.000Z"
  }
}
```

Possible errors: `BOOKING_NOT_FOUND` 404, `BOOKING_EXPIRED` 409, `BOOKING_ALREADY_PAID` 409, `INVALID_AMOUNT` 409, `INVALID_PAYMENT_STATE` 409, `RATE_LIMITED` 429.

## POST /api/payments/:paymentId/submit-utr

Stores the customer's UTR and moves the payment to `verification_pending`. This does not mark the payment paid.

Rate limit: 5 requests / 15 minutes per IP.

Request:

```json
{
  "utr": "123456789012",
  "payerName": "Raj Patel"
}
```

Optional: `payerUpiId`, `transactionDate`.

Response `200`:

```json
{
  "success": true,
  "payment": {
    "paymentId": "PAY-20261004-1001",
    "bookingId": "MOMNT-20261004-4821",
    "status": "verification_pending",
    "submittedAt": "2026-10-04T12:10:00.000Z"
  }
}
```

Possible errors: `INVALID_UTR` 400, `VALIDATION_ERROR` 400, `PAYMENT_NOT_FOUND` 404, `PAYMENT_EXPIRED` 409, `PAYMENT_ALREADY_SUBMITTED` 409, `DUPLICATE_UTR` 409, `PAYMENT_ALREADY_PAID` 409, `INVALID_PAYMENT_STATE` 409, `INVALID_AMOUNT` 409.

## GET /api/payments/:paymentId

Returns the public payment view. UTR, admin notes, and verifier identity are omitted.

Response `200`: `{ "success": true, "payment": { "status": "verification_pending", "amount": 6000 } }`

Possible errors: `PAYMENT_NOT_FOUND` 404.

## GET /api/bookings/:bookingId/payment-status

Response `200`:

```json
{
  "success": true,
  "bookingId": "MOMNT-20261004-4821",
  "paymentStatus": "verification_pending",
  "bookingStatus": "payment_verification_pending",
  "amount": 6000,
  "currency": "INR"
}
```

A failed verification may include a short `rejectionReason`.

Possible errors: `BOOKING_NOT_FOUND` 404.

## Admin routes

`POST /api/admin/payments/:paymentId/verify`

`POST /api/admin/payments/:paymentId/reject`

Both return `501` until admin authentication exists. Service functions `verifyPayment` and `rejectPayment` are not exposed to customers. They do not contact a bank. A future admin may call them only after matching the UTR to the business UPI statement.

There is no public endpoint that accepts `{ "status": "paid" }`.

`POST /api/admin/tickets/:ticketId/check-in` and `POST /api/admin/tickets/:ticketId/cancel` also return `501`. Check-in is not available over the public API.

## Tickets

A MOMNT access record is created on the server when `verifyPayment` moves a booking to `paymentStatus: paid` and `bookingStatus: confirmed`. Generation is idempotent: one booking has one ticket. The browser cannot create a ticket or change its status, quantity, or name.

Ticket responses use `Cache-Control: no-store`. They omit `qrToken`, email, mobile, payment details, UTR, and MongoDB ids.

### GET /api/tickets/:ticketId

Response `200`:

```json
{
  "success": true,
  "ticket": {
    "ticketId": "MOMNT-01-X7K4P9",
    "ticketNumber": "MOMNT-01-0001",
    "bookingReference": "MOMNT-20261004-4821",
    "event": {
      "number": "MOMNT #01",
      "title": "The Premium Sunday Experience",
      "location": "Ahmedabad",
      "date": "25 Oct 2026",
      "time": "11:00 AM — 4:00 PM"
    },
    "customer": { "name": "Raj Patel" },
    "quantity": 2,
    "status": "active",
    "issuedAt": "2026-10-04T12:00:00.000Z"
  }
}
```

If the stored status is still `active` but the event end time has passed, `status` is returned as `expired`. That read does not change the database.

Possible errors: `TICKET_NOT_FOUND` 404.

### GET /api/bookings/:bookingId/ticket

Returns the same public ticket. If the booking is paid and confirmed but the record is missing, the server creates it. Otherwise:

```json
{
  "success": false,
  "error": {
    "code": "TICKET_NOT_AVAILABLE",
    "message": "Your MOMNT access will be available after payment confirmation."
  }
}
```

Possible errors: `BOOKING_NOT_FOUND` 404, `TICKET_NOT_AVAILABLE` 409.

### GET /api/tickets/:ticketId/qr

Returns a PNG of the validation URL. The token is not included in JSON. Rate limit: 120 requests per 15 minutes.

### GET /api/tickets/validate/:qrToken

Read-only. This does not check the guest in. Rate limit: 120 requests per minute per IP.

Valid:

```json
{
  "success": true,
  "valid": true,
  "ticket": {
    "ticketId": "MOMNT-01-X7K4P9",
    "ticketNumber": "MOMNT-01-0001",
    "customerName": "Raj Patel",
    "quantity": 2,
    "event": "The Premium Sunday Experience",
    "eventName": "The Premium Sunday Experience",
    "eventDate": "25 Oct 2026",
    "status": "active"
  }
}
```

Invalid tokens return `200` with `valid: false` and `code: "INVALID_QR_TOKEN"`. Known tickets that cannot be used return `ALREADY_CHECKED_IN`, `TICKET_CANCELLED`, `TICKET_REFUNDED`, `TICKET_EXPIRED`, or `EVENT_ENDED`.

The QR payload is `{TICKET_PUBLIC_BASE_URL}/ticket/validate/{token}`. Set `TICKET_PUBLIC_BASE_URL` in `server/.env`. It defaults to `CLIENT_URL`.
