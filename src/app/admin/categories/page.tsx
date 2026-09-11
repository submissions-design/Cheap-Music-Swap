import {
  listCategories,
  listGenres,
  listArtists,
  productCountsByFormat,
  productCountsByGenre,
  productCountsByArtist,
} from "@/lib/db/repo";
import {
  createCategoryAction,
  renameCategoryAction,
  toggleCategoryActiveAction,
  deleteCategoryAction,
  createGenreAction,
  renameGenreAction,
  toggleGenreActiveAction,
  deleteGenreAction,
  createArtistAction,
  deleteArtistAction,
} from "@/lib/actions/taxonomy.actions";
import DeleteTaxonomyButton from "@/components/admin/DeleteTaxonomyButton";

export default async function AdminCategoriesPage() {
  const categories = listCategories();
  const genres = listGenres();
  const artists = listArtists();
  const [categoryCounts, genreCounts, artistCounts] = [productCountsByFormat(), productCountsByGenre(), productCountsByArtist()];

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-xl font-bold mb-1">Categories &amp; Genres</h1>
        <p className="text-sm text-ink-muted">
          These headings drive the top navigation, the shop sidebar, and the dropdowns shown when adding a product.
          Add a new heading here before it has any products — it will still appear (with a count of 0) everywhere
          products are browsed.
        </p>
      </div>

      {/* Categories */}
      <section>
        <h2 className="font-semibold mb-3">Categories (Format headings)</h2>
        <div className="card divide-y divide-border">
          {categories.map((c) => (
            <div key={c.id} className="flex items-center gap-3 p-3 flex-wrap">
              <form action={renameCategoryAction} className="flex items-center gap-2 flex-1 min-w-[200px]">
                <input type="hidden" name="id" value={c.id} />
                <input name="name" defaultValue={c.name} className="field-input py-1" />
                <button type="submit" className="btn btn-secondary btn-sm">
                  Save
                </button>
              </form>
              <span className="text-xs text-ink-muted whitespace-nowrap">
                {categoryCounts[c.name] ?? 0} product{(categoryCounts[c.name] ?? 0) === 1 ? "" : "s"}
              </span>
              <form action={toggleCategoryActiveAction}>
                <input type="hidden" name="id" value={c.id} />
                <input type="hidden" name="isActive" value={c.is_active} />
                <button type="submit" className="btn btn-secondary btn-sm">
                  {c.is_active ? "Active" : "Hidden"}
                </button>
              </form>
              <DeleteTaxonomyButton action={deleteCategoryAction} id={c.id} label="Delete" itemName={c.name} />
            </div>
          ))}
          {categories.length === 0 && <p className="p-3 text-sm text-ink-muted">No categories yet.</p>}
        </div>
        <form action={createCategoryAction} className="flex items-center gap-2 mt-3">
          <input name="name" required placeholder="New category, e.g. Clothing Gear" className="field-input py-1 max-w-xs" />
          <button type="submit" className="btn btn-primary btn-sm">
            Add Category
          </button>
        </form>
      </section>

      {/* Genres */}
      <section>
        <h2 className="font-semibold mb-3">Genres</h2>
        <div className="card divide-y divide-border">
          {genres.map((g) => (
            <div key={g.id} className="flex items-center gap-3 p-3 flex-wrap">
              <form action={renameGenreAction} className="flex items-center gap-2 flex-1 min-w-[200px]">
                <input type="hidden" name="id" value={g.id} />
                <input name="name" defaultValue={g.name} className="field-input py-1" />
                <button type="submit" className="btn btn-secondary btn-sm">
                  Save
                </button>
              </form>
              <span className="text-xs text-ink-muted whitespace-nowrap">
                {genreCounts[g.name] ?? 0} product{(genreCounts[g.name] ?? 0) === 1 ? "" : "s"}
              </span>
              <form action={toggleGenreActiveAction}>
                <input type="hidden" name="id" value={g.id} />
                <input type="hidden" name="isActive" value={g.is_active} />
                <button type="submit" className="btn btn-secondary btn-sm">
                  {g.is_active ? "Active" : "Hidden"}
                </button>
              </form>
              <DeleteTaxonomyButton action={deleteGenreAction} id={g.id} label="Delete" itemName={g.name} />
            </div>
          ))}
          {genres.length === 0 && <p className="p-3 text-sm text-ink-muted">No genres yet.</p>}
        </div>
        <form action={createGenreAction} className="flex items-center gap-2 mt-3">
          <input name="name" required placeholder="New genre, e.g. Lo-fi" className="field-input py-1 max-w-xs" />
          <button type="submit" className="btn btn-primary btn-sm">
            Add Genre
          </button>
        </form>
      </section>

      {/* Artists */}
      <section>
        <h2 className="font-semibold mb-3">Artists</h2>
        <p className="text-xs text-ink-muted mb-3">
          Artists are also added automatically whenever a product is created or edited with a new artist name — use
          this list mainly to clean up duplicates or remove unused entries.
        </p>
        <div className="card divide-y divide-border max-h-96 overflow-y-auto">
          {artists.map((a) => (
            <div key={a.id} className="flex items-center gap-3 p-3">
              <span className="flex-1">{a.name}</span>
              <span className="text-xs text-ink-muted whitespace-nowrap">
                {artistCounts[a.name] ?? 0} product{(artistCounts[a.name] ?? 0) === 1 ? "" : "s"}
              </span>
              <DeleteTaxonomyButton action={deleteArtistAction} id={a.id} label="Delete" itemName={a.name} />
            </div>
          ))}
          {artists.length === 0 && <p className="p-3 text-sm text-ink-muted">No artists yet.</p>}
        </div>
        <form action={createArtistAction} className="flex items-center gap-2 mt-3">
          <input name="name" required placeholder="New artist" className="field-input py-1 max-w-xs" />
          <button type="submit" className="btn btn-primary btn-sm">
            Add Artist
          </button>
        </form>
      </section>
    </div>
  );
}
