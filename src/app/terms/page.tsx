export default function TermsPage() {
  return (
    <div className="container-page py-12 max-w-3xl">
      <div className="alert-error mb-6">
        Template only — not reviewed by an attorney. Have counsel review before launch, particularly the marketplace
        seller terms, returns/refunds policy, and any state-specific consumer protection requirements.
      </div>
      <h1 className="text-2xl font-bold mb-4">Terms of Use</h1>
      <p className="text-sm text-ink-muted mb-4">Last updated: [date]</p>

      <div className="space-y-5 text-sm leading-relaxed">
        <section>
          <h2 className="font-semibold mb-1">Accounts</h2>
          <p>
            You must provide accurate information when creating an account and are responsible for activity that
            occurs under your account and password.
          </p>
        </section>
        <section>
          <h2 className="font-semibold mb-1">Orders &amp; Payment</h2>
          <p>
            All orders are subject to acceptance and availability. Prices and availability are subject to change.
            Orders may be cancelled by you prior to shipment from your Account → Order History page, or by us if we
            are unable to fulfill an order.
          </p>
        </section>
        <section>
          <h2 className="font-semibold mb-1">Marketplace Listings</h2>
          <p>
            Registered customers may list eligible items for sale. Listings are reviewed before appearing on the
            site. By submitting a listing you confirm you have the right to sell the item and that its description is
            accurate. [Add commission/fee terms, condition-grading standards, and prohibited-items list once
            finalized.]
          </p>
        </section>
        <section>
          <h2 className="font-semibold mb-1">Returns &amp; Refunds</h2>
          <p>[Insert the store's return window, condition requirements, and refund method once decided.]</p>
        </section>
        <section>
          <h2 className="font-semibold mb-1">Limitation of Liability</h2>
          <p>
            The site and its contents are provided "as is." To the fullest extent permitted by law, we are not
            liable for indirect or consequential damages arising from use of the site.
          </p>
        </section>
      </div>
    </div>
  );
}
