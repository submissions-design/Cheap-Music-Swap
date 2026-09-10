import { randomUUID } from "node:crypto";
import type { PaymentProvider, ChargeRequest, ChargeResult } from "./types";

/**
 * Default provider for development, demos, and until a real merchant
 * account is wired up. Always "succeeds" and fabricates a reference number
 * — no money moves and no external network call is made. Swap
 * PAYMENT_PROVIDER in .env to activate a real processor (see
 * lib/payments/index.ts and README.md).
 */
export class MockPaymentProvider implements PaymentProvider {
  readonly name = "mock";

  async charge(request: ChargeRequest): Promise<ChargeResult> {
    // Simulate an obviously-fake decline path so the failure UI can be
    // exercised: a card token ending in "0000" always declines.
    if (request.paymentMethodToken.endsWith("0000")) {
      return { success: false, processorReference: "", errorMessage: "The card was declined." };
    }
    return { success: true, processorReference: `MOCK-${randomUUID().slice(0, 12).toUpperCase()}` };
  }

  async refund(processorReference: string): Promise<ChargeResult> {
    return { success: true, processorReference: `${processorReference}-REFUND` };
  }
}
