import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../api"; // sesuaikan path kalau api.js kamu beda
import RichEditor from "../../components/RichEditor";

function getToken() {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("adminToken") ||
    localStorage.getItem("accessToken") ||
    ""
  );
}

function toDatetimeLocalValue(d) {
  if (!d) return "";
  const dt = new Date(d);
  const pad = (n) => String(n).padStart(2, "0");
  const yyyy = dt.getFullYear();
  const mm = pad(dt.getMonth() + 1);
  const dd = pad(dt.getDate());
  const hh = pad(dt.getHours());
  const mi = pad(dt.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

export default function AdminNews() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language === "en" ? "en" : "id";

  // ✅ FIX: bikin URL gambar jadi absolut ke backend (8080)
  const API_BASE =
    import.meta.env.VITE_API_BASE_URL || "https://api.darul.hsi-fablab.com";
  const toAbs = (p) => (!p ? "" : p.startsWith("http") ? p : `${API_BASE}${p}`);

  const token = useMemo(() => getToken(), []);
  const authHeaders = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token],
  );

  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [rows, setRows] = useState([]);

  const INITIAL = useMemo(
    () => ({
      id: null,
      slug: "",
      titleId: "",
      titleEn: "",
      excerptId: "",
      excerptEn: "",
      contentId: "",
      contentEn: "",
      coverImage: "",
      publishedAt: "",
      isActive: true,
      sort: 0,
    }),
    [],
  );

  const [form, setForm] = useState(INITIAL);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const data = await apiFetch(
        `/news/admin/list?q=${encodeURIComponent(q)}`,
        {
          headers: { ...authHeaders },
        },
      );
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startCreate() {
    setErr("");
    setForm(INITIAL);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startEdit(item) {
    setErr("");
    setForm({
      id: item.id,
      slug: item.slug || "",
      titleId: item.titleId || "",
      titleEn: item.titleEn || "",
      excerptId: item.excerptId || "",
      excerptEn: item.excerptEn || "",
      contentId: item.contentId || "",
      contentEn: item.contentEn || "",
      coverImage: item.coverImage || "",
      publishedAt: item.publishedAt
        ? toDatetimeLocalValue(item.publishedAt)
        : "",
      isActive: item.isActive ?? true,
      sort: item.sort ?? 0,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit(e) {
    e?.preventDefault?.();
    setSaving(true);
    setErr("");

    try {
      const payload = {
        slug: form.slug?.trim() || undefined,
        titleId: form.titleId?.trim(),
        titleEn: form.titleEn?.trim() || null,
        excerptId: form.excerptId?.trim() || null,
        excerptEn: form.excerptEn?.trim() || null,
        contentId: form.contentId || "",
        contentEn: form.contentEn || null,
        coverImage: form.coverImage || null,
        publishedAt: form.publishedAt
          ? new Date(form.publishedAt).toISOString()
          : null,
        isActive: !!form.isActive,
        sort: Number(form.sort || 0),
      };

      if (!payload.titleId) {
        setErr("titleId wajib diisi (judul Indonesia).");
        setSaving(false);
        return;
      }

      if (form.id) {
        await apiFetch(`/news/admin/${form.id}`, {
          method: "PATCH",
          headers: { ...authHeaders },
          body: payload,
        });
      } else {
        await apiFetch(`/news/admin`, {
          method: "POST",
          headers: { ...authHeaders },
          body: payload,
        });
      }

      await load();
      startCreate();
    } catch (e2) {
      setErr(String(e2?.message || e2));
    } finally {
      setSaving(false);
    }
  }

  async function remove(id) {
    const ok = confirm("Hapus berita ini?");
    if (!ok) return;

    setErr("");
    try {
      await apiFetch(`/news/admin/${id}`, {
        method: "DELETE",
        headers: { ...authHeaders },
      });
      await load();
      if (form.id === id) startCreate();
    } catch (e) {
      setErr(String(e?.message || e));
    }
  }

  async function uploadCover(file) {
    if (!file) return;
    setUploading(true);
    setErr("");

    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch(`${API_BASE}/uploads-api/news-cover`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: fd,
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.message || `Upload gagal (${res.status})`);
      }

      if (!data?.url)
        throw new Error("Upload sukses tapi response tidak mengandung url.");
      setForm((p) => ({ ...p, coverImage: data.url }));
    } catch (e) {
      setErr(
        `Upload cover error: ${String(e?.message || e)}. ` +
          `Pastikan backend punya endpoint POST /uploads-api/news-cover (multer) dan sudah di-mount.`,
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl md:text-3xl font-semibold">Admin — News</h1>

        <button
          onClick={startCreate}
          className="px-4 py-2 rounded-xl bg-black text-white hover:opacity-90"
        >
          + Buat Berita
        </button>
      </div>

      {err ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-red-700">
          {err}
        </div>
      ) : null}

      <form onSubmit={submit} className="mt-6 rounded-2xl border bg-white p-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-lg font-semibold">
            {form.id ? `Edit #${form.id}` : "Create News"}
          </h2>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!!form.isActive}
                onChange={(e) =>
                  setForm((p) => ({ ...p, isActive: e.target.checked }))
                }
              />
              Active
            </label>

            <div className="text-sm text-gray-500">
              Lang view: {lang.toUpperCase()}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Slug (optional)</label>
            <input
              value={form.slug}
              onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
              className="mt-1 w-full rounded-xl border px-3 py-2"
              placeholder="contoh: kegiatan-hsi-2026"
            />
            <p className="mt-1 text-xs text-gray-500">
              Kalau kosong, auto dari judul Indonesia.
            </p>
          </div>

          <div>
            <label className="text-sm font-medium">Sort</label>
            <input
              type="number"
              value={form.sort}
              onChange={(e) => setForm((p) => ({ ...p, sort: e.target.value }))}
              className="mt-1 w-full rounded-xl border px-3 py-2"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Judul (ID) *</label>
            <input
              value={form.titleId}
              onChange={(e) =>
                setForm((p) => ({ ...p, titleId: e.target.value }))
              }
              className="mt-1 w-full rounded-xl border px-3 py-2"
              placeholder="Judul berita (Indonesia)"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">Title (EN)</label>
            <input
              value={form.titleEn}
              onChange={(e) =>
                setForm((p) => ({ ...p, titleEn: e.target.value }))
              }
              className="mt-1 w-full rounded-xl border px-3 py-2"
              placeholder="News title (English)"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Excerpt (ID)</label>
            <textarea
              value={form.excerptId}
              onChange={(e) =>
                setForm((p) => ({ ...p, excerptId: e.target.value }))
              }
              className="mt-1 w-full rounded-xl border px-3 py-2 min-h-[90px]"
              placeholder="Ringkasan singkat…"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Excerpt (EN)</label>
            <textarea
              value={form.excerptEn}
              onChange={(e) =>
                setForm((p) => ({ ...p, excerptEn: e.target.value }))
              }
              className="mt-1 w-full rounded-xl border px-3 py-2 min-h-[90px]"
              placeholder="Short summary…"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Published At</label>
            <input
              type="datetime-local"
              value={form.publishedAt}
              onChange={(e) =>
                setForm((p) => ({ ...p, publishedAt: e.target.value }))
              }
              className="mt-1 w-full rounded-xl border px-3 py-2"
            />
            <p className="mt-1 text-xs text-gray-500">
              Kosongkan jika belum ingin publish (tetap bisa Active untuk
              preview).
            </p>
          </div>

          <div>
            <label className="text-sm font-medium">Cover Image</label>

            <div className="mt-1 flex items-center gap-3 flex-wrap">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => uploadCover(e.target.files?.[0])}
                className="block"
              />
              {uploading ? (
                <span className="text-sm text-gray-600">Uploading...</span>
              ) : null}
            </div>

            <input
              value={form.coverImage}
              onChange={(e) =>
                setForm((p) => ({ ...p, coverImage: e.target.value }))
              }
              className="mt-2 w-full rounded-xl border px-3 py-2"
              placeholder="/uploads/news/xxx.jpg (auto setelah upload)"
            />

            {form.coverImage ? (
              <div className="mt-3">
                <img
                  src={toAbs(form.coverImage)} // ✅ FIX UTAMA DI SINI
                  alt="cover"
                  className="w-full max-w-md rounded-xl border object-cover"
                />
              </div>
            ) : null}
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-medium">Content (ID)</label>
            <RichEditor
              value={form.contentId}
              onChange={(html) => setForm((p) => ({ ...p, contentId: html }))}
              placeholder="Tulis artikel (ID)..."
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-medium">Content (EN)</label>
            <RichEditor
              value={form.contentEn}
              onChange={(html) => setForm((p) => ({ ...p, contentEn: html }))}
              placeholder="Write article (EN)..."
            />
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-black text-white hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Saving..." : form.id ? "Update" : "Create"}
          </button>

          <button
            type="button"
            onClick={startCreate}
            className="px-4 py-2 rounded-xl border hover:bg-gray-50"
          >
            Reset
          </button>
        </div>
      </form>

      <div className="mt-8 rounded-2xl border bg-white p-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-lg font-semibold">Daftar News</h2>

          <div className="flex items-center gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="rounded-xl border px-3 py-2"
              placeholder="Search slug / title..."
            />
            <button
              onClick={load}
              className="px-4 py-2 rounded-xl border hover:bg-gray-50"
              disabled={loading}
              type="button"
            >
              {loading ? "Loading..." : "Search"}
            </button>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-3">ID</th>
                <th className="py-2 pr-3">Title</th>
                <th className="py-2 pr-3">Slug</th>
                <th className="py-2 pr-3">Published</th>
                <th className="py-2 pr-3">Active</th>
                <th className="py-2 pr-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((n) => (
                <tr key={n.id} className="border-b">
                  <td className="py-2 pr-3">{n.id}</td>
                  <td className="py-2 pr-3">
                    <div className="font-medium">
                      {lang === "en" ? n.titleEn || n.titleId : n.titleId}
                    </div>
                    <div className="text-xs text-gray-500 line-clamp-1">
                      {lang === "en" ? n.excerptEn || n.excerptId : n.excerptId}
                    </div>
                  </td>
                  <td className="py-2 pr-3">{n.slug}</td>
                  <td className="py-2 pr-3">
                    {n.publishedAt
                      ? new Date(n.publishedAt).toLocaleString("id-ID")
                      : "-"}
                  </td>
                  <td className="py-2 pr-3">{n.isActive ? "Yes" : "No"}</td>
                  <td className="py-2 pr-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEdit(n)}
                        className="px-3 py-1 rounded-lg border hover:bg-gray-50"
                        type="button"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => remove(n.id)}
                        className="px-3 py-1 rounded-lg border border-red-200 text-red-700 hover:bg-red-50"
                        type="button"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {rows.length === 0 && !loading ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-gray-500">
                    Belum ada data.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-xs text-gray-500">
          Tips: kalau mau news tampil di halaman publik, set <b>Active</b> =
          true.
        </p>
      </div>
    </div>
  );
}
