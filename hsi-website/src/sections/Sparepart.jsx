import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:8080";

const formatIDR = (n) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));

async function fetchJson(url) {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  if (!res.ok)
    throw new Error(json?.message || `Request failed (${res.status})`);
  return json;
}

function pickLang(i18nLang) {
  // i18next biasanya "id" / "en" atau "id-ID"
  return String(i18nLang || "id")
    .toLowerCase()
    .startsWith("en")
    ? "en"
    : "id";
}

function joinImage(path) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
}

export default function SparePart() {
  const { t, i18n } = useTranslation();
  const lang = pickLang(i18n.language);

  const [err, setErr] = useState("");
  const [loadingCats, setLoadingCats] = useState(false);
  const [loadingParts, setLoadingParts] = useState(false);

  const [categories, setCategories] = useState([]);
  const [selectedCatId, setSelectedCatId] = useState("");

  const [products, setProducts] = useState([]);
  const [activeProduct, setActiveProduct] = useState(null);

  useEffect(() => {
    document.title = "Spare Part | PT Haluan Sistem Integrasi";
  }, []);

  // load categories from API
  useEffect(() => {
    let alive = true;
    (async () => {
      setErr("");
      setLoadingCats(true);
      try {
        const data = await fetchJson(`${API_BASE}/spareparts/categories`);
        if (!alive) return;
        setCategories(data || []);
        if (!selectedCatId && data?.[0]?.id)
          setSelectedCatId(String(data[0].id));
      } catch (e) {
        if (!alive) return;
        setErr(e.message);
      } finally {
        if (alive) setLoadingCats(false);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // load products by categoryId
  useEffect(() => {
    if (!selectedCatId) {
      setProducts([]);
      return;
    }

    let alive = true;
    (async () => {
      setErr("");
      setLoadingParts(true);
      try {
        const data = await fetchJson(
          `${API_BASE}/spareparts?categoryId=${encodeURIComponent(selectedCatId)}`,
        );
        if (!alive) return;

        // only show active items on public page
        const activeOnly = (data || []).filter((x) => x?.isActive !== false);

        // map to UI shape used by existing component
        const mapped = activeOnly.map((p) => ({
          id: p.id,
          title:
            lang === "en" ? p.titleEn || p.titleId : p.titleId || p.titleEn,
          desc:
            lang === "en"
              ? p.descEn || p.descId || ""
              : p.descId || p.descEn || "",
          price: p.price,
          image:
            joinImage(p.image) ||
            "https://via.placeholder.com/800x600.png?text=No+Image",
          raw: p,
        }));

        setProducts(mapped);
      } catch (e) {
        if (!alive) return;
        setErr(e.message);
      } finally {
        if (alive) setLoadingParts(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [selectedCatId, lang]);

  // language-aware category label
  const categoryOptions = useMemo(() => {
    return (categories || []).map((c) => ({
      id: c.id,
      label: lang === "en" ? c.nameEn || c.nameId : c.nameId || c.nameEn,
    }));
  }, [categories, lang]);

  // keep selection valid if categories reload
  useEffect(() => {
    const ids = categoryOptions.map((c) => String(c.id));
    if (selectedCatId && ids.includes(String(selectedCatId))) return;
    if (ids[0]) setSelectedCatId(ids[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryOptions]);

  const navigate = useNavigate();
  const location = useLocation();

  const closeModal = () => setActiveProduct(null);

  // ESC to close modal
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && closeModal();
    if (activeProduct) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [activeProduct]);

  // ✅ single function for "Contact Us"
  const goToContact = () => {
    closeModal();

    if (location.pathname === "/") {
      const el = document.getElementById("contact");
      if (el) el.scrollIntoView({ behavior: "smooth" });
      return;
    }
    navigate("/?section=contact");
  };

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-6 py-10 md:py-14">
        <h1 className="text-center text-2xl md:text-3xl font-medium text-gray-900">
          {t("sparepart.title")}
        </h1>

        {err && (
          <div className="mt-4 mx-auto max-w-2xl p-3 rounded border border-red-300 bg-red-50 text-red-700 text-sm">
            {err}
          </div>
        )}

        {/* Dropdown */}
        <div className="mt-4 flex justify-center">
          <select
            value={selectedCatId}
            onChange={(e) => setSelectedCatId(e.target.value)}
            className="w-[260px] md:w-[360px] h-9 rounded border border-gray-300 bg-white px-3 text-sm outline-none focus:border-blue-400"
            aria-label={t("sparepart.categorySelectAria")}
            disabled={loadingCats}
          >
            {categoryOptions.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Cards */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setActiveProduct(p)}
              className="text-left rounded border border-[#B9D8EA] bg-white shadow-sm transition hover:shadow-md"
              disabled={loadingParts}
            >
              <div className="p-6">
                <div className="w-full rounded border border-[#B9D8EA] overflow-hidden bg-gray-100">
                  <img
                    src={p.image}
                    alt={p.title}
                    className="w-full h-[170px] object-cover"
                    loading="lazy"
                  />
                </div>

                <div className="mt-5 flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {p.title}
                    </div>
                    <div className="mt-1 text-xs text-gray-600 line-clamp-2">
                      {p.desc}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-gray-500">
                      {t("sparepart.startingFrom")}
                    </div>
                    <div className="text-sm font-semibold text-gray-900">
                      {formatIDR(p.price)}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                  <span>{t("sparepart.viewDetails")}</span>
                  <span aria-hidden>&gt;</span>
                </div>
              </div>
            </button>
          ))}

          {!loadingParts && products.length === 0 && (
            <div className="col-span-full text-center text-sm text-gray-500">
              {t("sparepart.empty") || "Belum ada sparepart di kategori ini."}
            </div>
          )}
        </div>
      </div>

      {/* MODAL */}
      {activeProduct && (
        <Modal
          product={activeProduct}
          onClose={closeModal}
          onContact={goToContact}
        />
      )}
    </section>
  );
}

function Modal({ product, onClose, onContact }) {
  const { t } = useTranslation();

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 px-4"
      onMouseDown={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="relative w-full max-w-4xl bg-white rounded-md shadow-lg overflow-hidden"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-red-500 text-3xl leading-none hover:opacity-80 z-10"
          aria-label={t("sparepart.close")}
        >
          ×
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="bg-gray-100">
            <img
              src={product.image}
              alt={product.title}
              className="w-full h-[320px] md:h-full object-contain p-6"
            />
          </div>

          <div className="p-6 md:p-8">
            <h3 className="text-xl md:text-2xl font-semibold text-gray-900">
              {product.title}
            </h3>

            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1">
              <span className="text-xs text-slate-600">
                {t("sparepart.price")}
              </span>
              <span className="text-sm font-semibold text-slate-900">
                {formatIDR(product.price)}
              </span>
            </div>

            <p className="mt-4 text-sm md:text-base text-gray-700 leading-relaxed">
              {product.desc}
            </p>

            <button
              type="button"
              onClick={onContact}
              className="mt-6 inline-flex items-center justify-center w-full h-11 rounded-full bg-[#5D9FC7] text-white text-sm font-semibold hover:opacity-90 transition"
            >
              {t("sparepart.contactUs")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
