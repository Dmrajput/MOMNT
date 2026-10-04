import { getCustomer, listCustomers } from "../services/adminBookingService.js";

export async function showCustomers(req, res) {
  const result = await listCustomers(req.validated?.query || {});
  res.json({ success: true, ...result });
}

export async function showCustomer(req, res) {
  res.json({ success: true, customer: await getCustomer(req.validated.params.customerId) });
}
