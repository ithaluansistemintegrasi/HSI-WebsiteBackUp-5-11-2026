const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const prisma = require("../prisma");
const { requireAuth, requireRole } = require("../middlewares/auth");

const router = express.Router();

const uploadDir = path.join(process.cwd(), "uploads", "products");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const safeExt = [".jpg", ".jpeg", ".png", ".webp"].includes(ext)
      ? ext
      : ".jpg";
    cb(
      null,
      `product_${Date.now()}_${Math.random().toString(16).slice(2)}${safeExt}`,
    );
  },
});

function fileFilter(req, file, cb) {
  const ok = ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype);
  cb(ok ? null : new Error("Only jpg/png/webp allowed"), ok);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 3 * 1024 * 1024 },
});

function deleteByPublicPath(publicPath) {
  if (!publicPath) return;
  const rel = publicPath.startsWith("/") ? publicPath.slice(1) : publicPath;
  const abs = path.join(process.cwd(), rel);
  if (fs.existsSync(abs)) {
    try {
      fs.unlinkSync(abs);
    } catch (_) {}
  }
}

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeLinkUrl(value) {
  const raw = normalizeText(value);
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw}`;
}

function parseBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  return String(value).toLowerCase() === "true";
}

function parseInteger(value, fallback = 0) {
  const num = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(num) ? num : fallback;
}

function parseSpecifications(value) {
  if (value === undefined || value === null || value === "") return [];

  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((row) => ({
        label: normalizeText(row?.label),
        value: normalizeText(row?.value),
      }))
      .filter((row) => row.label || row.value);
  } catch (_) {
    return [];
  }
}

router.get(
  "/admin/list",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res) => {
    try {
      const rawItems = await prisma.product.findMany({
        include: {
          items: {
            select: { id: true },
          },
        },
        orderBy: [{ createdAt: "desc" }],
      });
      const items = rawItems.map((item) => ({
        ...item,
        _count: { items: item.items?.length || 0 },
      }));
      res.json(items);
    } catch (e) {
      res.status(500).json({ message: e.message || "Server error" });
    }
  },
);

router.get(
  "/admin/:productId/items",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res) => {
    try {
      const product = await prisma.product.findUnique({
        where: { id: req.params.productId },
        select: { id: true, name: true, slug: true },
      });

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const items = await prisma.productItem.findMany({
        where: { productId: req.params.productId },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      });

      res.json({
        product,
        items: items.map((productItem) => ({
          ...productItem,
          specifications: parseSpecifications(productItem.specifications),
        })),
      });
    } catch (e) {
      res.status(500).json({ message: e.message || "Server error" });
    }
  },
);

router.post(
  "/admin",
  requireAuth,
  requireRole("ADMIN"),
  upload.single("image"),
  async (req, res) => {
    try {
      const title = normalizeText(req.body?.title);
      const slug = normalizeText(req.body?.slug);
      const description = normalizeText(req.body?.description);
      const category = normalizeText(req.body?.category);

      if (!title || !slug) {
        if (req.file?.path) fs.unlinkSync(req.file.path);
        return res.status(400).json({ message: "title & slug wajib diisi" });
      }

      const created = await prisma.product.create({
        data: {
          name: title,
          slug,
          description,
          category: category || null,
          imageUrl: req.file ? `/uploads/products/${req.file.filename}` : null,
          isPublished: parseBoolean(req.body?.isPublished, true),
        },
      });

      res.status(201).json(created);
    } catch (e) {
      if (req.file?.path && fs.existsSync(req.file.path))
        fs.unlinkSync(req.file.path);
      if (e.code === "P2002") {
        return res.status(400).json({ message: "Slug sudah dipakai" });
      }
      res.status(500).json({ message: e.message || "Server error" });
    }
  },
);

router.post(
  "/admin/:productId/items",
  requireAuth,
  requireRole("ADMIN"),
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "brandLogo", maxCount: 1 },
  ]),
  async (req, res) => {
    const itemImageFile = req.files?.image?.[0] || null;
    const brandLogoFile = req.files?.brandLogo?.[0] || null;

    try {
      const product = await prisma.product.findUnique({
        where: { id: req.params.productId },
        select: { id: true },
      });

      if (!product) {
        if (itemImageFile?.path && fs.existsSync(itemImageFile.path))
          fs.unlinkSync(itemImageFile.path);
        if (brandLogoFile?.path && fs.existsSync(brandLogoFile.path))
          fs.unlinkSync(brandLogoFile.path);
        return res.status(404).json({ message: "Product not found" });
      }

      const title = normalizeText(req.body?.title);
      const description = normalizeText(req.body?.description);
      const specifications = parseSpecifications(req.body?.specifications);
      const linkUrl = normalizeLinkUrl(req.body?.linkUrl);

      if (!title) {
        if (itemImageFile?.path && fs.existsSync(itemImageFile.path))
          fs.unlinkSync(itemImageFile.path);
        if (brandLogoFile?.path && fs.existsSync(brandLogoFile.path))
          fs.unlinkSync(brandLogoFile.path);
        return res.status(400).json({ message: "Title item wajib diisi" });
      }

      const created = await prisma.productItem.create({
        data: {
          productId: req.params.productId,
          name: title,
          description,
          specifications: specifications.length
            ? JSON.stringify(specifications)
            : null,
          imageUrl: itemImageFile
            ? `/uploads/products/${itemImageFile.filename}`
            : null,
          brandLogoUrl: brandLogoFile
            ? `/uploads/products/${brandLogoFile.filename}`
            : null,
          linkUrl,
          sortOrder: parseInteger(req.body?.sortOrder, 0),
          isPublished: parseBoolean(req.body?.isPublished, true),
        },
      });

      res.status(201).json(created);
    } catch (e) {
      if (itemImageFile?.path && fs.existsSync(itemImageFile.path))
        fs.unlinkSync(itemImageFile.path);
      if (brandLogoFile?.path && fs.existsSync(brandLogoFile.path))
        fs.unlinkSync(brandLogoFile.path);
      res.status(500).json({ message: e.message || "Server error" });
    }
  },
);

router.patch(
  "/admin/:id",
  requireAuth,
  requireRole("ADMIN"),
  upload.single("image"),
  async (req, res) => {
    try {
      const existing = await prisma.product.findUnique({
        where: { id: req.params.id },
      });

      if (!existing) {
        if (req.file?.path && fs.existsSync(req.file.path))
          fs.unlinkSync(req.file.path);
        return res.status(404).json({ message: "Product not found" });
      }

      const title = normalizeText(req.body?.title);
      const slug = normalizeText(req.body?.slug);
      const description = normalizeText(req.body?.description);
      const category = normalizeText(req.body?.category);

      if (!title || !slug) {
        if (req.file?.path && fs.existsSync(req.file.path))
          fs.unlinkSync(req.file.path);
        return res.status(400).json({ message: "title & slug wajib diisi" });
      }

      const updated = await prisma.product.update({
        where: { id: req.params.id },
        data: {
          name: title,
          slug,
          description,
          category: category || null,
          imageUrl: req.file
            ? `/uploads/products/${req.file.filename}`
            : existing.imageUrl,
          isPublished: parseBoolean(
            req.body?.isPublished,
            existing.isPublished,
          ),
        },
      });

      if (req.file && existing.imageUrl) deleteByPublicPath(existing.imageUrl);

      res.json(updated);
    } catch (e) {
      if (req.file?.path && fs.existsSync(req.file.path))
        fs.unlinkSync(req.file.path);
      if (e.code === "P2002") {
        return res.status(400).json({ message: "Slug sudah dipakai" });
      }
      res.status(500).json({ message: e.message || "Server error" });
    }
  },
);

router.patch(
  "/admin/items/:id",
  requireAuth,
  requireRole("ADMIN"),
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "brandLogo", maxCount: 1 },
  ]),
  async (req, res) => {
    const itemImageFile = req.files?.image?.[0] || null;
    const brandLogoFile = req.files?.brandLogo?.[0] || null;

    try {
      const existing = await prisma.productItem.findUnique({
        where: { id: req.params.id },
      });

      if (!existing) {
        if (itemImageFile?.path && fs.existsSync(itemImageFile.path))
          fs.unlinkSync(itemImageFile.path);
        if (brandLogoFile?.path && fs.existsSync(brandLogoFile.path))
          fs.unlinkSync(brandLogoFile.path);
        return res.status(404).json({ message: "Product item not found" });
      }

      const title = normalizeText(req.body?.title);
      const description = normalizeText(req.body?.description);
      const specifications = parseSpecifications(req.body?.specifications);
      const linkUrl = normalizeLinkUrl(req.body?.linkUrl);

      if (!title) {
        if (itemImageFile?.path && fs.existsSync(itemImageFile.path))
          fs.unlinkSync(itemImageFile.path);
        if (brandLogoFile?.path && fs.existsSync(brandLogoFile.path))
          fs.unlinkSync(brandLogoFile.path);
        return res.status(400).json({ message: "Title item wajib diisi" });
      }

      const updated = await prisma.productItem.update({
        where: { id: req.params.id },
        data: {
          name: title,
          description,
          specifications: specifications.length
            ? JSON.stringify(specifications)
            : null,
          imageUrl: itemImageFile
            ? `/uploads/products/${itemImageFile.filename}`
            : existing.imageUrl,
          brandLogoUrl: brandLogoFile
            ? `/uploads/products/${brandLogoFile.filename}`
            : existing.brandLogoUrl,
          linkUrl,
          sortOrder: parseInteger(req.body?.sortOrder, existing.sortOrder),
          isPublished: parseBoolean(
            req.body?.isPublished,
            existing.isPublished,
          ),
        },
      });

      if (itemImageFile && existing.imageUrl)
        deleteByPublicPath(existing.imageUrl);
      if (brandLogoFile && existing.brandLogoUrl) {
        deleteByPublicPath(existing.brandLogoUrl);
      }

      res.json(updated);
    } catch (e) {
      if (itemImageFile?.path && fs.existsSync(itemImageFile.path))
        fs.unlinkSync(itemImageFile.path);
      if (brandLogoFile?.path && fs.existsSync(brandLogoFile.path))
        fs.unlinkSync(brandLogoFile.path);
      res.status(500).json({ message: e.message || "Server error" });
    }
  },
);

router.delete(
  "/admin/:id",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res) => {
    try {
      const existing = await prisma.product.findUnique({
        where: { id: req.params.id },
        include: {
          items: {
            select: {
              imageUrl: true,
              brandLogoUrl: true,
            },
          },
        },
      });

      if (!existing) return res.json({ ok: true });

      if (existing.imageUrl) deleteByPublicPath(existing.imageUrl);
      for (const item of existing.items || []) {
        if (item.imageUrl) deleteByPublicPath(item.imageUrl);
        if (item.brandLogoUrl) deleteByPublicPath(item.brandLogoUrl);
      }
      await prisma.product.delete({ where: { id: req.params.id } });

      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ message: e.message || "Server error" });
    }
  },
);

router.delete(
  "/admin/items/:id",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res) => {
    try {
      const existing = await prisma.productItem.findUnique({
        where: { id: req.params.id },
      });

      if (!existing) return res.json({ ok: true });

      if (existing.imageUrl) deleteByPublicPath(existing.imageUrl);
      if (existing.brandLogoUrl) deleteByPublicPath(existing.brandLogoUrl);
      await prisma.productItem.delete({ where: { id: req.params.id } });

      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ message: e.message || "Server error" });
    }
  },
);

router.get("/", async (req, res) => {
  try {
    const items = await prisma.product.findMany({
      where: { isPublished: true },
      orderBy: [{ createdAt: "desc" }],
    });
    res.json(items);
  } catch (e) {
    res.status(500).json({ message: e.message || "Server error" });
  }
});

router.get("/:slug", async (req, res) => {
  try {
    const item = await prisma.product.findFirst({
      where: {
        slug: req.params.slug,
        isPublished: true,
      },
      include: {
        items: {
          where: { isPublished: true },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        },
      },
    });

    if (!item) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({
      ...item,
      items: (item.items || []).map((productItem) => ({
        ...productItem,
        specifications: parseSpecifications(productItem.specifications),
      })),
    });
  } catch (e) {
    res.status(500).json({ message: e.message || "Server error" });
  }
});

module.exports = router;
