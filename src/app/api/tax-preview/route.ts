import { NextRequest, NextResponse } from "next/server";
import { getTaxRateForState } from "@/lib/db/repo";

// Lightweight preview endpoint so the checkout page can show an estimated
// tax figure as the shopper picks a state, without resubmitting the whole
// form. The authoritative tax calculation happens again server-side in
// placeOrderAction (lib/actions/checkout.actions.ts) at the moment of
// purchase — this route never itself charges anything.
export async function GET(request: NextRequest) {
  const state = request.nextUrl.searchParams.get("state") || "";
  const rate = getTaxRateForState(state);
  return NextResponse.json({ ratePercent: rate?.rate_percent ?? 0, label: rate?.label ?? null });
}
