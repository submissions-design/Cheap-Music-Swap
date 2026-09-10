export function formatMoney(cents: number): string {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function calcTaxCents(subtotalCents: number, ratePercent: number): number {
  return Math.round(subtotalCents * (ratePercent / 100));
}
