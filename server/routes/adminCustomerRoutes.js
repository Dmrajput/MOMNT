import { Router } from "express";
import { showCustomer, showCustomers } from "../controllers/adminCustomerController.js";
import { adminAuth } from "../middleware/adminAuth.js";
import { requireAccess } from "../middleware/requireRole.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { idParam, listQuery, requestSchema } from "./adminSchemas.js";

const router = Router();
router.get(
  "/",
  adminAuth,
  requireAccess("customers"),
  validateRequest(requestSchema({ query: listQuery })),
  asyncHandler(showCustomers),
);
router.get(
  "/:customerId",
  adminAuth,
  requireAccess("customers"),
  validateRequest(requestSchema({ params: idParam("customerId") })),
  asyncHandler(showCustomer),
);

export default router;
