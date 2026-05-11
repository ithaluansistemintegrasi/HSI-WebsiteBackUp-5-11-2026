import { useEffect, useMemo, useState } from "react";
import { apiFetch, apiUrl } from "../api";

export default function AdminBanners() {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");

  // create form
  const [title, setTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [sortOrder, setSortOrder] = useState(1);
  const [isActive, setIsActive] = useState(false);
  const [imageFile, setImageFile] = useState(null);

  async function fetchList() {
    setErr("");
    setLoading(true);
    try {
      const json = await apiFetch("/banners");
      setTitle("");
      setLinkUrl("");
      setSortOrder(1);
      setIsActive(false);
      setImageFile(null);
      setItems(Array.isArray(json?.items) ? json.items : []);
    } catch (e) {
      setErr(e?.message || "Failed to fetch banners");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchList();
  }, []);

  async function createBanner(e) {
    e.preventDefault();
    if (!imageFile) return setErr("Pilih file gambar dulu.");

    setErr("");
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("title", title);
      fd.append("linkUrl", linkUrl);
      fd.append("sortOrder", String(sortOrder));
      fd.append("isActive", String(isActive));
      fd.append("image", imageFile);

      // pakai fetch langsung karena FormData (apiFetch sekarang JSON-oriented)
      const res = await fetch(apiUrl("/banners"), {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: localStorage.getItem("hsi_admin_token")
            ? `Bearer ${localStorage.getItem("hsi_admin_token")}`
            : "",
        },
        body: fd,
      });

      const text = await res.text();
      const json = text ? JSON.parse(text) : null;
      if (!res.ok) throw new Error(json?.message || "Create failed");

      setImageFile(null);
      await fetchList();
    } catch (e2) {
      setErr(e2?.message || "Create error");
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(id, nextActive) {
    setErr("");
    setLoading(true);
    try {
      await apiFetch(`/banners/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextActive }),
      });
      await fetchList();
    } catch (e) {
      setErr(e?.message || "Toggle error");
    } finally {
      setLoading(false);
    }
  }

  async function deleteBanner(id) {
    if (!confirm("Hapus banner ini?")) return;

    setErr("");
    setLoading(true);
    try {
      await apiFetch(`/banners/${id}`, { method: "DELETE" });
      await fetchList();
    } catch (e) {
      setErr(e?.message || "Delete error");
    } finally {
      setLoading(false);
    }
  }

  async function updateMeta(id, patch) {
    setErr("");
    setLoading(true);
    try {
      await apiFetch(`/banners/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      await fetchList();
    } catch (e) {
      setErr(e?.message || "Update error");
    } finally {
      setLoading(false);
    }
  }

  async function updateImage(id, file) {
    if (!file) return;

    setErr("");
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);

      const token = localStorage.getItem("hsi_admin_token") || "";
      const res = await fetch(apiUrl(`/banners/${id}`), {
        method: "PATCH",
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: fd,
      });

      const text = await res.text();
      const json = text ? JSON.parse(text) : null;
      if (!res.ok) throw new Error(json?.message || "Update image failed");

      await fetchList();
    } catch (e) {
      setErr(e?.message || "Update image error");
    } finally {
      setLoading(false);
    }
  }

  const activeId = useMemo(() => items.find((x) => x.isActive)?.id, [items]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xl font-semibold text-slate-900">Banner</div>
          <div className="text-sm text-slate-600 mt-1">
            Kelola Season Greeting (ON/OFF, upload, edit, delete).
          </div>
        </div>

        <button
          onClick={fetchList}
          disabled={loading}
          className="px-3 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-60 text-sm"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {err ? (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {err}
        </div>
      ) : null}

      {/* CREATE */}
      <form
        onSubmit={createBanner}
        className="mt-6 bg-slate-50 rounded-xl border border-slate-200 p-5"
      >
        <div className="font-medium text-slate-900">Tambah Banner</div>

        <div className="mt-4 grid gap-3">
          <input
            className="border rounded-lg px-3 py-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
          />

          <input
            className="border rounded-lg px-3 py-2"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="Link URL (optional)"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              className="border rounded-lg px-3 py-2"
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              placeholder="Sort order"
            />

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              Set sebagai ACTIVE (ON)
            </label>
          </div>

          <input
            className="border rounded-lg px-3 py-2"
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
          />

          <button
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white disabled:opacity-60"
          >
            {loading ? "Loading..." : "Upload Banner"}
          </button>

          <div className="text-xs text-slate-500">
            Catatan: jika ACTIVE di-ON-kan, backend akan mematikan banner lain
            (cuma 1 aktif).
          </div>
        </div>
      </form>

      {/* LIST */}
      <div className="mt-6 grid gap-4">
        {items.length === 0 ? (
          <div className="text-sm text-slate-600">Belum ada banner.</div>
        ) : null}

        {items.map((b) => (
          <BannerCard
            key={b.id}
            b={b}
            isActive={b.id === activeId}
            loading={loading}
            onToggle={(next) => toggleActive(b.id, next)}
            onDelete={() => deleteBanner(b.id)}
            onUpdateMeta={(patch) => updateMeta(b.id, patch)}
            onUpdateImage={(file) => updateImage(b.id, file)}
          />
        ))}
      </div>
    </div>
  );
}

function BannerCard({
  b,
  isActive,
  loading,
  onToggle,
  onDelete,
  onUpdateMeta,
  onUpdateImage,
}) {
  const [editTitle, setEditTitle] = useState(b.title || "");
  const [editLink, setEditLink] = useState(b.linkUrl || "");
  const [editOrder, setEditOrder] = useState(b.sortOrder ?? 0);

  const imageSrc = b.imageUrl?.startsWith("http")
    ? b.imageUrl
    : apiUrl(b.imageUrl);

  return (
    <div className="border border-slate-200 rounded-xl p-4">
      <div className="flex flex-col md:flex-row items-start gap-4">
        <div className="w-full md:w-56 shrink-0">
          <div className="aspect-[16/9] bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
            <img
              src={imageSrc}
              alt={b.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="mt-2 text-xs text-slate-500 break-all">
            {b.imageUrl}
          </div>
        </div>

        <div className="flex-1 w-full">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                isActive
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {isActive ? "ACTIVE (ON)" : "OFF"}
            </span>
            <span className="text-xs text-slate-500 break-all">ID: {b.id}</span>
          </div>

          <div className="mt-3 grid gap-2">
            <input
              className="border rounded-lg px-3 py-2 text-sm"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Title"
            />
            <input
              className="border rounded-lg px-3 py-2 text-sm"
              value={editLink}
              onChange={(e) => setEditLink(e.target.value)}
              placeholder="Link URL"
            />
            <input
              className="border rounded-lg px-3 py-2 text-sm"
              type="number"
              value={editOrder}
              onChange={(e) => setEditOrder(Number(e.target.value))}
              placeholder="Sort order"
            />

            <div className="flex flex-wrap gap-2 mt-1">
              <button
                type="button"
                disabled={loading}
                onClick={() => onToggle(!isActive)}
                className="px-3 py-2 rounded-lg bg-slate-900 text-white text-sm disabled:opacity-60"
              >
                {isActive ? "Turn OFF" : "Turn ON"}
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  onUpdateMeta({
                    title: editTitle,
                    linkUrl: editLink,
                    sortOrder: editOrder,
                  })
                }
                className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm hover:bg-slate-100 disabled:opacity-60"
              >
                Save Meta
              </button>

              <label className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm hover:bg-slate-100 cursor-pointer">
                Ganti Gambar
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onUpdateImage(e.target.files?.[0] || null)}
                />
              </label>

              <button
                type="button"
                disabled={loading}
                onClick={onDelete}
                className="px-3 py-2 rounded-lg bg-red-600 text-white text-sm disabled:opacity-60"
              >
                Delete
              </button>
            </div>

            {b.linkUrl ? (
              <a
                className="text-xs text-blue-600 underline mt-2 inline-block"
                href={b.linkUrl}
                target="_blank"
                rel="noreferrer"
              >
                Open Link
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
