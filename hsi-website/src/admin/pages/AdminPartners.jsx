import { useEffect, useState } from "react";
import { apiFetch, apiUrl } from "../api";

export default function AdminPartners() {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");

  const [name, setName] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [sortOrder, setSortOrder] = useState(1);
  const [isPublished, setIsPublished] = useState(true);
  const [imageFile, setImageFile] = useState(null);

  async function fetchList() {
    setErr("");
    setLoading(true);
    try {
      const json = await apiFetch("/partners");
      setItems(Array.isArray(json?.items) ? json.items : []);
      setName("");
      setLinkUrl("");
      setSortOrder(1);
      setIsPublished(true);
      setImageFile(null);
    } catch (e) {
      setErr(e?.message || "Failed to fetch partners");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchList();
  }, []);

  async function createPartner(e) {
    e.preventDefault();
    if (!name.trim()) return setErr("Nama partner wajib diisi.");
    if (!imageFile) return setErr("Pilih file logo partner dulu.");

    setErr("");
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("name", name);
      fd.append("linkUrl", linkUrl);
      fd.append("sortOrder", String(sortOrder));
      fd.append("isPublished", String(isPublished));
      fd.append("image", imageFile);

      const token = localStorage.getItem("hsi_admin_token") || "";
      const res = await fetch(apiUrl("/partners"), {
        method: "POST",
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: fd,
      });

      const text = await res.text();
      const json = text ? JSON.parse(text) : null;
      if (!res.ok) throw new Error(json?.message || "Create failed");

      await fetchList();
    } catch (e2) {
      setErr(e2?.message || "Create error");
    } finally {
      setLoading(false);
    }
  }

  async function updateMeta(id, patch) {
    setErr("");
    setLoading(true);
    try {
      await apiFetch(`/partners/${id}`, {
        method: "PATCH",
        body: patch,
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
      const res = await fetch(apiUrl(`/partners/${id}`), {
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

  async function deletePartner(id) {
    if (!confirm("Hapus partner ini?")) return;

    setErr("");
    setLoading(true);
    try {
      await apiFetch(`/partners/${id}`, { method: "DELETE" });
      await fetchList();
    } catch (e) {
      setErr(e?.message || "Delete error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xl font-semibold text-slate-900">Partners</div>
          <div className="mt-1 text-sm text-slate-600">
            Kelola logo partner, link website, urutan, dan status tampil.
          </div>
        </div>

        <button
          onClick={fetchList}
          disabled={loading}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-100 disabled:opacity-60"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {err ? (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {err}
        </div>
      ) : null}

      <form
        onSubmit={createPartner}
        className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5"
      >
        <div className="font-medium text-slate-900">Tambah Partner</div>

        <div className="mt-4 grid gap-3">
          <input
            className="rounded-lg border px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama partner"
          />

          <input
            className="rounded-lg border px-3 py-2"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="Website partner (optional)"
          />

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <input
              className="rounded-lg border px-3 py-2"
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              placeholder="Sort order"
            />

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
              />
              Tampilkan di website
            </label>
          </div>

          <input
            className="rounded-lg border px-3 py-2"
            type="file"
            accept="image/*,.svg"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
          />

          <button
            disabled={loading}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-white disabled:opacity-60"
          >
            {loading ? "Loading..." : "Tambah Partner"}
          </button>
        </div>
      </form>

      <div className="mt-6 grid gap-4">
        {items.length === 0 ? (
          <div className="text-sm text-slate-600">Belum ada partner.</div>
        ) : null}

        {items.map((partner) => (
          <PartnerCard
            key={partner.id}
            partner={partner}
            loading={loading}
            onUpdateMeta={(patch) => updateMeta(partner.id, patch)}
            onUpdateImage={(file) => updateImage(partner.id, file)}
            onDelete={() => deletePartner(partner.id)}
          />
        ))}
      </div>
    </div>
  );
}

function PartnerCard({
  partner,
  loading,
  onUpdateMeta,
  onUpdateImage,
  onDelete,
}) {
  const [editName, setEditName] = useState(partner.name || "");
  const [editLink, setEditLink] = useState(partner.linkUrl || "");
  const [editOrder, setEditOrder] = useState(partner.sortOrder ?? 0);
  const [editPublished, setEditPublished] = useState(
    partner.isPublished ?? true,
  );

  const imageSrc = partner.imageUrl?.startsWith("http")
    ? partner.imageUrl
    : apiUrl(partner.imageUrl);

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex flex-col items-start gap-4 md:flex-row">
        <div className="w-full shrink-0 md:w-56">
          <div className="flex aspect-[16/9] items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-100 p-4">
            <img
              src={imageSrc}
              alt={partner.name}
              className="max-h-full max-w-full object-contain"
            />
          </div>
          <div className="mt-2 break-all text-xs text-slate-500">
            {partner.imageUrl}
          </div>
        </div>

        <div className="w-full flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2 py-1 text-xs ${
                partner.isPublished
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {partner.isPublished ? "PUBLISHED" : "HIDDEN"}
            </span>
            <span className="break-all text-xs text-slate-500">
              ID: {partner.id}
            </span>
          </div>

          <div className="mt-3 grid gap-2">
            <input
              className="rounded-lg border px-3 py-2 text-sm"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Nama partner"
            />
            <input
              className="rounded-lg border px-3 py-2 text-sm"
              value={editLink}
              onChange={(e) => setEditLink(e.target.value)}
              placeholder="Website partner"
            />
            <input
              className="rounded-lg border px-3 py-2 text-sm"
              type="number"
              value={editOrder}
              onChange={(e) => setEditOrder(Number(e.target.value))}
              placeholder="Sort order"
            />
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={editPublished}
                onChange={(e) => setEditPublished(e.target.checked)}
              />
              Tampilkan di website
            </label>

            <div className="mt-1 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  onUpdateMeta({
                    name: editName,
                    linkUrl: editLink,
                    sortOrder: editOrder,
                    isPublished: editPublished,
                  })
                }
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-100 disabled:opacity-60"
              >
                Save Meta
              </button>

              <label className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-100">
                Ganti Logo
                <input
                  type="file"
                  accept="image/*,.svg"
                  className="hidden"
                  onChange={(e) => onUpdateImage(e.target.files?.[0] || null)}
                />
              </label>

              <button
                type="button"
                disabled={loading}
                onClick={onDelete}
                className="rounded-lg bg-red-600 px-3 py-2 text-sm text-white disabled:opacity-60"
              >
                Delete
              </button>
            </div>

            {partner.linkUrl ? (
              <a
                className="mt-2 inline-block text-xs text-blue-600 underline"
                href={partner.linkUrl}
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
