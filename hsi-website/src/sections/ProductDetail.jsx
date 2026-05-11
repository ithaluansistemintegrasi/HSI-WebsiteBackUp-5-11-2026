import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

function resolveImageUrl(apiBase, imageUrl) {
  if (!imageUrl) return "";
  return imageUrl.startsWith("http") ? imageUrl : `${apiBase}${imageUrl}`;
}

function normalizeSpecifications(rows) {
  if (!Array.isArray(rows)) return [];

  return rows
    .map((row) => ({
      label: String(row?.label || "").trim(),
      value: String(row?.value || "").trim(),
    }))
    .filter((row) => row.label || row.value);
}

export default function ProductDetail() {
  const { slug } = useParams();
  const API_BASE =
    import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ||
    "http://localhost:8080";

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [activeProductItem, setActiveProductItem] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function run() {
      setLoading(true);
      setErr("");
      setActiveProductItem(null);

      try {
        const res = await fetch(`${API_BASE}/products/${slug}`);
        const data = await res.json().catch(() => null);

        if (!res.ok) {
          throw new Error(data?.message || `Request failed (${res.status})`);
        }

        if (mounted) setItem(data);
      } catch (e) {
        if (mounted) setErr(e.message || "Gagal memuat produk");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    run();

    return () => {
      mounted = false;
    };
  }, [API_BASE, slug]);

  useEffect(() => {
    if (item?.name) {
      document.title = `${item.name} | PT Haluan Sistem Integrasi`;
      return;
    }

    document.title = "Produk | PT Haluan Sistem Integrasi";
  }, [item]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setActiveProductItem(null);
    };

    if (activeProductItem) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [activeProductItem]);

  const imageUrl = useMemo(
    () => resolveImageUrl(API_BASE, item?.imageUrl),
    [API_BASE, item?.imageUrl],
  );

  const productItems = item?.items || [];

  if (loading) {
    return <div className="max-w-6xl mx-auto px-6 py-12">Loading...</div>;
  }

  if (err) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-12 text-red-600">{err}</div>
    );
  }

  if (!item) return null;

  return (
    <section className="bg-white">
      <div className="max-w-6xl mx-auto px-6 py-10 md:py-14">
        <Link
          to="/?section=products"
          className="text-sm text-slate-600 hover:underline"
        >
          &lt; Kembali ke produk
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] items-start">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 overflow-hidden">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={item.name}
                className="w-full h-[320px] md:h-[480px] object-contain"
              />
            ) : (
              <div className="w-full h-[320px] md:h-[480px] flex items-center justify-center text-slate-400">
                No image
              </div>
            )}
          </div>

          <div>
            {item.category ? (
              <div className="inline-flex rounded-full bg-sky-100 text-sky-700 px-3 py-1 text-xs font-medium">
                {item.category}
              </div>
            ) : null}

            <h1 className="mt-4 text-3xl md:text-4xl font-semibold text-slate-900">
              {item.name}
            </h1>

            <div className="mt-3 text-sm text-slate-500">Slug: {item.slug}</div>

            <p className="mt-6 text-slate-700 leading-relaxed whitespace-pre-line">
              {item.description || "Detail produk ini belum ditambahkan."}
            </p>
          </div>
        </div>

        <div className="mt-12">
          <div className="flex items-end justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">
                Products
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Klik card item untuk melihat detail dalam popup.
              </p>
            </div>

            <div className="text-sm text-slate-500">
              {productItems.length} item tersedia
            </div>
          </div>

          {productItems.length ? (
            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {productItems.map((productItem) => {
                const isActive = activeProductItem?.id === productItem.id;
                const itemImageUrl = resolveImageUrl(
                  API_BASE,
                  productItem.imageUrl,
                );

                return (
                  <button
                    key={productItem.id}
                    type="button"
                    onClick={() => setActiveProductItem(productItem)}
                    className={[
                      "group text-left rounded-2xl overflow-hidden border bg-white transition-all",
                      "hover:-translate-y-0.5 hover:shadow-lg",
                      isActive
                        ? "border-sky-400 ring-2 ring-sky-100 shadow-lg"
                        : "border-sky-100 shadow-sm",
                    ].join(" ")}
                  >
                    <div className="bg-slate-50 h-60 overflow-hidden">
                      {itemImageUrl ? (
                        <img
                          src={itemImageUrl}
                          alt={productItem.name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          No image
                        </div>
                      )}
                    </div>

                    <div className="p-5">
                      <h3 className="text-xl font-semibold text-slate-900">
                        {productItem.name}
                      </h3>

                      <p className="mt-3 text-slate-600 leading-relaxed line-clamp-3">
                        {productItem.description ||
                          "Detail item belum ditambahkan."}
                      </p>

                      <div className="mt-5 text-sm text-blue-600">
                        Click to view details
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 px-5 py-8 text-slate-500">
              Belum ada product item untuk slug ini.
            </div>
          )}
        </div>
      </div>

      {activeProductItem ? (
        <ProductItemModal
          apiBase={API_BASE}
          item={activeProductItem}
          onClose={() => setActiveProductItem(null)}
        />
      ) : null}
    </section>
  );
}

function ProductItemModal({ apiBase, item, onClose }) {
  const itemImageUrl = resolveImageUrl(apiBase, item?.imageUrl);
  const brandLogoUrl = resolveImageUrl(apiBase, item?.brandLogoUrl);
  const specifications = normalizeSpecifications(item?.specifications);

  return (
    <div
      className="fixed inset-0 z-[999] bg-black/45 flex items-center justify-center px-4 py-4 md:py-8"
      onMouseDown={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-5xl max-h-[calc(100vh-2rem)] md:max-h-[calc(100vh-4rem)] overflow-hidden rounded-2xl bg-white shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-4 z-10 text-4xl leading-none text-red-500 hover:opacity-80"
          aria-label="Close popup"
        >
          ×
        </button>

        <div className="grid max-h-[inherit] overflow-y-auto md:grid-cols-2 md:overflow-hidden">
          <div className="bg-slate-50 min-h-[240px] md:min-h-0">
            <div className="relative min-h-[240px] md:min-h-0 md:h-full">
              {itemImageUrl ? (
                <img
                  src={itemImageUrl}
                  alt={item.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full min-h-[240px] md:min-h-0 flex items-center justify-center text-slate-400">
                  No image
                </div>
              )}

              {brandLogoUrl ? (
                <div className="absolute bottom-4 right-4 inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 bg-white/95 px-4 py-2 shadow-lg backdrop-blur">
                  <img
                    src={brandLogoUrl}
                    alt={`${item.name} brand logo`}
                    className="h-8 max-w-36 object-contain"
                  />
                </div>
              ) : null}
            </div>
          </div>

          <div className="p-6 md:max-h-[inherit] md:overflow-y-auto md:p-10">
            <h3 className="text-3xl font-semibold text-slate-900">
              {item.name}
            </h3>
            <p className="mt-6 text-slate-600 text-lg leading-relaxed whitespace-pre-line">
              {item.description || "Detail item belum ditambahkan."}
            </p>

            {specifications.length ? (
              <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200">
                <div className="bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
                  Specification
                </div>
                <table className="w-full border-collapse text-sm md:text-base">
                  <tbody>
                    {specifications.map((row, index) => (
                      <tr
                        key={`${row.label}-${index}`}
                        className="border-t border-slate-200 first:border-t-0"
                      >
                        <td className="w-[34%] bg-slate-50 px-4 py-3 font-medium text-slate-700">
                          {row.label || "-"}
                        </td>
                        <td className="px-4 py-3 text-slate-900">
                          {row.value || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            {item.linkUrl ? (
              <a
                href={item.linkUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl border border-sky-200 bg-sky-50 px-5 py-2 text-sm font-semibold text-sky-700 transition hover:border-sky-300 hover:bg-sky-100"
              >
                Visit Product Link
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
