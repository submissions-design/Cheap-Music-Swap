"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { placeOrderAction } from "@/lib/actions/checkout.actions";
import { formatMoney } from "@/lib/money";
import type { CartLine } from "@/lib/db/types";
import type { Address, PaymentMethod, ShippingOption } from "@/lib/db/types";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
];

export default function CheckoutForm({
  lines,
  subtotalCents,
  shippingOptions,
  addresses,
  paymentMethods,
  isLoggedIn,
  userEmail,
}: {
  lines: CartLine[];
  subtotalCents: number;
  shippingOptions: ShippingOption[];
  addresses: Address[];
  paymentMethods: PaymentMethod[];
  isLoggedIn: boolean;
  userEmail: string | null;
}) {
  const [state, formAction, pending] = useActionState(placeOrderAction, {});

  const defaultAddress = addresses.find((a) => a.is_default_shipping) || addresses[0];
  const [addressId, setAddressId] = useState<string>(defaultAddress ? defaultAddress.id : "new");
  const chosenAddress = addresses.find((a) => a.id === addressId);

  const [fullName, setFullName] = useState(chosenAddress?.full_name || "");
  const [line1, setLine1] = useState(chosenAddress?.line1 || "");
  const [line2, setLine2] = useState(chosenAddress?.line2 || "");
  const [city, setCity] = useState(chosenAddress?.city || "");
  const [addrState, setAddrState] = useState(chosenAddress?.state || "");
  const [postalCode, setPostalCode] = useState(chosenAddress?.postal_code || "");

  useEffect(() => {
    const a = addresses.find((x) => x.id === addressId);
    setFullName(a?.full_name || "");
    setLine1(a?.line1 || "");
    setLine2(a?.line2 || "");
    setCity(a?.city || "");
    setAddrState(a?.state || "");
    setPostalCode(a?.postal_code || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addressId]);

  const [shippingOptionId, setShippingOptionId] = useState(shippingOptions[0]?.id || "");
  const shippingOption = shippingOptions.find((s) => s.id === shippingOptionId);
  const shippingCents = shippingOption?.flat_rate_cents ?? 0;

  const [taxRatePercent, setTaxRatePercent] = useState(0);
  useEffect(() => {
    if (!addrState) {
      setTaxRatePercent(0);
      return;
    }
    const controller = new AbortController();
    fetch(`/api/tax-preview?state=${encodeURIComponent(addrState)}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((d) => setTaxRatePercent(d.ratePercent ?? 0))
      .catch(() => {});
    return () => controller.abort();
  }, [addrState]);

  const taxCents = useMemo(() => Math.round(subtotalCents * (taxRatePercent / 100)), [subtotalCents, taxRatePercent]);
  const totalCents = subtotalCents + taxCents + shippingCents;

  const defaultMethod = paymentMethods.find((m) => m.is_default) || paymentMethods[0];
  const [paymentMethodId, setPaymentMethodId] = useState<string>(defaultMethod ? defaultMethod.id : "new");

  return (
    <form action={formAction} className="grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        {!isLoggedIn && (
          <section className="card p-5">
            <h2 className="font-semibold mb-3">Contact</h2>
            <p className="text-xs text-ink-muted mb-2">
              Checking out as a guest. <Link href="/login?next=/checkout" className="text-brand hover:underline">Log in</Link> to use
              saved addresses and payment methods.
            </p>
            <label className="field-label" htmlFor="guestEmail">Email address</label>
            <input id="guestEmail" name="guestEmail" type="email" required className="field-input" placeholder="you@example.com" />
          </section>
        )}

        <section className="card p-5">
          <h2 className="font-semibold mb-3">Shipping Address</h2>
          {isLoggedIn && addresses.length > 0 && (
            <div className="mb-4">
              <label className="field-label" htmlFor="savedAddress">Use a saved address</label>
              <select
                id="savedAddress"
                className="field-input"
                value={addressId}
                onChange={(e) => setAddressId(e.target.value)}
              >
                {addresses.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label} — {a.full_name}, {a.line1}, {a.city}, {a.state}
                  </option>
                ))}
                <option value="new">Enter a new address</option>
              </select>
            </div>
          )}
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="field-label" htmlFor="shippingName">Full name</label>
              <input id="shippingName" name="shippingName" required className="field-input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="field-label" htmlFor="line1">Address</label>
              <input id="line1" name="line1" required className="field-input" value={line1} onChange={(e) => setLine1(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="field-label" htmlFor="line2">Apt / Suite (optional)</label>
              <input id="line2" name="line2" className="field-input" value={line2} onChange={(e) => setLine2(e.target.value)} />
            </div>
            <div>
              <label className="field-label" htmlFor="city">City</label>
              <input id="city" name="city" required className="field-input" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label" htmlFor="state">State</label>
                <select id="state" name="state" required className="field-input" value={addrState} onChange={(e) => setAddrState(e.target.value)}>
                  <option value="">--</option>
                  {US_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="field-label" htmlFor="postalCode">ZIP</label>
                <input id="postalCode" name="postalCode" required className="field-input" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
              </div>
            </div>
          </div>
          <input type="hidden" name="country" value="US" />
        </section>

        <section className="card p-5">
          <h2 className="font-semibold mb-3">Shipping Method</h2>
          <div className="space-y-2">
            {shippingOptions.map((s) => (
              <label key={s.id} className="flex items-center justify-between border border-border rounded px-3 py-2 cursor-pointer has-[:checked]:border-brand">
                <span className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="shippingOptionId"
                    value={s.id}
                    checked={shippingOptionId === s.id}
                    onChange={() => setShippingOptionId(s.id)}
                  />
                  <span>
                    <span className="block text-sm font-medium">{s.name}</span>
                    {s.description && <span className="block text-xs text-ink-muted">{s.description}</span>}
                  </span>
                </span>
                <span className="text-sm font-semibold">{s.flat_rate_cents === 0 ? "Free" : formatMoney(s.flat_rate_cents)}</span>
              </label>
            ))}
          </div>
        </section>

        <section className="card p-5">
          <h2 className="font-semibold mb-3">Payment</h2>
          {isLoggedIn && paymentMethods.length > 0 && (
            <div className="mb-4">
              <label className="field-label" htmlFor="savedPayment">Use a saved card</label>
              <select
                id="savedPayment"
                className="field-input"
                value={paymentMethodId}
                onChange={(e) => setPaymentMethodId(e.target.value)}
              >
                {paymentMethods.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label} (exp {m.exp_month}/{m.exp_year})
                  </option>
                ))}
                <option value="new">Use a new card</option>
              </select>
              {paymentMethodId !== "new" && <input type="hidden" name="paymentMethodId" value={paymentMethodId} />}
            </div>
          )}
          {(!isLoggedIn || paymentMethods.length === 0 || paymentMethodId === "new") && (
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="field-label" htmlFor="cardNumber">Card number</label>
                <input id="cardNumber" name="cardNumber" required inputMode="numeric" placeholder="4111 1111 1111 1111" className="field-input" />
                <p className="text-xs text-ink-muted mt-1">Demo mode: any 12+ digit number works. A number ending in 0000 simulates a decline.</p>
              </div>
              <div>
                <label className="field-label" htmlFor="expMonth">Exp. month</label>
                <input id="expMonth" name="expMonth" type="number" min={1} max={12} required className="field-input" placeholder="12" />
              </div>
              <div>
                <label className="field-label" htmlFor="expYear">Exp. year</label>
                <input id="expYear" name="expYear" type="number" min={new Date().getFullYear()} required className="field-input" placeholder="2029" />
              </div>
              <div>
                <label className="field-label" htmlFor="cvc">CVC</label>
                <input id="cvc" name="cvc" required inputMode="numeric" maxLength={4} className="field-input" placeholder="123" />
              </div>
              {isLoggedIn && (
                <div className="sm:col-span-2 flex items-center gap-2 pt-1">
                  <input id="saveCard" name="saveCard" type="checkbox" />
                  <label htmlFor="saveCard" className="text-sm">Save this card to my account</label>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      <div className="card p-5 h-fit sticky top-24">
        <h2 className="font-semibold mb-3">Order Summary</h2>
        <ul className="space-y-2 mb-4 max-h-52 overflow-y-auto text-sm">
          {lines.map((l) => (
            <li key={l.productId} className="flex justify-between gap-2">
              <span className="line-clamp-1">
                {l.title} × {l.quantity}
              </span>
              <span className="shrink-0">{formatMoney(l.lineTotalCents)}</span>
            </li>
          ))}
        </ul>
        <div className="space-y-1.5 text-sm border-t border-border pt-3">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatMoney(subtotalCents)}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping</span>
            <span>{formatMoney(shippingCents)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax{addrState ? ` (${addrState}, ${taxRatePercent}%)` : ""}</span>
            <span>{formatMoney(taxCents)}</span>
          </div>
          <div className="flex justify-between font-bold text-base border-t border-border pt-2 mt-1">
            <span>Total</span>
            <span>{formatMoney(totalCents)}</span>
          </div>
        </div>

        {state?.error && <p className="alert-error mt-4">{state.error}</p>}

        <button type="submit" disabled={pending} className="btn btn-primary w-full mt-4">
          {pending ? "Placing order..." : `Place Order — ${formatMoney(totalCents)}`}
        </button>
        <p className="text-[11px] text-ink-muted mt-2">
          By placing this order you agree to our <Link href="/terms" className="hover:underline">Terms of Use</Link> and{" "}
          <Link href="/privacy" className="hover:underline">Privacy Notice</Link>.
        </p>
      </div>
    </form>
  );
}
