export default function PrivacyPage() {
  return (
    <div className="container-page py-12 max-w-3xl prose-sm">
      <div className="alert-error mb-6 not-prose">
        Template only — this page has not been reviewed by an attorney. Replace the bracketed details and have
        counsel review before this site goes live, especially around payment data, state privacy laws (e.g. CCPA),
        and any email marketing you plan to send.
      </div>
      <h1 className="text-2xl font-bold mb-4">Privacy Notice</h1>
      <p className="text-sm text-ink-muted mb-4">Last updated: [date]</p>

      <div className="space-y-5 text-sm leading-relaxed">
        <section>
          <h2 className="font-semibold mb-1">Information We Collect</h2>
          <p>
            When you register, place an order, or contact us, we collect information such as your name, email
            address, phone number, shipping and billing address, and order history. We do not store full payment
            card numbers — payment processing is handled by our payment processor (see "Payment Processing" below).
          </p>
        </section>
        <section>
          <h2 className="font-semibold mb-1">How We Use Information</h2>
          <p>
            We use your information to process orders, communicate with you about your account and purchases,
            provide customer support, and — where you've agreed to receive them — send marketing communications.
          </p>
        </section>
        <section>
          <h2 className="font-semibold mb-1">Payment Processing</h2>
          <p>
            Payments are processed by a third-party payment processor. [Name processor once selected — see the
            engineering README for how the processor is configured.] We store only non-sensitive references to your
            payment method (such as card brand and last four digits), never full card numbers.
          </p>
        </section>
        <section>
          <h2 className="font-semibold mb-1">Marketplace Listings</h2>
          <p>
            If you list items for sale through your account, the listing details you provide (title, description,
            price, images) are displayed publicly on the site.
          </p>
        </section>
        <section>
          <h2 className="font-semibold mb-1">Your Choices</h2>
          <p>
            You can review and update your account information at any time from your Account page. To request
            deletion of your account or data, contact us using the Contact Us page.
          </p>
        </section>
        <section>
          <h2 className="font-semibold mb-1">Contact</h2>
          <p>Questions about this policy can be sent through our Contact Us page.</p>
        </section>
      </div>
    </div>
  );
}
