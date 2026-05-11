const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const router = express.Router();

// ====== UPLOAD SETUP ======
const uploadDir = path.join(process.cwd(), "uploads", "spareparts");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const safeExt = [".jpg", ".jpeg", ".png", ".webp"].includes(ext)
      ? ext
      : ".jpg";
    cb(null, `${Date.now()}-${Math.random().toString(16).slice(2)}${safeExt}`);
  },
});

function fileFilter(req, file, cb) {
  const ok = ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype);
  cb(ok ? null : new Error("Only jpg/png/webp allowed"), ok);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

// helper delete file by "/uploads/.."
function deleteByPublicPath(publicPath) {
  if (!publicPath) return;
  const rel = publicPath.startsWith("/") ? publicPath.slice(1) : publicPath; // "uploads/.."
  const abs = path.join(process.cwd(), rel);
  if (fs.existsSync(abs)) fs.unlinkSync(abs);
}

// =========================
// CATEGORY CRUD
// =========================

// GET /spareparts/categories
router.get("/categories", async (req, res) => {
  try {
    const items = await prisma.sparepartCategory.findMany({
      orderBy: [{ sort: "asc" }, { id: "asc" }],
    });
    res.json(items);
  } catch (e) {
    res.status(500).json({ message: e.message || "Server error" });
  }
});

// POST /spareparts/categories
router.post("/categories", async (req, res) => {
  try {
    const { key, nameId, nameEn, sort } = req.body || {};
    if (!key || !nameId)
      return res.status(400).json({ message: "key & nameId required" });

    const created = await prisma.sparepartCategory.create({
      data: {
        key: String(key).trim(),
        nameId: String(nameId).trim(),
        nameEn: nameEn ? String(nameEn).trim() : null,
        sort: Number(sort || 0),
      },
    });
    res.json(created);
  } catch (e) {
    // unique key error
    if (e.code === "P2002")
      return res.status(400).json({ message: "Category key already exists" });
    res.status(500).json({ message: e.message || "Server error" });
  }
});

// PATCH /spareparts/categories/:id
router.patch("/categories/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { key, nameId, nameEn, sort } = req.body || {};

    const updated = await prisma.sparepartCategory.update({
      where: { id },
      data: {
        key: key === undefined ? undefined : String(key).trim(),
        nameId: nameId === undefined ? undefined : String(nameId).trim(),
        nameEn:
          nameEn === undefined ? undefined : String(nameEn).trim() || null,
        sort: sort === undefined ? undefined : Number(sort),
      },
    });

    res.json(updated);
  } catch (e) {
    res.status(500).json({ message: e.message || "Server error" });
  }
});

// DELETE /spareparts/categories/:id
router.delete("/categories/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    // hapus file images sparepart di kategori tsb (biar gak nyampah)
    const parts = await prisma.sparepart.findMany({
      where: { categoryId: id },
    });
    for (const p of parts) deleteByPublicPath(p.image);

    await prisma.sparepartCategory.delete({ where: { id } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: e.message || "Server error" });
  }
});

// =========================
// SPAREPART CRUD + UPLOAD
// =========================

// GET /spareparts?categoryId=1
router.get("/", async (req, res) => {
  try {
    const { categoryId } = req.query;

    const where = categoryId ? { categoryId: Number(categoryId) } : undefined;

    const items = await prisma.sparepart.findMany({
      where,
      include: { category: true },
      orderBy: [{ sort: "asc" }, { id: "desc" }],
    });

    res.json(items);
  } catch (e) {
    res.status(500).json({ message: e.message || "Server error" });
  }
});

// POST /spareparts  (multipart: image=file)
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const b = req.body || {};
    const {
      categoryId,
      titleId,
      titleEn,
      descId,
      descEn,
      price,
      sort,
      isActive,
    } = b;

    if (!categoryId || !titleId) {
      if (req.file?.path) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: "categoryId & titleId required" });
    }

    const imagePath = req.file
      ? `/uploads/spareparts/${req.file.filename}`
      : null;

    const created = await prisma.sparepart.create({
      data: {
        categoryId: Number(categoryId),
        titleId: String(titleId).trim(),
        titleEn: titleEn ? String(titleEn).trim() : null,
        descId: descId ? String(descId).trim() : null,
        descEn: descEn ? String(descEn).trim() : null,
        price: Number(price || 0),
        sort: Number(sort || 0),
        isActive: String(isActive ?? "true") === "true",
        image: imagePath,
      },
    });

    res.json(created);
  } catch (e) {
    res.status(500).json({ message: e.message || "Server error" });
  }
});

// PATCH /spareparts/:id  (multipart optional image=file)
router.patch("/:id", upload.single("image"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.sparepart.findUnique({ where: { id } });

    if (!existing) {
      if (req.file?.path) fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: "Not found" });
    }

    let nextImage = existing.image;
    if (req.file) {
      nextImage = `/uploads/spareparts/${req.file.filename}`;
      // delete old
      deleteByPublicPath(existing.image);
    }

    const b = req.body || {};

    const updated = await prisma.sparepart.update({
      where: { id },
      data: {
        categoryId:
          b.categoryId === undefined ? undefined : Number(b.categoryId),
        titleId: b.titleId === undefined ? undefined : String(b.titleId).trim(),
        titleEn:
          b.titleEn === undefined
            ? undefined
            : String(b.titleEn).trim() || null,
        descId:
          b.descId === undefined ? undefined : String(b.descId).trim() || null,
        descEn:
          b.descEn === undefined ? undefined : String(b.descEn).trim() || null,
        price: b.price === undefined ? undefined : Number(b.price),
        sort: b.sort === undefined ? undefined : Number(b.sort),
        isActive:
          b.isActive === undefined ? undefined : String(b.isActive) === "true",
        image: nextImage,
      },
    });

    res.json(updated);
  } catch (e) {
    res.status(500).json({ message: e.message || "Server error" });
  }
});

// DELETE /spareparts/:id
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.sparepart.findUnique({ where: { id } });

    if (!existing) return res.json({ ok: true });

    deleteByPublicPath(existing.image);
    await prisma.sparepart.delete({ where: { id } });

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: e.message || "Server error" });
  }
});

module.exports = router;
