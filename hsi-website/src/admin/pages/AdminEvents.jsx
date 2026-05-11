import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api";

function toInputDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function AdminEvents() {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");

  // create form (kosong saat dibuka)
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(""); // YYYY-MM-DD
  const [timeStart, setTimeStart] = useState("");
  const [timeEnd, setTimeEnd] = useState("");
  const [location, setLocation] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState(1);

  async function fetchList() {
    setErr("");
    setLoading(true);
    try {
      const json = await apiFetch("/events/admin");
      setItems(Array.isArray(json?.items) ? json.items : []);
    } catch (e) {
      setErr(e?.message || "Failed to fetch events");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchList();
  }, []);

  async function createEvent(e) {
    e.preventDefault();
    if (!title.trim()) return setErr("Judul wajib diisi.");
    if (!date) return setErr("Tanggal wajib diisi.");

    setErr("");
    setLoading(true);
    try {
      // CREATE selalu OFF dulu (isPublished=false)
      await apiFetch("/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          date, // backend akan new Date(date)
          timeStart: timeStart || null,
          timeEnd: timeEnd || null,
          location: location || null,
          linkUrl: linkUrl || null,
          description: description || null,
          sortOrder,
          isPublished: false,
        }),
      });

      // reset form
      setTitle("");
      setDate("");
      setTimeStart("");
      setTimeEnd("");
      setLocation("");
      setLinkUrl("");
      setDescription("");
      setSortOrder(1);

      await fetchList();
    } catch (e2) {
      setErr(e2?.message || "Create error");
    } finally {
      setLoading(false);
    }
  }

  async function updateEvent(id, patch) {
    setErr("");
    setLoading(true);
    try {
      await apiFetch(`/events/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      await fetchList();
    } catch (e) {
      setErr(e?.message || "Update error");
      throw e; // penting: supaya EventCard bisa rollback state saat toggle gagal
    } finally {
      setLoading(false);
    }
  }

  async function deleteEvent(id) {
    if (!confirm("Hapus event ini?")) return;

    setErr("");
    setLoading(true);
    try {
      await apiFetch(`/events/${id}`, { method: "DELETE" });
      await fetchList();
    } catch (e) {
      setErr(e?.message || "Delete error");
    } finally {
      setLoading(false);
    }
  }

  const total = useMemo(() => items.length, [items]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xl font-semibold text-slate-900">Event</div>
          <div className="text-sm text-slate-600 mt-1">
            Kelola event (publish ON/OFF, tambah, edit, delete).
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
        onSubmit={createEvent}
        className="mt-6 bg-slate-50 rounded-xl border border-slate-200 p-5"
      >
        <div className="font-medium text-slate-900">Tambah Event</div>

        <div className="mt-4 grid gap-3">
          <input
            className="border rounded-lg px-3 py-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Judul event"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              className="border rounded-lg px-3 py-2"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <input
              className="border rounded-lg px-3 py-2"
              value={timeStart}
              onChange={(e) => setTimeStart(e.target.value)}
              placeholder="Jam mulai (opsional) ex: 09:00"
            />
            <input
              className="border rounded-lg px-3 py-2"
              value={timeEnd}
              onChange={(e) => setTimeEnd(e.target.value)}
              placeholder="Jam selesai (opsional) ex: 17:00"
            />
          </div>

          <input
            className="border rounded-lg px-3 py-2"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Lokasi (opsional)"
          />

          <input
            className="border rounded-lg px-3 py-2"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="Link URL (opsional)"
          />

          <textarea
            className="border rounded-lg px-3 py-2 min-h-[96px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Deskripsi (opsional)"
          />

          {/* Sort order saja */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              className="border rounded-lg px-3 py-2"
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              placeholder="Sort order"
            />
          </div>

          <button
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white disabled:opacity-60"
          >
            {loading ? "Loading..." : "Simpan Event"}
          </button>

          <div className="text-xs text-slate-500">
            Catatan: event yang tampil di halaman user sebaiknya hanya yang
            Publish = ON. Publish diatur lewat tombol Turn ON/OFF di list.
          </div>
        </div>
      </form>

      {/* LIST */}
      <div className="mt-6">
        <div className="text-sm text-slate-600 mb-3">{total} event</div>

        {items.length === 0 ? (
          <div className="text-sm text-slate-600">Belum ada event.</div>
        ) : null}

        <div className="grid gap-4">
          {items.map((ev) => (
            <EventCard
              key={ev.id}
              ev={ev}
              loading={loading}
              onUpdate={(patch) => updateEvent(ev.id, patch)}
              onDelete={() => deleteEvent(ev.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function EventCard({ ev, loading, onUpdate, onDelete }) {
  const [editTitle, setEditTitle] = useState(ev.title || "");
  const [editDate, setEditDate] = useState(toInputDate(ev.date));
  const [editStart, setEditStart] = useState(ev.timeStart || "");
  const [editEnd, setEditEnd] = useState(ev.timeEnd || "");
  const [editLoc, setEditLoc] = useState(ev.location || "");
  const [editLink, setEditLink] = useState(ev.linkUrl || "");
  const [editDesc, setEditDesc] = useState(ev.description || "");
  const [editOrder, setEditOrder] = useState(ev.sortOrder ?? 1);
  const [editPub, setEditPub] = useState(Boolean(ev.isPublished));

  return (
    <div className="border border-slate-200 rounded-xl p-4">
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className={`text-xs px-2 py-1 rounded-full ${
            editPub
              ? "bg-emerald-100 text-emerald-700"
              : "bg-slate-100 text-slate-700"
          }`}
        >
          {editPub ? "PUBLISHED (ON)" : "OFF"}
        </span>
        <span className="text-xs text-slate-500 break-all">ID: {ev.id}</span>
      </div>

      <div className="mt-3 grid gap-2">
        <input
          className="border rounded-lg px-3 py-2 text-sm"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          placeholder="Judul"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <input
            className="border rounded-lg px-3 py-2 text-sm"
            type="date"
            value={editDate}
            onChange={(e) => setEditDate(e.target.value)}
          />
          <input
            className="border rounded-lg px-3 py-2 text-sm"
            value={editStart}
            onChange={(e) => setEditStart(e.target.value)}
            placeholder="Jam mulai"
          />
          <input
            className="border rounded-lg px-3 py-2 text-sm"
            value={editEnd}
            onChange={(e) => setEditEnd(e.target.value)}
            placeholder="Jam selesai"
          />
        </div>

        <input
          className="border rounded-lg px-3 py-2 text-sm"
          value={editLoc}
          onChange={(e) => setEditLoc(e.target.value)}
          placeholder="Lokasi"
        />

        <input
          className="border rounded-lg px-3 py-2 text-sm"
          value={editLink}
          onChange={(e) => setEditLink(e.target.value)}
          placeholder="Link URL"
        />

        <textarea
          className="border rounded-lg px-3 py-2 text-sm min-h-[90px]"
          value={editDesc}
          onChange={(e) => setEditDesc(e.target.value)}
          placeholder="Deskripsi"
        />

        {/* Sort order saja */}
        <div className="grid grid-cols-1 gap-2">
          <input
            className="border rounded-lg px-3 py-2 text-sm"
            type="number"
            value={editOrder}
            onChange={(e) => setEditOrder(Number(e.target.value))}
            placeholder="Sort order"
          />
        </div>

        <div className="flex flex-wrap gap-2 mt-1">
          {/* Toggle publish hanya dari tombol hitam */}
          <button
            type="button"
            disabled={loading}
            onClick={async () => {
              const next = !editPub;
              setEditPub(next); // update UI dulu

              try {
                await onUpdate({ isPublished: next });
              } catch (e) {
                // rollback kalau gagal
                setEditPub(!next);
              }
            }}
            className="px-3 py-2 rounded-lg bg-slate-900 text-white text-sm disabled:opacity-60"
          >
            {editPub ? "Turn OFF" : "Turn ON"}
          </button>

          {/* Save meta tanpa isPublished */}
          <button
            type="button"
            disabled={loading}
            onClick={() =>
              onUpdate({
                title: editTitle,
                date: editDate,
                timeStart: editStart || null,
                timeEnd: editEnd || null,
                location: editLoc || null,
                linkUrl: editLink || null,
                description: editDesc || null,
                sortOrder: editOrder,
              })
            }
            className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm hover:bg-slate-100 disabled:opacity-60"
          >
            Save
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={onDelete}
            className="px-3 py-2 rounded-lg bg-red-600 text-white text-sm disabled:opacity-60"
          >
            Delete
          </button>
        </div>

        {editLink ? (
          <a
            className="text-xs text-blue-600 underline mt-2 inline-block"
            href={editLink}
            target="_blank"
            rel="noreferrer"
          >
            Open Link
          </a>
        ) : null}
      </div>
    </div>
  );
}
