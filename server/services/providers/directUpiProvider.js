import { AppError } from "../../utils/errors.js";
import { buildUpiIntentUrl } from "../upiService.js";

export class DirectUPIProvider {
  constructor(config) {
    this.config = config;
  }

  createPayment({ amount, bookingReference }) {
    if (!this.config.upi.id) {
      throw new AppError("SERVER_ERROR", "Something went wrong. Please try again.", 500);
    }
    return {
      method: "upi",
      upiId: this.config.upi.id,
      upiName: this.config.upi.name,
      amount,
      currency: this.config.currency,
      upiIntentUrl: buildUpiIntentUrl({
        upiId: this.config.upi.id,
        upiName: this.config.upi.name,
        amount,
        bookingReference,
      }),
    };
  }

  getPaymentStatus(payment) {
    return payment.status;
  }

  verifyPayment() {
    throw new AppError(
      "NOT_IMPLEMENTED",
      "Automatic UPI verification is not available.",
      501,
    );
  }

  refundPayment() {
    throw new AppError("NOT_IMPLEMENTED", "Refunds are not available in this phase.", 501);
  }
}
