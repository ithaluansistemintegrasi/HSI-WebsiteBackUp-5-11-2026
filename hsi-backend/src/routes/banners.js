const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { z } = require("zod");

const prisma = require("../prisma");
const { requireAuth, requireRole } = require("../middlewares/auth");

const router = express.Router();

// ===== storage =====
const UPLOAD_DIR = path.join(process.cwd(), "uploads", "banners");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const safeExt = [".png", ".jpg", ".jpeg", ".webp"].includes(ext)
      ? ext
      : ".jpg";
    cb(
      null,
      `banner_${Date.now()}_${Math.random().toString(16).slice(2)}${safeExt}`,
    );
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB
});

// helper hapus file lama
function tryDeleteFileByImageUrl(imageUrl) {
  // imageUrl disimpan seperti: /uploads/banners/xxx.jpg
  if (!imageUrl) return;
  const rel = imageUrl.replace(/^\/uploads\//, ""); // banners/xxx.jpg
  const full = path.join(process.cwd(), "uploads", rel);
  if (full.includes(path.join("uploads", "banners")) && fs.existsSync(full)) {
    try {
      fs.unlinkSync(full);
    } catch (_) {}
  }
}

// ===== schemas =====
const BannerMetaSchema = z.object({
  title: z.string().min(1),
  linkUrl: z.string().optional().nullable(),
  sortOrder: z.coerce.number().int().optional(),
  isActive: z.coerce.boolean().optional(),
});

const BannerUpdateSchema = BannerMetaSchema.partial();

// ===== PUBLIC =====
router.get("/active", async (req, res) => {
  const items = await prisma.banner.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
  res.json({ ok: true, items });
});

// ===== ADMIN =====
router.get("/", requireAuth, requireRole("ADMIN"), async (req, res) => {
  const items = await prisma.banner.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
  res.json({ ok: true, items });
});

// ADD banner + upload image
router.post(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  upload.single("image"),
  async (req, res) => {
    const parsed = BannerMetaSchema.safeParse(req.body);
    if (!parsed.success) {
      if (req.file)
        tryDeleteFileByImageUrl(`/uploads/banners/${req.file.filename}`);
      return res.status(400).json({ ok: false, errors: parsed.error.errors });
    }
    if (!req.file)
      return res
        .status(400)
        .json({ ok: false, message: "image wajib diupload" });

    const data = parsed.data;
    const imageUrl = `/uploads/banners/${req.file.filename}`;

    // kalau diaktifkan, pastikan hanya 1 banner yang ON (season greeting)
    if (data.isActive === true) {
      await prisma.banner.updateMany({ data: { isActive: false } });
    }

    const item = await prisma.banner.create({
      data: {
        title: data.title,
        imageUrl,
        linkUrl: data.linkUrl ?? null,
        sortOrder: data.sortOrder ?? 0,
        isActive: data.isActive ?? false,
      },
    });

    res.status(201).json({ ok: true, item });
  },
);

// EDIT banner (bisa ganti metadata + optional ganti image)
router.patch(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  upload.single("image"),
  async (req, res) => {
    const parsed = BannerUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      if (req.file)
        tryDeleteFileByImageUrl(`/uploads/banners/${req.file.filename}`);
      return res.status(400).json({ ok: false, errors: parsed.error.errors });
    }

    const existing = await prisma.banner.findUnique({
      where: { id: req.params.id },
    });
    if (!existing) {
      if (req.file)
        tryDeleteFileByImageUrl(`/uploads/banners/${req.file.filename}`);
      return res.status(404).json({ ok: false, message: "Banner not found" });
    }

    const patch = { ...parsed.data };

    // jika ganti gambar
    if (req.file) {
      patch.imageUrl = `/uploads/banners/${req.file.filename}`;
    }

    // kalau banner ini di-ON kan, matikan yang lain (agar season greeting cuma 1)
    if (patch.isActive === true) {
      await prisma.banner.updateMany({
        where: { NOT: { id: req.params.id } },
        data: { isActive: false },
      });
    }

    const item = await prisma.banner.update({
      where: { id: req.params.id },
      data: patch,
    });

    // hapus file lama setelah update sukses (hanya kalau ganti image)
    if (req.file) tryDeleteFileByImageUrl(existing.imageUrl);

    res.json({ ok: true, item });
  },
);

// REMOVE banner
router.delete("/:id", requireAuth, requireRole("ADMIN"), async (req, res) => {
  const existing = await prisma.banner.findUnique({
    where: { id: req.params.id },
  });
  if (!existing)
    return res.status(404).json({ ok: false, message: "Banner not found" });

  await prisma.banner.delete({ where: { id: req.params.id } });
  tryDeleteFileByImageUrl(existing.imageUrl);

  res.json({ ok: true });
});

module.exports = router;
