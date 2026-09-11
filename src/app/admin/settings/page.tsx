import { listAllTaxRates, listAllShippingOptions, listCarriers } from "@/lib/db/repo";
import { formatMoney } from "@/lib/money";
import {
  createTaxRateAction,
  updateTaxRateAction,
  deleteTaxRateAction,
  createShippingOptionAction,
  updateShippingOptionAction,
  deleteShippingOptionAction,
  createCarrierAction,
  updateCarrierAction,
  deleteCarrierAction,
} from "@/lib/actions/cart-settings.actions";
import DeleteTaxonomyButton from "@/components/admin/DeleteTaxonomyButton";

export default async function AdminSettingsPage() {
  const taxRates = listAllTaxRates();
  const shippingOptions = listAllShippingOptions();
  const carriers = listCarriers();

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-xl font-bold mb-1">Cart Settings</h1>
        <p className="text-sm text-ink-muted">
          Tax rates, shipping fees, and carriers used at checkout. Changes apply immediately to new orders.
        </p>
      </div>

      {/* Tax rates */}
      <section>
        <h2 className="font-semibold mb-3">Tax Rates</h2>
        <div className="card divide-y divide-border">
          {taxRates.map((t) => (
            <div key={t.id} className="flex items-center gap-2 p-3 flex-wrap">
              <form action={updateTaxRateAction} className="flex items-center gap-2 flex-1 flex-wrap">
                <input type="hidden" name="id" value={t.id} />
                <div>
                  <label className="field-label">State</label>
                  <input name="stateCode" defaultValue={t.state_code} maxLength={2} className="field-input py-1 w-16 uppercase" />
                </div>
                <div>
                  <label className="field-label">Rate %</label>
                  <input name="ratePercent" type="number" step={0.01} min={0} defaultValue={t.rate_percent} className="field-input py-1 w-24" />
                </div>
                <div className="flex-1 min-w-[160px]">
                  <label className="field-label">Label</label>
                  <input name="label" defaultValue={t.label} className="field-input py-1" />
                </div>
                <button type="submit" className="btn btn-secondary btn-sm">
                  Save
                </button>
              </form>
              <DeleteTaxonomyButton action={deleteTaxRateAction} id={t.id} label="Delete" itemName={`${t.state_code} tax rate`} />
            </div>
          ))}
          {taxRates.length === 0 && <p className="p-3 text-sm text-ink-muted">No tax rates configured.</p>}
        </div>
        <form action={createTaxRateAction} className="flex items-end gap-2 mt-3 flex-wrap">
          <div>
            <label className="field-label">State</label>
            <input name="stateCode" required maxLength={2} placeholder="CA" className="field-input py-1 w-16 uppercase" />
          </div>
          <div>
            <label className="field-label">Rate %</label>
            <input name="ratePercent" type="number" step={0.01} min={0} required placeholder="7.25" className="field-input py-1 w-24" />
          </div>
          <div>
            <label className="field-label">Label</label>
            <input name="label" required placeholder="California Sales Tax" className="field-input py-1" />
          </div>
          <button type="submit" className="btn btn-primary btn-sm">
            Add Tax Rate
          </button>
        </form>
      </section>

      {/* Shipping options */}
      <section>
        <h2 className="font-semibold mb-3">Shipping Options</h2>
        <div className="card divide-y divide-border">
          {shippingOptions.map((s) => (
            <div key={s.id} className="flex items-center gap-2 p-3 flex-wrap">
              <form action={updateShippingOptionAction} className="flex items-center gap-2 flex-1 flex-wrap">
                <input type="hidden" name="id" value={s.id} />
                <div className="min-w-[140px]">
                  <label className="field-label">Name</label>
                  <input name="name" defaultValue={s.name} className="field-input py-1" />
                </div>
                <div className="flex-1 min-w-[160px]">
                  <label className="field-label">Description</label>
                  <input name="description" defaultValue={s.description ?? ""} className="field-input py-1" />
                </div>
                <div>
                  <label className="field-label">Flat rate ($)</label>
                  <input
                    name="flatRate"
                    type="number"
                    step={0.01}
                    min={0}
                    defaultValue={(s.flat_rate_cents / 100).toFixed(2)}
                    className="field-input py-1 w-24"
                  />
                </div>
                <div>
                  <label className="field-label">Order</label>
                  <input name="sortOrder" type="number" defaultValue={s.sort_order} className="field-input py-1 w-16" />
                </div>
                <label className="flex items-center gap-1 text-xs mt-4">
                  <input type="checkbox" name="isActive" defaultChecked={Boolean(s.is_active)} />
                  Active
                </label>
                <button type="submit" className="btn btn-secondary btn-sm">
                  Save
                </button>
              </form>
              <DeleteTaxonomyButton action={deleteShippingOptionAction} id={s.id} label="Delete" itemName={s.name} />
            </div>
          ))}
          {shippingOptions.length === 0 && <p className="p-3 text-sm text-ink-muted">No shipping options configured.</p>}
        </div>
        <form action={createShippingOptionAction} className="flex items-end gap-2 mt-3 flex-wrap">
          <div>
            <label className="field-label">Name</label>
            <input name="name" required placeholder="Standard Shipping" className="field-input py-1" />
          </div>
          <div>
            <label className="field-label">Description</label>
            <input name="description" placeholder="5-7 business days" className="field-input py-1" />
          </div>
          <div>
            <label className="field-label">Flat rate ($)</label>
            <input name="flatRate" type="number" step={0.01} min={0} required placeholder="4.99" className="field-input py-1 w-24" />
          </div>
          <div>
            <label className="field-label">Order</label>
            <input name="sortOrder" type="number" defaultValue={0} className="field-input py-1 w-16" />
          </div>
          <button type="submit" className="btn btn-primary btn-sm">
            Add Shipping Option
          </button>
        </form>
      </section>

      {/* Carriers */}
      <section>
        <h2 className="font-semibold mb-3">Shipping Carriers</h2>
        <p className="text-xs text-ink-muted mb-3">
          Used on the Orders page to select who&apos;s shipping an order, and to build the tracking link sent to the
          customer. Use <code>{"{tracking}"}</code> in the URL template as a placeholder for the tracking number.
        </p>
        <div className="card divide-y divide-border">
          {carriers.map((c) => (
            <div key={c.id} className="flex items-center gap-2 p-3 flex-wrap">
              <form action={updateCarrierAction} className="flex items-center gap-2 flex-1 flex-wrap">
                <input type="hidden" name="id" value={c.id} />
                <div className="min-w-[120px]">
                  <label className="field-label">Name</label>
                  <input name="name" defaultValue={c.name} className="field-input py-1" />
                </div>
                <div className="flex-1 min-w-[220px]">
                  <label className="field-label">Tracking URL template</label>
                  <input
                    name="trackingUrlTemplate"
                    defaultValue={c.tracking_url_template ?? ""}
                    placeholder="https://example.com/track?n={tracking}"
                    className="field-input py-1"
                  />
                </div>
                <label className="flex items-center gap-1 text-xs mt-4">
                  <input type="checkbox" name="isActive" defaultChecked={Boolean(c.is_active)} />
                  Active
                </label>
                <button type="submit" className="btn btn-secondary btn-sm">
                  Save
                </button>
              </form>
              <DeleteTaxonomyButton action={deleteCarrierAction} id={c.id} label="Delete" itemName={c.name} />
            </div>
          ))}
          {carriers.length === 0 && <p className="p-3 text-sm text-ink-muted">No carriers configured.</p>}
        </div>
        <form action={createCarrierAction} className="flex items-end gap-2 mt-3 flex-wrap">
          <div>
            <label className="field-label">Name</label>
            <input name="name" required placeholder="OnTrac" className="field-input py-1" />
          </div>
          <div className="flex-1 min-w-[220px]">
            <label className="field-label">Tracking URL template</label>
            <input name="trackingUrlTemplate" placeholder="https://example.com/track?n={tracking}" className="field-input py-1" />
          </div>
          <button type="submit" className="btn btn-primary btn-sm">
            Add Carrier
          </button>
        </form>
      </section>

      <p className="text-xs text-ink-muted">
        Reference — current shipping totals shown to customers: {shippingOptions.filter((s) => s.is_active).map((s) => `${s.name} ${formatMoney(s.flat_rate_cents)}`).join(", ") || "none active"}
      </p>
    </div>
  );
}
