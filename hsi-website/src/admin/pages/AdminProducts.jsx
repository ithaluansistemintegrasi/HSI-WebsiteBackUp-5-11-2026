import { useEffect, useState } from "react";
import { apiFetch } from "../api";

const EMPTY_SPEC_ROW = { label: "", value: "" };

const INITIAL_PRODUCT_FORM = {
  id: null,
  title: "",
  slug: "",
  description: "",
  category: "",
  sortOrder: 0,
  isPublished: true,
};

const INITIAL_ITEM_FORM = {
  id: null,
  productIds: [],
  title: "",
  description: "",
  specifications: [{ ...EMPTY_SPEC_ROW }],
  linkUrl: "",
  sortOrder: 0,
  isPublished: true,
};

function normalizeSpecifications(rows) {
  if (!Array.isArray(rows)) return [{ ...EMPTY_SPEC_ROW }];

  const cleaned = rows
    .map((row) => ({
      label: String(row?.label || ""),
      value: String(row?.value || ""),
    }))
    .filter((row) => row.label.trim() || row.value.trim());

  return cleaned.length ? cleaned : [{ ...EMPTY_SPEC_ROW }];
}

function normalizeProductIds(ids, fallbackIds = []) {
  const values = Array.isArray(ids) ? ids : [];
  const fallbacks = Array.isArray(fallbackIds) ? fallbackIds : [fallbackIds];

  return [...new Set([...values, ...fallbacks].map(String).filter(Boolean))];
}

export default function AdminProducts() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(INITIAL_PRODUCT_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const [selectedProductId, setSelectedProductId] = useState("");
  const [productItems, setProductItems] = useState([]);
  const [itemForm, setItemForm] = useState(INITIAL_ITEM_FORM);
  const [itemImageFile, setItemImageFile] = useState(null);
  const [itemBrandLogoFile, setItemBrandLogoFile] = useState(null);
  const [loadingItems, setLoadingItems] = useState(false);
  const [savingItem, setSavingItem] = useState(false);
  const [itemErr, setItemErr] = useState("");
  const [selectedProductMeta, setSelectedProductMeta] = useState(null);

  const API_BASE =
    import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ||
    "http://localhost:8080";

  async function loadProducts(preferredProductId) {
    setLoading(true);
    setErr("");

    try {
      const data = await apiFetch("/products/admin/list");
      const nextItems = data || [];
      setItems(nextItems);

      if (preferredProductId) {
        setSelectedProductId(preferredProductId);
      } else if (
        selectedProductId &&
        nextItems.some((item) => item.id === selectedProductId)
      ) {
        setSelectedProductId(selectedProductId);
      } else if (form.id && nextItems.some((item) => item.id === form.id)) {
        setSelectedProductId(form.id);
      } else if (nextItems[0]?.id) {
        setSelectedProductId(nextItems[0].id);
      } else {
        setSelectedProductId("");
      }
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadProductItems(productId) {
    if (!productId) {
      setProductItems([]);
      setSelectedProductMeta(null);
      return;
    }

    setLoadingItems(true);
    setItemErr("");

    try {
      const data = await apiFetch(`/products/admin/${productId}/items`);
      setProductItems(data?.items || []);
      setSelectedProductMeta(data?.product || null);
    } catch (e) {
      setProductItems([]);
      setSelectedProductMeta(null);
      setItemErr(
        e.message === "Request failed (404)"
          ? "Product menu tidak ditemukan. Coba pilih ulang product menu lalu refresh halaman."
          : e.message,
      );
    } finally {
      setLoadingItems(false);
    }
  }

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setItemForm({
      ...INITIAL_ITEM_FORM,
      productIds: selectedProductId ? [selectedProductId] : [],
    });
    setItemImageFile(null);
    setItemBrandLogoFile(null);
    loadProductItems(selectedProductId);
  }, [selectedProductId]);

  function resetForm() {
    setForm(INITIAL_PRODUCT_FORM);
    setImageFile(null);
  }

  function resetItemForm() {
    setItemForm({
      ...INITIAL_ITEM_FORM,
      productIds: selectedProductId ? [selectedProductId] : [],
    });
    setItemImageFile(null);
    setItemBrandLogoFile(null);
  }

  function startEdit(item) {
    setForm({
      id: item.id,
      title: item.name || "",
      slug: item.slug || "",
      description: item.description || "",
      category: item.category || "",
      sortOrder: item.sortOrder ?? 0,
      isPublished: !!item.isPublished,
    });
    setImageFile(null);
    setSelectedProductId(item.id);
  }

  function startEditItem(item) {
    setItemForm({
      id: item.id,
      productIds: normalizeProductIds(item.productIds, [
        item.productId,
        selectedProductId,
      ]),
      title: item.name || "",
      description: item.description || "",
      specifications: normalizeSpecifications(item.specifications),
      linkUrl: item.linkUrl || "",
      sortOrder: item.sortOrder ?? 0,
      isPublished: !!item.isPublished,
    });
    setItemImageFile(null);
    setItemBrandLogoFile(null);
  }

  function toggleItemProduct(productId) {
    setItemForm((prev) => {
      const currentIds = normalizeProductIds(prev.productIds);
      const hasProduct = currentIds.includes(productId);
      const nextIds = hasProduct
        ? currentIds.filter((id) => id !== productId)
        : [...currentIds, productId];

      return {
        ...prev,
        productIds: nextIds,
      };
    });
  }

  function updateSpecificationRow(index, key, value) {
    setItemForm((prev) => ({
      ...prev,
      specifications: normalizeSpecifications(
        prev.specifications.map((row, rowIndex) =>
          rowIndex === index ? { ...row, [key]: value } : row,
        ),
      ),
    }));
  }

  function addSpecificationRow() {
    setItemForm((prev) => ({
      ...prev,
      specifications: [
        ...normalizeSpecifications(prev.specifications),
        { ...EMPTY_SPEC_ROW },
      ],
    }));
  }

  function removeSpecificationRow(index) {
    setItemForm((prev) => ({
      ...prev,
      specifications: normalizeSpecifications(
        prev.specifications.filter((_, rowIndex) => rowIndex !== index),
      ),
    }));
  }

  async function saveProduct(e) {
    e.preventDefault();
    setErr("");

    if (!form.title.trim() || !form.slug.trim()) {
      setErr("Title dan slug wajib diisi");
      return;
    }

    setSaving(true);

    try {
      const fd = new FormData();
      fd.append("title", form.title.trim());
      fd.append("slug", form.slug.trim());
      fd.append("description", form.description.trim());
      fd.append("category", form.category.trim());
      fd.append("sortOrder", String(Number(form.sortOrder) || 0));
      fd.append("isPublished", String(!!form.isPublished));
      if (imageFile) fd.append("image", imageFile);

      let saved;

      if (form.id) {
        saved = await apiFetch(`/products/admin/${form.id}`, {
          method: "PATCH",
          body: fd,
        });
      } else {
        saved = await apiFetch("/products/admin", {
          method: "POST",
          body: fd,
        });
      }

      await loadProducts(saved?.id);
      resetForm();
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setSaving(false);
    }
  }

  async function saveProductItem(e) {
    e.preventDefault();
    setItemErr("");

    if (!selectedProductId) {
      setItemErr("Pilih product menu dulu sebelum menambah item.");
      return;
    }

    if (!itemForm.title.trim()) {
      setItemErr("Title item wajib diisi");
      return;
    }

    const selectedItemProductIds = normalizeProductIds(itemForm.productIds);

    if (!selectedItemProductIds.length) {
      setItemErr("Pilih minimal satu product category untuk item ini.");
      return;
    }

    setSavingItem(true);

    try {
      const fd = new FormData();
      fd.append("productIds", JSON.stringify(selectedItemProductIds));
      fd.append("title", itemForm.title.trim());
      fd.append("description", itemForm.description.trim());
      fd.append(
        "specifications",
        JSON.stringify(
          (itemForm.specifications || [])
            .map((row) => ({
              label: String(row?.label || "").trim(),
              value: String(row?.value || "").trim(),
            }))
            .filter((row) => row.label || row.value),
        ),
      );
      fd.append("linkUrl", itemForm.linkUrl.trim());
      fd.append("sortOrder", String(Number(itemForm.sortOrder) || 0));
      fd.append("isPublished", String(!!itemForm.isPublished));
      if (itemImageFile) fd.append("image", itemImageFile);
      if (itemBrandLogoFile) fd.append("brandLogo", itemBrandLogoFile);

      if (itemForm.id) {
        await apiFetch(`/products/admin/items/${itemForm.id}`, {
          method: "PATCH",
          body: fd,
        });
      } else {
        await apiFetch(`/products/admin/${selectedProductId}/items`, {
          method: "POST",
          body: fd,
        });
      }

      await loadProductItems(selectedProductId);
      await loadProducts(selectedProductId);
      resetItemForm();
    } catch (e) {
      setItemErr(
        e.message === "Request failed (404)"
          ? "Product menu untuk item ini tidak ditemukan. Klik ulang tombol Items pada product yang aktif."
          : e.message,
      );
    } finally {
      setSavingItem(false);
    }
  }

  async function deleteProduct(id) {
    if (!confirm("Hapus produk ini beserta semua product item di dalamnya?"))
      return;

    setErr("");

    try {
      await apiFetch(`/products/admin/${id}`, { method: "DELETE" });
      if (form.id === id) resetForm();
      if (selectedProductId === id) {
        resetItemForm();
        setProductItems([]);
        setSelectedProductMeta(null);
      }
      await loadProducts();
    } catch (e) {
      setErr(e.message);
    }
  }

  async function deleteProductItem(id) {
    if (!confirm("Hapus product item ini?")) return;

    setItemErr("");

    try {
      await apiFetch(`/products/admin/items/${id}`, { method: "DELETE" });
      if (itemForm.id === id) resetItemForm();
      await loadProductItems(selectedProductId);
      await loadProducts(selectedProductId);
    } catch (e) {
      setItemErr(
        e.message === "Request failed (404)"
          ? "Product item tidak ditemukan. Refresh daftar item lalu coba lagi."
          : e.message,
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="text-xl font-semibold text-slate-900">Produk</div>
          <p className="text-sm text-slate-600 mt-1">
            CRUD product menu dan product item untuk section publik "Our
            Products".
          </p>
        </div>

        <button
          type="button"
          onClick={resetForm}
          className="px-3 py-2 rounded-lg bg-slate-900 text-white text-sm"
        >
          + Produk Baru
        </button>
      </div>

      {err && (
        <div className="p-3 rounded border border-red-300 bg-red-50 text-red-700 text-sm">
          {err}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="border border-slate-200 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 font-medium">
            Daftar Product Menu
          </div>

          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left p-3">Image</th>
                  <th className="text-left p-3">Title</th>
                  <th className="text-left p-3">Slug</th>
                  <th className="text-left p-3">Sort</th>
                  <th className="text-center p-3">Items</th>
                  <th className="text-right p-3">Status</th>
                  <th className="text-right p-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const isSelected = selectedProductId === item.id;

                  return (
                    <tr
                      key={item.id}
                      className={`border-t border-slate-200 align-top ${
                        isSelected ? "bg-sky-50/70" : ""
                      }`}
                    >
                      <td className="p-3">
                        {item.imageUrl ? (
                          <img
                            src={`${API_BASE}${item.imageUrl}`}
                            alt={item.name}
                            className="w-16 h-16 rounded-lg object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-lg border border-dashed border-slate-300 flex items-center justify-center text-[11px] text-slate-400">
                            no image
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="font-medium text-slate-900">
                          {item.name}
                        </div>
                        {item.category ? (
                          <div className="text-xs text-slate-500 mt-1">
                            {item.category}
                          </div>
                        ) : null}
                      </td>
                      <td className="p-3 text-slate-600">{item.slug}</td>
                      <td className="p-3 text-slate-600">
                        {item.sortOrder ?? 0}
                      </td>
                      <td className="p-3 text-center text-slate-600">
                        {item._count?.items ?? 0}
                      </td>
                      <td className="p-3 text-right">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs ${
                            item.isPublished
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {item.isPublished ? "Published" : "Draft"}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          <button
                            type="button"
                            className="px-2 py-1 rounded border border-sky-300 text-sky-700"
                            onClick={() => setSelectedProductId(item.id)}
                          >
                            Items
                          </button>
                          <button
                            type="button"
                            className="px-2 py-1 rounded border border-slate-300"
                            onClick={() => startEdit(item)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="px-2 py-1 rounded border border-red-300 text-red-700"
                            onClick={() => deleteProduct(item.id)}
                          >
                            Del
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {!items.length && (
                  <tr>
                    <td className="p-4 text-center text-slate-500" colSpan={7}>
                      {loading ? "Loading..." : "Belum ada product menu"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="border border-slate-200 rounded-2xl p-4 md:p-5">
          <div className="font-medium text-slate-900 mb-4">
            {form.id ? "Edit Product Menu" : "Tambah Product Menu"}
          </div>

          <form onSubmit={saveProduct} className="space-y-4">
            <div>
              <div className="text-xs text-slate-500 mb-1">Title</div>
              <input
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
                value={form.title}
                onChange={(e) =>
                  setForm((s) => ({ ...s, title: e.target.value }))
                }
                placeholder="contoh: Granulation"
              />
            </div>

            <div>
              <div className="text-xs text-slate-500 mb-1">Slug</div>
              <input
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
                value={form.slug}
                onChange={(e) =>
                  setForm((s) => ({ ...s, slug: e.target.value }))
                }
                placeholder="contoh: granulation"
              />
            </div>

            <div>
              <div className="text-xs text-slate-500 mb-1">Category</div>
              <input
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
                value={form.category}
                onChange={(e) =>
                  setForm((s) => ({ ...s, category: e.target.value }))
                }
                placeholder="opsional"
              />
            </div>

            <div>
              <div className="text-xs text-slate-500 mb-1">Sort Order</div>
              <input
                type="number"
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
                value={form.sortOrder}
                onChange={(e) =>
                  setForm((s) => ({ ...s, sortOrder: e.target.value }))
                }
                placeholder="0"
              />
              <div className="text-xs text-slate-400 mt-1">
                Angka lebih kecil tampil lebih dulu di card Our Products.
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-500 mb-1">Description</div>
              <textarea
                rows={4}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
                value={form.description}
                onChange={(e) =>
                  setForm((s) => ({ ...s, description: e.target.value }))
                }
                placeholder="deskripsi parent product di halaman slug"
              />
            </div>

            <div>
              <div className="text-xs text-slate-500 mb-1">Image</div>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              />
              <div className="text-xs text-slate-400 mt-1">
                Upload gambar baru untuk replace gambar lama saat edit.
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) =>
                  setForm((s) => ({ ...s, isPublished: e.target.checked }))
                }
              />
              Publish ke website
            </label>

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-slate-900 text-white disabled:opacity-60"
              >
                {saving ? "Saving..." : form.id ? "Save" : "Create"}
              </button>

              {form.id && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 rounded-lg border border-slate-300"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-5">
        <div className="border border-slate-200 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
            <div>
              <div className="font-medium">Product Items</div>
              <div className="text-xs text-slate-500 mt-1">
                {selectedProductMeta?.name
                  ? `Item untuk "${selectedProductMeta.name}"`
                  : "Pilih product menu untuk mengelola item di dalam slug."}
              </div>
            </div>

            {selectedProductMeta?.slug ? (
              <div className="text-xs rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                /products/{selectedProductMeta.slug}
              </div>
            ) : null}
          </div>

          {itemErr && (
            <div className="m-4 p-3 rounded border border-red-300 bg-red-50 text-red-700 text-sm">
              {itemErr}
            </div>
          )}

          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left p-3">Image</th>
                  <th className="text-left p-3">Title</th>
                  <th className="text-left p-3">Sort</th>
                  <th className="text-right p-3">Status</th>
                  <th className="text-right p-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {productItems.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t border-slate-200 align-top"
                  >
                    <td className="p-3">
                      {item.imageUrl ? (
                        <img
                          src={`${API_BASE}${item.imageUrl}`}
                          alt={item.name}
                          className="w-16 h-16 rounded-lg object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg border border-dashed border-slate-300 flex items-center justify-center text-[11px] text-slate-400">
                          no image
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-slate-900">
                        {item.name}
                      </div>
                      <div className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {item.description || "Tanpa deskripsi"}
                      </div>
                      {(item.brandLogoUrl || item.linkUrl) && (
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                          {item.brandLogoUrl ? <span>brand logo</span> : null}
                          {item.linkUrl ? <span>link aktif</span> : null}
                        </div>
                      )}
                      {item.specifications?.length ? (
                        <div className="mt-2 text-[11px] text-slate-400">
                          {item.specifications.length} baris spesifikasi
                        </div>
                      ) : null}
                      {item.products?.length ? (
                        <div className="mt-2 text-[11px] text-slate-500">
                          Category:{" "}
                          {item.products
                            .map((product) => product.name || product.slug)
                            .join(", ")}
                        </div>
                      ) : null}
                    </td>
                    <td className="p-3 text-slate-600">
                      {item.sortOrder ?? 0}
                    </td>
                    <td className="p-3 text-right">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs ${
                          item.isPublished
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {item.isPublished ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <button
                          type="button"
                          className="px-2 py-1 rounded border border-slate-300"
                          onClick={() => startEditItem(item)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="px-2 py-1 rounded border border-red-300 text-red-700"
                          onClick={() => deleteProductItem(item.id)}
                        >
                          Del
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {!productItems.length && (
                  <tr>
                    <td className="p-4 text-center text-slate-500" colSpan={5}>
                      {!selectedProductId
                        ? "Pilih product menu dulu"
                        : loadingItems
                          ? "Loading..."
                          : "Belum ada product item"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="border border-slate-200 rounded-2xl p-4 md:p-5">
          <div className="font-medium text-slate-900 mb-1">
            {itemForm.id ? "Edit Product Item" : "Tambah Product Item"}
          </div>
          <div className="text-xs text-slate-500 mb-4">
            {selectedProductMeta?.name
              ? `Pilih satu atau lebih product category tempat item ini tampil.`
              : "Buat atau pilih product menu terlebih dulu."}
          </div>

          <form onSubmit={saveProductItem} className="space-y-4">
            <div>
              <div className="text-xs text-slate-500 mb-2">
                Product Category
              </div>
              <div className="max-h-40 overflow-auto rounded-lg border border-slate-200 p-2 space-y-2">
                {items.map((product) => (
                  <label
                    key={product.id}
                    className="flex items-start gap-2 rounded-md px-2 py-1 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={normalizeProductIds(
                        itemForm.productIds,
                      ).includes(product.id)}
                      onChange={() => toggleItemProduct(product.id)}
                      disabled={!selectedProductId}
                    />
                    <span>
                      <span className="block font-medium text-slate-800">
                        {product.name}
                      </span>
                      <span className="block text-xs text-slate-400">
                        /products/{product.slug}
                      </span>
                    </span>
                  </label>
                ))}

                {!items.length ? (
                  <div className="px-2 py-3 text-sm text-slate-500">
                    Belum ada product category.
                  </div>
                ) : null}
              </div>
              <div className="mt-2 text-xs text-slate-400">
                Item yang sama bisa tampil di beberapa halaman product.
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-500 mb-1">Title Item</div>
              <input
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
                value={itemForm.title}
                onChange={(e) =>
                  setItemForm((s) => ({ ...s, title: e.target.value }))
                }
                placeholder="contoh: Micronizer Jet Mill"
                disabled={!selectedProductId}
              />
            </div>

            <div>
              <div className="text-xs text-slate-500 mb-1">Description</div>
              <textarea
                rows={5}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
                value={itemForm.description}
                onChange={(e) =>
                  setItemForm((s) => ({ ...s, description: e.target.value }))
                }
                placeholder="deskripsi untuk card dan popup"
                disabled={!selectedProductId}
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="text-xs text-slate-500">Spesifikasi</div>
                <button
                  type="button"
                  onClick={addSpecificationRow}
                  className="px-2 py-1 rounded border border-slate-300 text-xs"
                  disabled={!selectedProductId}
                >
                  + Baris
                </button>
              </div>

              <div className="space-y-2">
                {(itemForm.specifications || []).map((row, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-[1fr_1fr_auto] gap-2"
                  >
                    <input
                      className="w-full border border-slate-300 rounded-lg px-3 py-2"
                      value={row.label}
                      onChange={(e) =>
                        updateSpecificationRow(index, "label", e.target.value)
                      }
                      placeholder="Label, contoh: Output"
                      disabled={!selectedProductId}
                    />
                    <input
                      className="w-full border border-slate-300 rounded-lg px-3 py-2"
                      value={row.value}
                      onChange={(e) =>
                        updateSpecificationRow(index, "value", e.target.value)
                      }
                      placeholder="Value, contoh: 75 - 300 tubes/min"
                      disabled={!selectedProductId}
                    />
                    <button
                      type="button"
                      onClick={() => removeSpecificationRow(index)}
                      className="px-3 py-2 rounded border border-red-300 text-red-700 disabled:opacity-50"
                      disabled={!selectedProductId}
                    >
                      Del
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-2 text-xs text-slate-400">
                Tabel ini akan tampil di bawah deskripsi pada popup detail
                produk.
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-500 mb-1">Sort Order</div>
              <input
                type="number"
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
                value={itemForm.sortOrder}
                onChange={(e) =>
                  setItemForm((s) => ({ ...s, sortOrder: e.target.value }))
                }
                placeholder="0"
                disabled={!selectedProductId}
              />
            </div>

            <div>
              <div className="text-xs text-slate-500 mb-1">Image</div>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => setItemImageFile(e.target.files?.[0] || null)}
                disabled={!selectedProductId}
              />
            </div>

            <div>
              <div className="text-xs text-slate-500 mb-1">
                Product Brand Logo
              </div>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) =>
                  setItemBrandLogoFile(e.target.files?.[0] || null)
                }
                disabled={!selectedProductId}
              />
              <div className="text-xs text-slate-400 mt-1">
                Logo ini akan tampil sebagai button di popup detail produk.
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-500 mb-1">Product Link</div>
              <input
                type="text"
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
                value={itemForm.linkUrl}
                onChange={(e) =>
                  setItemForm((s) => ({ ...s, linkUrl: e.target.value }))
                }
                placeholder="contoh: brand.com/product atau https://brand.com/product"
                disabled={!selectedProductId}
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={itemForm.isPublished}
                onChange={(e) =>
                  setItemForm((s) => ({ ...s, isPublished: e.target.checked }))
                }
                disabled={!selectedProductId}
              />
              Publish item ke website
            </label>

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={savingItem || !selectedProductId}
                className="px-4 py-2 rounded-lg bg-slate-900 text-white disabled:opacity-60"
              >
                {savingItem
                  ? "Saving..."
                  : itemForm.id
                    ? "Save Item"
                    : "Create Item"}
              </button>

              {(itemForm.id || selectedProductId) && (
                <button
                  type="button"
                  onClick={resetItemForm}
                  className="px-4 py-2 rounded-lg border border-slate-300"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
