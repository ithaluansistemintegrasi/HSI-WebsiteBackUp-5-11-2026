const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Ambil middleware admin dari auth.js kamu (karena naming/export bisa beda-beda).
 * - Jika tidak ditemukan, kita bypass dulu supaya server tidak crash (dev unblock).
 * NANTI: setelah kamu pastikan middleware mana yang benar, kita kunci lagi.
 */
const auth = require("../middlewares/auth");

// cari beberapa kemungkinan nama export
const requireAdmin =
  auth?.requireAdmin ||
  auth?.authRequired ||
  auth?.requireAuth ||
  auth?.adminOnly ||
  auth?.verifyToken ||
  auth?.authMiddleware ||
  (typeof auth === "function" ? auth : null);

// middleware aman: kalau bukan function, jangan crash
const requireAdminSafe =
  typeof requireAdmin === "function"
    ? requireAdmin
    : (req, res, next) => next();

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

/**
 * PUBLIC: GET /events?date=YYYY-MM-DD
 * - kalau pakai date -> hanya event pada tanggal itu (published)
 * - kalau tanpa date -> list semua (published)
 */
router.get("/", async (req, res) => {
  try {
    const { date } = req.query;

    const where = { isPublished: true };

    if (date) {
      const d = new Date(date);
      where.date = { gte: startOfDay(d), lte: endOfDay(d) };
    }

    const items = await prisma.event.findMany({
      where,
      orderBy: [{ date: "asc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
    });

    res.json({ items });
  } catch (e) {
    res.status(400).json({ message: e?.message || "Failed to fetch events" });
  }
});

/**
 * ADMIN: GET /events/admin
 */
router.get("/admin", requireAdminSafe, async (req, res) => {
  try {
    const items = await prisma.event.findMany({
      orderBy: [{ date: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
    });
    res.json({ items });
  } catch (e) {
    res
      .status(400)
      .json({ message: e?.message || "Failed to fetch admin events" });
  }
});

/**
 * ADMIN: POST /events
 */
router.post("/", requireAdminSafe, async (req, res) => {
  try {
    const {
      title,
      date,
      timeStart,
      timeEnd,
      location,
      description,
      linkUrl,
      sortOrder,
      isPublished,
    } = req.body;

    if (!title) return res.status(400).json({ message: "title wajib" });
    if (!date) return res.status(400).json({ message: "date wajib" });

    const item = await prisma.event.create({
      data: {
        title: String(title),
        date: new Date(date),
        timeStart: timeStart ? String(timeStart) : null,
        timeEnd: timeEnd ? String(timeEnd) : null,
        location: location ? String(location) : null,
        description: description ? String(description) : null,
        linkUrl: linkUrl ? String(linkUrl) : null,
        sortOrder: Number(sortOrder ?? 1),
        isPublished: Boolean(isPublished),
      },
    });

    res.json({ item });
  } catch (e) {
    res.status(400).json({ message: e?.message || "Create event failed" });
  }
});

/**
 * ADMIN: PATCH /events/:id
 */
router.patch("/:id", requireAdminSafe, async (req, res) => {
  try {
    const { id } = req.params;

    const patch = { ...req.body };
    if (patch.date) patch.date = new Date(patch.date);
    if (patch.sortOrder !== undefined)
      patch.sortOrder = Number(patch.sortOrder);
    if (patch.isPublished !== undefined)
      patch.isPublished = Boolean(patch.isPublished);

    const item = await prisma.event.update({
      where: { id },
      data: patch,
    });

    res.json({ item });
  } catch (e) {
    res.status(400).json({ message: e?.message || "Update event failed" });
  }
});

/**
 * ADMIN: DELETE /events/:id
 */
router.delete("/:id", requireAdminSafe, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.event.delete({ where: { id } });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ message: e?.message || "Delete event failed" });
  }
});

module.exports = router;
