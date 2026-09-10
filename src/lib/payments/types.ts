export interface ChargeRequest {
  amountCents: number;
  currency: "usd";
  /** Opaque token representing the customer's chosen payment method (never raw card data). */
  paymentMethodToken: string;
  orderReference: string;
  customerEmail: string;
}

export interface ChargeResult {
  success: boolean;
  processorReference: string;
  errorMessage?: string;
}

/**
 * Every payment processor integration implements this interface. The rest
 * of the app (checkout Server Action) only ever talks to `PaymentProvider`,
 * so switching processors — or running two side by side during a migration
 * — never touches checkout, order, or account code. See lib/payments/index.ts
 * for how the active provider is selected, and README.md "Payment processor
 * configuration" for how to wire up a real processor.
 */
export interface PaymentProvider {
  readonly name: string;
  charge(request: ChargeRequest): Promise<ChargeResult>;
  refund(processorReference: string, amountCents: number): Promise<ChargeResult>;
}
