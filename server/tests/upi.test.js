import assert from "node:assert/strict";
import test from "node:test";
import { buildUpiIntentUrl } from "../services/upiService.js";
import { validateUtr } from "../utils/validators.js";

test("upi intent is encoded on the server with the booking amount", () => {
  const url = buildUpiIntentUrl({
    upiId: "business@upi",
    upiName: "MOMNT",
    amount: 6000,
    bookingReference: "MOMNT-20261004-4821",
  });
  const parsed = new URL(url);
  assert.equal(parsed.protocol, "upi:");
  assert.equal(parsed.searchParams.get("pa"), "business@upi");
  assert.equal(parsed.searchParams.get("pn"), "MOMNT");
  assert.equal(parsed.searchParams.get("am"), "6000");
  assert.equal(parsed.searchParams.get("cu"), "INR");
  assert.equal(parsed.searchParams.get("tn"), "MOMNT-20261004-4821");
});

test("utr accepts a spaced reference and rejects invalid values", () => {
  assert.equal(validateUtr(" 1234 5678 9012 ").ok, true);
  assert.equal(validateUtr(" 1234 5678 9012 ").utr, "123456789012");
  assert.equal(validateUtr("12").ok, false);
  assert.equal(validateUtr("UTR-123").ok, false);
  assert.equal(validateUtr("00000000").ok, false);
});
