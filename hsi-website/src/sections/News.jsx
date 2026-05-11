import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../admin/api";

export default function News() {
  useEffect(() => {
    document.title = "Blog Artikel | PT Haluan Sistem Integrasi";
  }, []);

  const { i18n, t } = useTranslation();
  const lang = i18n.language === "en" ? "en" : "id";

  // gambar upload diserve dari backend (8080), jadi harus jadi URL absolut
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
  const toAbs = (p) => (!p ? "" : p.startsWith("http") ? p : `${API_BASE}${p}`);

  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let on = true;
    setLoading(true);
    setErr("");

    apiFetch(`/news?lang=${lang}&page=1&limit=20`)
      .then((r) => (on ? setItems(r.items || []) : null))
      .catch((e) => (on ? setErr(String(e?.message || e)) : null))
      .finally(() => (on ? setLoading(false) : null));

    return () => {
      on = false;
    };
  }, [lang]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold">{t("nav.news")}</h1>
      <p className="mt-2 text-sm text-gray-600">
        {lang === "en"
          ? "News & latest updates."
          : "Halaman berita / update terbaru."}
      </p>

      {loading && <p className="mt-6">Loading...</p>}
      {err && <p className="mt-6 text-red-600">{err}</p>}

      <div className="mt-8 grid gap-6">
        {items.map((n) => (
          <Link
            key={n.id}
            to={`/news/${n.slug}`}
            className="group rounded-2xl border border-sky-200 bg-white hover:shadow-md transition overflow-hidden"
          >
            <div className="flex flex-col md:flex-row">
              {/* image left */}
              <div className="md:w-[220px] w-full bg-gray-100">
                {n.coverImage ? (
                  <img
                    src={toAbs(n.coverImage)}
                    alt={n.title}
                    className="h-[180px] md:h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-[180px] md:h-full w-full" />
                )}
              </div>

              {/* content right */}
              <div className="flex-1 p-5 relative">
                {/* date top-right */}
                <div className="absolute right-5 top-5 text-xs text-gray-500">
                  {n.publishedAt
                    ? new Date(n.publishedAt).toLocaleDateString(
                        lang === "en" ? "en-US" : "id-ID",
                      )
                    : ""}
                </div>

                <h2 className="text-lg font-semibold text-gray-900">
                  {n.title || (lang === "en" ? "Untitled" : "Tanpa judul")}
                </h2>

                <p className="mt-1 text-sm text-gray-700 line-clamp-2 max-w-3xl">
                  {n.excerpt || ""}
                </p>

                {/* read more bottom-right */}
                <div className="mt-6 flex justify-end">
                  <span className="text-sm text-gray-700 group-hover:underline">
                    {lang === "en" ? "Read more" : "Baca Selengkapnya"} &gt;
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}

        {!loading && !err && items.length === 0 ? (
          <div className="rounded-2xl border bg-white p-6 text-gray-600">
            {lang === "en" ? "No news yet." : "Belum ada berita."}
          </div>
        ) : null}
      </div>
    </div>
  );
}
