const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { z } = require("zod");

const prisma = require("../prisma");
const { requireAuth, requireRole } = require("../middlewares/auth");

const router = express.Router();

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "partners");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const safeExt = [".png", ".jpg", ".jpeg", ".webp", ".svg"].includes(ext)
      ? ext
      : ".jpg";
    cb(
      null,
      `partner_${Date.now()}_${Math.random().toString(16).slice(2)}${safeExt}`,
    );
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    if (![".png", ".jpg", ".jpeg", ".webp", ".svg"].includes(ext)) {
      return cb(new Error("Only jpg/png/webp/svg allowed"));
    }
    cb(null, true);
  },
});

function tryDeleteFileByImageUrl(imageUrl) {
  if (!imageUrl) return;
  const rel = imageUrl.replace(/^\/uploads\//, "");
  const full = path.join(process.cwd(), "uploads", rel);
  if (full.includes(path.join("uploads", "partners")) && fs.existsSync(full)) {
    try {
      fs.unlinkSync(full);
    } catch (_) {}
  }
}

const PartnerMetaSchema = z.object({
  name: z.string().min(1),
  linkUrl: z.string().optional().nullable(),
  sortOrder: z.coerce.number().int().optional(),
  isPublished: z.coerce.boolean().optional(),
});

const PartnerUpdateSchema = PartnerMetaSchema.partial();

router.get("/active", async (req, res) => {
  const items = await prisma.partner.findMany({
    where: { isPublished: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
  res.json({ ok: true, items });
});

router.get("/", requireAuth, requireRole("ADMIN"), async (req, res) => {
  const items = await prisma.partner.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
  res.json({ ok: true, items });
});

router.post(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  upload.single("image"),
  async (req, res) => {
    const parsed = PartnerMetaSchema.safeParse(req.body);
    if (!parsed.success) {
      if (req.file)
        tryDeleteFileByImageUrl(`/uploads/partners/${req.file.filename}`);
      return res.status(400).json({ ok: false, errors: parsed.error.errors });
    }
    if (!req.file) {
      return res
        .status(400)
        .json({ ok: false, message: "image wajib diupload" });
    }

    const data = parsed.data;
    const item = await prisma.partner.create({
      data: {
        name: data.name,
        imageUrl: `/uploads/partners/${req.file.filename}`,
        linkUrl: data.linkUrl || null,
        sortOrder: data.sortOrder ?? 0,
        isPublished: data.isPublished ?? true,
      },
    });

    res.status(201).json({ ok: true, item });
  },
);

router.patch(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  upload.single("image"),
  async (req, res) => {
    const parsed = PartnerUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      if (req.file)
        tryDeleteFileByImageUrl(`/uploads/partners/${req.file.filename}`);
      return res.status(400).json({ ok: false, errors: parsed.error.errors });
    }

    const existing = await prisma.partner.findUnique({
      where: { id: req.params.id },
    });
    if (!existing) {
      if (req.file)
        tryDeleteFileByImageUrl(`/uploads/partners/${req.file.filename}`);
      return res.status(404).json({ ok: false, message: "Partner not found" });
    }

    const patch = { ...parsed.data };
    if (patch.linkUrl !== undefined) patch.linkUrl = patch.linkUrl || null;
    if (req.file) patch.imageUrl = `/uploads/partners/${req.file.filename}`;

    const item = await prisma.partner.update({
      where: { id: req.params.id },
      data: patch,
    });

    if (req.file) tryDeleteFileByImageUrl(existing.imageUrl);

    res.json({ ok: true, item });
  },
);

router.delete("/:id", requireAuth, requireRole("ADMIN"), async (req, res) => {
  const existing = await prisma.partner.findUnique({
    where: { id: req.params.id },
  });
  if (!existing) {
    return res.status(404).json({ ok: false, message: "Partner not found" });
  }

  await prisma.partner.delete({ where: { id: req.params.id } });
  tryDeleteFileByImageUrl(existing.imageUrl);

  res.json({ ok: true });
});

module.exports = router;
