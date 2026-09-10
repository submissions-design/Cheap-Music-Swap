import type { PaymentProvider } from "./types";
import { MockPaymentProvider } from "./mock";

/**
 * Payment processor selection point.
 *
 * PAYMENT_PROVIDER=mock (default) — no real charges, safe for dev/demo.
 *
 * To go live with a real processor:
 *   1. Implement PaymentProvider in a new file, e.g. lib/payments/stripe.ts,
 *      calling the processor's server-side SDK/API from inside charge()/refund().
 *   2. Register it in the switch below behind its own PAYMENT_PROVIDER value
 *      (e.g. "stripe", "paypal", "authorizenet").
 *   3. Set PAYMENT_PROVIDER and the processor's secret key(s) in the
 *      environment. Nothing else in the app changes — checkout, orders, and
 *      the account "Payment Options" screen all go through this interface.
 *
 * This indirection is what makes the processor configurable/replaceable
 * later without a rebuild, per the storefront's requirements.
 */
export function getPaymentProvider(): PaymentProvider {
  const selected = process.env.PAYMENT_PROVIDER || "mock";
  switch (selected) {
    case "mock":
      return new MockPaymentProvider();
    // case "stripe":
    //   return new StripePaymentProvider();
    // case "paypal":
    //   return new PayPalPaymentProvider();
    // case "authorizenet":
    //   return new AuthorizeNetPaymentProvider();
    default:
      throw new Error(
        `Unknown PAYMENT_PROVIDER "${selected}". Add and register an implementation in lib/payments/index.ts.`
      );
  }
}
