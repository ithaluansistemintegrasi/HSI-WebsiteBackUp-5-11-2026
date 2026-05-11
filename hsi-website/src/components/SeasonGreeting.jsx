import { useEffect, useState } from "react";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ||
  "https://api.darul.hsi-fablab.com";

export default function SeasonGreetingPopup({
  // delay sebelum muncul
  delay = 600,

  // posisi / ukuran
  topClass = "top-24",
  leftClass = "left-4",
  widthClass = "w-[260px] sm:w-[300px]",

  // perilaku tampil
  showOncePerLoad = true,

  // optional: auto close
  autoCloseMs = 0,
}) {
  const [open, setOpen] = useState(false);
  const [banner, setBanner] = useState(null); // { title, imageUrl, linkUrl, ... }
  const [loading, setLoading] = useState(true);

  // 1) fetch banner aktif
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/banners/active`, {
          headers: { Accept: "application/json" },
        });
        const json = await res.json();

        // backend kamu return { ok: true, items: [...] }
        const item = Array.isArray(json?.items) ? json.items[0] : null;

        if (!alive) return;
        setBanner(item || null);
      } catch (e) {
        if (!alive) return;
        setBanner(null);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  // 2) logic tampil popup
  useEffect(() => {
    if (loading) return;
    if (!banner) return;

    if (showOncePerLoad && window.__HSI_SEASON_GREETING_SHOWN__ === true)
      return;

    const t = setTimeout(() => {
      setOpen(true);
      if (showOncePerLoad) window.__HSI_SEASON_GREETING_SHOWN__ = true;
    }, delay);

    return () => clearTimeout(t);
  }, [loading, banner, delay, showOncePerLoad]);

  // 3) auto close
  useEffect(() => {
    if (!open) return;
    if (!autoCloseMs || autoCloseMs <= 0) return;

    const t = setTimeout(() => setOpen(false), autoCloseMs);
    return () => clearTimeout(t);
  }, [open, autoCloseMs]);

  const close = () => setOpen(false);

  // kalau belum ada banner aktif, jangan render apa-apa
  if (!open || !banner) return null;

  const imageSrc = banner.imageUrl?.startsWith("http")
    ? banner.imageUrl
    : `${API_BASE}${banner.imageUrl || ""}`;

  const imageAlt = banner.title || "Season Greeting";

  const content = (
    <div className="relative overflow-hidden rounded-xl bg-white shadow-lg border border-black/5 animate-[sgSlideIn_420ms_cubic-bezier(.2,.8,.2,1)]">
      <button
        onClick={close}
        className="absolute right-2 top-2 z-10 rounded-full text-red-700 bg-white/90 backdrop-blur px-2 py-1 text-xs hover:bg-white transition"
        aria-label="Close popup"
      >
        ✕
      </button>

      <div className="relative h-[140px] sm:h-[160px] bg-gray-100">
        <img
          src={imageSrc}
          alt={imageAlt}
          className="absolute inset-0 w-full h-full object-fit"
          loading="lazy"
        />
      </div>

      <style>{`
        @keyframes sgSlideIn {
          0%   { opacity: 0; transform: translateX(-120%) scale(.98); }
          70%  { opacity: 1; transform: translateX(6px) scale(1); }
          100% { opacity: 1; transform: translateX(0) scale(1); }
        }
      `}</style>
    </div>
  );

  return (
    <div
      className={`fixed z-[99999] ${topClass} ${leftClass} ${widthClass}`}
      role="dialog"
      aria-label="Season Greeting"
    >
      {banner.linkUrl ? (
        <a href={banner.linkUrl} target="_blank" rel="noreferrer">
          {content}
        </a>
      ) : (
        content
      )}
    </div>
  );
}
