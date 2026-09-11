import { getSiteSettings } from "@/lib/db/repo";
import HeaderBackgroundForm from "@/components/admin/HeaderBackgroundForm";
import SafeImage from "@/components/SafeImage";
import { removeHeaderBackgroundAction } from "@/lib/actions/appearance.actions";

export default async function AdminAppearancePage() {
  const settings = getSiteSettings();

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-bold mb-1">Appearance</h1>
      <p className="text-sm text-ink-muted mb-6">
        Controls the look of the site header/banner across every page.
      </p>

      <div className="card p-5 space-y-4">
        <h2 className="font-semibold">Header Banner Background</h2>

        <div>
          <p className="field-label mb-1">Current</p>
          {settings.header_bg_image_url ? (
            <div className="relative rounded overflow-hidden border border-border" style={{ height: 80 }}>
              <SafeImage
                src={settings.header_bg_image_url}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
                fallback={<></>}
              />
              <div className="absolute inset-0 bg-black/35 flex items-center px-4">
                <span className="text-white text-xs">Buying and selling CDs, vinyl, and turntable gear.</span>
              </div>
            </div>
          ) : (
            <div className="rounded border border-border h-20 bg-brand flex items-center px-4">
              <span className="text-brand-contrast text-xs">
                Buying and selling CDs, vinyl, and turntable gear. (solid color — no image set)
              </span>
            </div>
          )}
        </div>

        <HeaderBackgroundForm />

        {settings.header_bg_image_url && (
          <form action={removeHeaderBackgroundAction}>
            <button type="submit" className="btn btn-secondary btn-sm">
              Remove Image (revert to solid color)
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
