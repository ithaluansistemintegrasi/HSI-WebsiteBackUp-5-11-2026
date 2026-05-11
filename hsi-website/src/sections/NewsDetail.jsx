import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../admin/api";
import DOMPurify from "dompurify";

export default function NewsDetail() {
  const { slug } = useParams();
  const { i18n, t } = useTranslation();
  const lang = i18n.language === "en" ? "en" : "id";

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
  const toAbs = (p) => (!p ? "" : p.startsWith("http") ? p : `${API_BASE}${p}`);

  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let on = true;
    setLoading(true);
    setErr("");

    apiFetch(`/news/${slug}?lang=${lang}`)
      .then((r) => (on ? setData(r) : null))
      .catch((e) => (on ? setErr(String(e?.message || e)) : null))
      .finally(() => (on ? setLoading(false) : null));

    return () => {
      on = false;
    };
  }, [slug, lang]);

  useEffect(() => {
    if (data?.title) {
      document.title = `${data.title} | PT Haluan Sistem Integrasi`;
    } else if (loading) {
      document.title = "Loading Article... | PT Haluan Sistem Integrasi";
    } else {
      document.title = "Berita | PT Haluan Sistem Integrasi";
    }

    return () => {
      document.title = "PT Haluan Sistem Integrasi";
    };
  }, [data, loading]);

  if (loading)
    return <div className="max-w-4xl mx-auto px-4 py-10">Loading...</div>;
  if (err)
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 text-red-600">{err}</div>
    );
  if (!data) return null;

  const dateValue = data.publishedAt || data.createdAt;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <Link to="/news" className="text-sm text-gray-600 hover:underline">
        ← {t("common.back")}
      </Link>

      <h1 className="mt-4 text-3xl font-bold">{data.title}</h1>

      {/* kalau kamu mau tanggal di bawah judul, boleh keep ini, atau hapus biar tidak dobel */}
      <p className="mt-2 text-sm text-gray-500">
        {dateValue ? new Date(dateValue).toLocaleDateString("id-ID") : ""}
      </p>

      {data.coverImage ? (
        <img
          src={toAbs(data.coverImage)}
          alt={data.title}
          className="mt-6 w-full rounded-xl border object-cover"
        />
      ) : null}

      {/* ✅ Meta tepat di bawah cover image */}
      <div className="my-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
        <span>
          By{" "}
          <span className="font-medium text-slate-800">
            {data.authorName || "Admin"}
          </span>
        </span>

        <span className="opacity-40">•</span>

        <time dateTime={dateValue || undefined}>
          {dateValue
            ? new Date(dateValue).toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })
            : ""}
        </time>
      </div>

      <div
        className="prose max-w-none"
        dangerouslySetInnerHTML={{
          __html: DOMPurify.sanitize(data.content || ""),
        }}
      />
    </div>
  );
}
