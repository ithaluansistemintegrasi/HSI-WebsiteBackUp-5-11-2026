import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api";

const formatIDR = (n) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));

export default function AdminSpareParts() {
  const [err, setErr] = useState("");
  const [loadingCats, setLoadingCats] = useState(false);
  const [loadingParts, setLoadingParts] = useState(false);

  // categories
  const [cats, setCats] = useState([]);
  const [selectedCatId, setSelectedCatId] = useState("");

  // category create/edit
  const [catForm, setCatForm] = useState({
    id: null,
    key: "",
    nameId: "",
    nameEn: "",
    sort: 0,
  });

  // spareparts
  const [parts, setParts] = useState([]);
  const [partForm, setPartForm] = useState({
    id: null,
    categoryId: "",
    titleId: "",
    titleEn: "",
    descId: "",
    descEn: "",
    price: 0,
    sort: 0,
    isActive: true,
  });
  const [imageFile, setImageFile] = useState(null);

  const selectedCat = useMemo(
    () => cats.find((c) => String(c.id) === String(selectedCatId)) || null,
    [cats, selectedCatId],
  );

  const API_BASE =
    import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ||
    "https://api.darul.hsi-fablab.com";

  async function loadCats() {
    setErr("");
    setLoadingCats(true);
    try {
      const data = await apiFetch("/spareparts/categories");
      setCats(data || []);
      if (!selectedCatId && data?.[0]?.id) setSelectedCatId(String(data[0].id));
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoadingCats(false);
    }
  }

  async function loadParts() {
    if (!selectedCatId) {
      setParts([]);
      return;
    }
    setErr("");
    setLoadingParts(true);
    try {
      const data = await apiFetch(
        `/spareparts?categoryId=${encodeURIComponent(selectedCatId)}`,
      );
      setParts(data || []);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoadingParts(false);
    }
  }

  useEffect(() => {
    loadCats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadParts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCatId]);

  // ===== CATEGORY =====
  function startNewCategory() {
    setCatForm({ id: null, key: "", nameId: "", nameEn: "", sort: 0 });
  }

  function startEditCategory(c) {
    setCatForm({
      id: c.id,
      key: c.key || "",
      nameId: c.nameId || "",
      nameEn: c.nameEn || "",
      sort: Number(c.sort || 0),
    });
  }

  async function saveCategory(e) {
    e.preventDefault();
    setErr("");

    try {
      if (!catForm.key.trim() || !catForm.nameId.trim()) {
        setErr("Category key & nameId wajib diisi");
        return;
      }

      if (catForm.id) {
        await apiFetch(`/spareparts/categories/${catForm.id}`, {
          method: "PATCH",
          body: {
            key: catForm.key.trim(),
            nameId: catForm.nameId.trim(),
            nameEn: catForm.nameEn.trim(),
            sort: Number(catForm.sort || 0),
          },
        });
      } else {
        await apiFetch("/spareparts/categories", {
          method: "POST",
          body: {
            key: catForm.key.trim(),
            nameId: catForm.nameId.trim(),
            nameEn: catForm.nameEn.trim(),
            sort: Number(catForm.sort || 0),
          },
        });
      }

      await loadCats();
      startNewCategory();
    } catch (e2) {
      setErr(e2.message);
    }
  }

  async function deleteCategory(id) {
    if (
      !confirm("Hapus kategori? Semua sparepart di kategori ini ikut terhapus.")
    )
      return;
    setErr("");
    try {
      await apiFetch(`/spareparts/categories/${id}`, { method: "DELETE" });
      setSelectedCatId("");
      setParts([]);
      await loadCats();
    } catch (e) {
      setErr(e.message);
    }
  }

  // ===== SPAREPART =====
  function startNewPart() {
    setPartForm({
      id: null,
      categoryId: selectedCatId || "",
      titleId: "",
      titleEn: "",
      descId: "",
      descEn: "",
      price: 0,
      sort: 0,
      isActive: true,
    });
    setImageFile(null);
  }

  function startEditPart(p) {
    setPartForm({
      id: p.id,
      categoryId: String(p.categoryId),
      titleId: p.titleId || "",
      titleEn: p.titleEn || "",
      descId: p.descId || "",
      descEn: p.descEn || "",
      price: Number(p.price || 0),
      sort: Number(p.sort || 0),
      isActive: !!p.isActive,
    });
    setImageFile(null);
  }

  async function savePart(e) {
    e.preventDefault();
    setErr("");

    try {
      if (!partForm.categoryId || !partForm.titleId.trim()) {
        setErr("categoryId & titleId wajib diisi");
        return;
      }

      const fd = new FormData();
      fd.append("categoryId", String(partForm.categoryId));
      fd.append("titleId", partForm.titleId.trim());
      fd.append("titleEn", partForm.titleEn.trim());
      fd.append("descId", partForm.descId.trim());
      fd.append("descEn", partForm.descEn.trim());
      fd.append("price", String(Number(partForm.price || 0)));
      fd.append("sort", String(Number(partForm.sort || 0)));
      fd.append("isActive", String(!!partForm.isActive));
      if (imageFile) fd.append("image", imageFile);

      if (partForm.id) {
        await apiFetch(`/spareparts/${partForm.id}`, {
          method: "PATCH",
          body: fd,
        });
      } else {
        await apiFetch("/spareparts", { method: "POST", body: fd });
      }

      await loadParts();
      startNewPart();
    } catch (e2) {
      setErr(e2.message);
    }
  }

  async function deletePart(id) {
    if (!confirm("Hapus sparepart ini?")) return;
    setErr("");
    try {
      await apiFetch(`/spareparts/${id}`, { method: "DELETE" });
      await loadParts();
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl md:text-2xl font-semibold">
          Admin • Spareparts
        </h1>
        <div className="text-xs opacity-70">
          API: <span className="font-mono">{API_BASE}</span>
        </div>
      </div>

      {err && (
        <div className="p-3 rounded border border-red-300 bg-red-50 text-red-700 text-sm">
          {err}
        </div>
      )}

      {/* CATEGORY */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded border p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold">Categories</div>
            <button
              className="px-3 py-1.5 rounded bg-gray-900 text-white text-sm"
              onClick={startNewCategory}
              type="button"
              disabled={loadingCats}
            >
              + New
            </button>
          </div>

          <select
            className="w-full border rounded px-3 py-2 mb-3"
            value={selectedCatId}
            onChange={(e) => setSelectedCatId(e.target.value)}
          >
            <option value="">-- pilih kategori --</option>
            {cats.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.nameId} ({c.key})
              </option>
            ))}
          </select>

          <div className="max-h-64 overflow-auto border rounded">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-2">Key</th>
                  <th className="text-left p-2">Name (ID)</th>
                  <th className="text-right p-2">Sort</th>
                  <th className="text-right p-2">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {cats.map((c) => (
                  <tr key={c.id} className="border-t">
                    <td className="p-2">{c.key}</td>
                    <td className="p-2">{c.nameId}</td>
                    <td className="p-2 text-right">{c.sort}</td>
                    <td className="p-2 text-right space-x-2">
                      <button
                        className="px-2 py-1 rounded border"
                        onClick={() => startEditCategory(c)}
                        type="button"
                      >
                        Edit
                      </button>
                      <button
                        className="px-2 py-1 rounded border border-red-300 text-red-700"
                        onClick={() => deleteCategory(c.id)}
                        type="button"
                      >
                        Del
                      </button>
                    </td>
                  </tr>
                ))}
                {!cats.length && (
                  <tr>
                    <td className="p-3 text-center opacity-60" colSpan={4}>
                      belum ada kategori
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded border p-4">
          <div className="font-semibold mb-3">
            {catForm.id ? "Edit Category" : "Create Category"}
          </div>

          <form onSubmit={saveCategory} className="space-y-3">
            <div>
              <div className="text-xs opacity-70 mb-1">Key (unique)</div>
              <input
                className="w-full border rounded px-3 py-2"
                value={catForm.key}
                onChange={(e) =>
                  setCatForm((s) => ({ ...s, key: e.target.value }))
                }
                placeholder="contoh: bearing"
              />
            </div>

            <div>
              <div className="text-xs opacity-70 mb-1">Name ID</div>
              <input
                className="w-full border rounded px-3 py-2"
                value={catForm.nameId}
                onChange={(e) =>
                  setCatForm((s) => ({ ...s, nameId: e.target.value }))
                }
                placeholder="contoh: Bearing"
              />
            </div>

            <div>
              <div className="text-xs opacity-70 mb-1">Name EN (optional)</div>
              <input
                className="w-full border rounded px-3 py-2"
                value={catForm.nameEn}
                onChange={(e) =>
                  setCatForm((s) => ({ ...s, nameEn: e.target.value }))
                }
                placeholder="example: Bearing"
              />
            </div>

            <div>
              <div className="text-xs opacity-70 mb-1">Sort</div>
              <input
                type="number"
                className="w-full border rounded px-3 py-2"
                value={catForm.sort}
                onChange={(e) =>
                  setCatForm((s) => ({ ...s, sort: Number(e.target.value) }))
                }
              />
            </div>

            <div className="flex gap-2">
              <button
                className="px-4 py-2 rounded bg-gray-900 text-white"
                type="submit"
              >
                {catForm.id ? "Save" : "Create"}
              </button>
              {catForm.id && (
                <button
                  className="px-4 py-2 rounded border"
                  type="button"
                  onClick={startNewCategory}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* SPAREPARTS */}
      <div className="rounded border p-4 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="font-semibold">
            Spareparts {selectedCat ? `• ${selectedCat.nameId}` : ""}
          </div>
          <button
            className="px-3 py-1.5 rounded bg-gray-900 text-white text-sm"
            onClick={startNewPart}
            type="button"
            disabled={!selectedCatId}
          >
            + New Sparepart
          </button>
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          {/* list */}
          <div className="border rounded overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-2">Image</th>
                  <th className="text-left p-2">Title</th>
                  <th className="text-right p-2">Price</th>
                  <th className="text-right p-2">Active</th>
                  <th className="text-right p-2">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {parts.map((p) => (
                  <tr key={p.id} className="border-t align-top">
                    <td className="p-2">
                      {p.image ? (
                        <img
                          src={`${API_BASE}${p.image}`}
                          alt=""
                          className="w-14 h-14 object-cover rounded border"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded border flex items-center justify-center text-xs opacity-50">
                          no img
                        </div>
                      )}
                    </td>
                    <td className="p-2">
                      <div className="font-medium">{p.titleId}</div>
                      <div className="text-xs opacity-70">sort: {p.sort}</div>
                    </td>
                    <td className="p-2 text-right">{formatIDR(p.price)}</td>
                    <td className="p-2 text-right">
                      {p.isActive ? "Yes" : "No"}
                    </td>
                    <td className="p-2 text-right space-x-2">
                      <button
                        className="px-2 py-1 rounded border"
                        type="button"
                        onClick={() => startEditPart(p)}
                      >
                        Edit
                      </button>
                      <button
                        className="px-2 py-1 rounded border border-red-300 text-red-700"
                        type="button"
                        onClick={() => deletePart(p.id)}
                      >
                        Del
                      </button>
                    </td>
                  </tr>
                ))}
                {!parts.length && (
                  <tr>
                    <td className="p-3 text-center opacity-60" colSpan={5}>
                      {loadingParts ? "loading..." : "belum ada sparepart"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* form */}
          <div className="border rounded p-4">
            <div className="font-semibold mb-3">
              {partForm.id ? "Edit Sparepart" : "Create Sparepart"}
            </div>

            <form onSubmit={savePart} className="space-y-3">
              <div>
                <div className="text-xs opacity-70 mb-1">Category</div>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={partForm.categoryId}
                  onChange={(e) =>
                    setPartForm((s) => ({ ...s, categoryId: e.target.value }))
                  }
                >
                  <option value="">-- pilih --</option>
                  {cats.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.nameId} ({c.key})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="text-xs opacity-70 mb-1">Title ID</div>
                <input
                  className="w-full border rounded px-3 py-2"
                  value={partForm.titleId}
                  onChange={(e) =>
                    setPartForm((s) => ({ ...s, titleId: e.target.value }))
                  }
                  placeholder="contoh: Bearing 6205"
                />
              </div>

              <div>
                <div className="text-xs opacity-70 mb-1">
                  Title EN (optional)
                </div>
                <input
                  className="w-full border rounded px-3 py-2"
                  value={partForm.titleEn}
                  onChange={(e) =>
                    setPartForm((s) => ({ ...s, titleEn: e.target.value }))
                  }
                />
              </div>

              <div>
                <div className="text-xs opacity-70 mb-1">
                  Desc ID (optional)
                </div>
                <textarea
                  className="w-full border rounded px-3 py-2"
                  rows={3}
                  value={partForm.descId}
                  onChange={(e) =>
                    setPartForm((s) => ({ ...s, descId: e.target.value }))
                  }
                />
              </div>

              <div>
                <div className="text-xs opacity-70 mb-1">Price</div>
                <input
                  type="number"
                  className="w-full border rounded px-3 py-2"
                  value={partForm.price}
                  onChange={(e) =>
                    setPartForm((s) => ({
                      ...s,
                      price: Number(e.target.value),
                    }))
                  }
                />
              </div>

              <div>
                <div className="text-xs opacity-70 mb-1">Image (upload)</div>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                />
                <div className="text-xs opacity-60 mt-1">
                  Upload baru untuk replace gambar lama saat edit
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-xs opacity-70 mb-1">Sort</div>
                  <input
                    type="number"
                    className="w-full border rounded px-3 py-2"
                    value={partForm.sort}
                    onChange={(e) =>
                      setPartForm((s) => ({
                        ...s,
                        sort: Number(e.target.value),
                      }))
                    }
                  />
                </div>
                <div className="flex items-end gap-2">
                  <input
                    id="isActive"
                    type="checkbox"
                    checked={partForm.isActive}
                    onChange={(e) =>
                      setPartForm((s) => ({ ...s, isActive: e.target.checked }))
                    }
                  />
                  <label htmlFor="isActive" className="text-sm">
                    Active
                  </label>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  className="px-4 py-2 rounded bg-gray-900 text-white"
                  type="submit"
                >
                  {partForm.id ? "Save" : "Create"}
                </button>
                {partForm.id && (
                  <button
                    className="px-4 py-2 rounded border"
                    type="button"
                    onClick={startNewPart}
                  >
                    Cancel
                  </button>
                )}
              </div>

              <div className="text-xs opacity-60">
                Tip: kalau masih “Failed to fetch”, cek `CORS_ORIGINS` backend
                harus include origin FE (misal `http://localhost:5173`).
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
