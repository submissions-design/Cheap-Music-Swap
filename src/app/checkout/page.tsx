import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getCurrentCartSummary } from "@/lib/cart";
import { listAddressesByUser, listPaymentMethods, listShippingOptions } from "@/lib/db/repo";
import CheckoutForm from "@/components/CheckoutForm";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const user = await getCurrentUser();
  const { lines, subtotalCents } = await getCurrentCartSummary();
  if (lines.length === 0) redirect("/cart");

  const addresses = user ? listAddressesByUser(user.id) : [];
  const paymentMethods = user ? listPaymentMethods(user.id) : [];
  const shippingOptions = listShippingOptions();

  return (
    <div className="container-page py-10">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>
      <CheckoutForm
        lines={lines}
        subtotalCents={subtotalCents}
        shippingOptions={shippingOptions}
        addresses={addresses}
        paymentMethods={paymentMethods}
        isLoggedIn={!!user}
        userEmail={user?.email ?? null}
      />
    </div>
  );
}
