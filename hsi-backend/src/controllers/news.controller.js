const prisma = require("../prisma");

// helper slug sederhana
function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function pickLang(item, lang = "id") {
  const isEn = lang === "en";

  const authorName = item.author?.name || item.author?.email || null;

  return {
    id: item.id,
    slug: item.slug,
    title: isEn ? item.titleEn || item.titleId : item.titleId,
    excerpt: isEn
      ? item.excerptEn || item.excerptId || ""
      : item.excerptId || "",
    content: isEn ? item.contentEn || item.contentId : item.contentId,
    coverImage: item.coverImage,
    publishedAt: item.publishedAt,
    isActive: item.isActive,
    sort: item.sort,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,

    // ✅ tambahan untuk UI
    authorName,
  };
}

// ===== PUBLIC =====
async function publicListNews(req, res) {
  try {
    const lang = String(req.query.lang || "id");
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(50, Math.max(1, Number(req.query.limit || 9)));
    const skip = (page - 1) * limit;

    const where = { isActive: true };

    const [total, rows] = await Promise.all([
      prisma.news.count({ where }),
      prisma.news.findMany({
        where,
        include: { author: { select: { name: true, email: true } } }, // ✅ tambah
        orderBy: [
          { publishedAt: "desc" },
          { sort: "asc" },
          { createdAt: "desc" },
        ],
        skip,
        take: limit,
      }),
    ]);

    res.json({
      page,
      limit,
      total,
      items: rows.map((r) => pickLang(r, lang)),
    });
  } catch (e) {
    res.status(500).json({ message: "Failed to list news", error: String(e) });
  }
}

async function publicGetNewsBySlug(req, res) {
  try {
    const lang = String(req.query.lang || "id");
    const slug = req.params.slug;

    const item = await prisma.news.findUnique({
      where: { slug },
      include: { author: { select: { name: true, email: true } } }, // ✅ tambah
    });
    if (!item || !item.isActive)
      return res.status(404).json({ message: "Not found" });

    res.json(pickLang(item, lang));
  } catch (e) {
    res.status(500).json({ message: "Failed to get news", error: String(e) });
  }
}

// ===== ADMIN =====
async function adminListNews(req, res) {
  try {
    const q = String(req.query.q || "").trim();

    const where = q
      ? {
          OR: [
            { slug: { contains: q } },
            { titleId: { contains: q } },
            { titleEn: { contains: q } },
          ],
        }
      : {};

    const rows = await prisma.news.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      take: 200,
    });

    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: "Failed admin list", error: String(e) });
  }
}

async function adminCreateNews(req, res) {
  try {
    const body = req.body || {};
    const titleId = String(body.titleId || "").trim();
    if (!titleId)
      return res.status(400).json({ message: "titleId is required" });

    const rawSlug = String(body.slug || "").trim();
    const slugBase = rawSlug ? slugify(rawSlug) : slugify(titleId);

    let slug = slugBase;
    let i = 2;
    while (await prisma.news.findUnique({ where: { slug } })) {
      slug = `${slugBase}-${i++}`;
    }

    // ✅ ambil id user yang login (diisi oleh middleware requireAdmin/auth)
    const authorId = req.user?.id || null;

    const created = await prisma.news.create({
      data: {
        slug,
        titleId,
        titleEn: body.titleEn || null,
        excerptId: body.excerptId || null,
        excerptEn: body.excerptEn || null,
        contentId: body.contentId || "",
        contentEn: body.contentEn || null,
        coverImage: body.coverImage || null,
        publishedAt: body.publishedAt ? new Date(body.publishedAt) : null,
        isActive: body.isActive ?? true,
        sort: Number(body.sort || 0),

        authorId, // ✅ SIMPAN PEMBUAT
      },
      include: {
        author: { select: { name: true, email: true } }, // ✅ biar langsung kebawa ke response
      },
    });

    res.json(created);
  } catch (e) {
    res.status(500).json({ message: "Failed create", error: String(e) });
  }
}

async function adminUpdateNews(req, res) {
  try {
    const id = Number(req.params.id);
    const body = req.body || {};

    let slug;
    if (body.slug) {
      const slugBase = slugify(body.slug);
      slug = slugBase;

      const existing = await prisma.news.findUnique({ where: { slug } });
      if (existing && existing.id !== id) {
        let i = 2;
        while (
          await prisma.news.findUnique({ where: { slug: `${slugBase}-${i}` } })
        )
          i++;
        slug = `${slugBase}-${i}`;
      }
    }

    const updated = await prisma.news.update({
      where: { id },
      data: {
        ...(slug ? { slug } : {}),
        ...(body.titleId !== undefined ? { titleId: body.titleId } : {}),
        ...(body.titleEn !== undefined ? { titleEn: body.titleEn } : {}),
        ...(body.excerptId !== undefined ? { excerptId: body.excerptId } : {}),
        ...(body.excerptEn !== undefined ? { excerptEn: body.excerptEn } : {}),
        ...(body.contentId !== undefined ? { contentId: body.contentId } : {}),
        ...(body.contentEn !== undefined ? { contentEn: body.contentEn } : {}),
        ...(body.coverImage !== undefined
          ? { coverImage: body.coverImage }
          : {}),
        ...(body.publishedAt !== undefined
          ? {
              publishedAt: body.publishedAt ? new Date(body.publishedAt) : null,
            }
          : {}),
        ...(body.isActive !== undefined ? { isActive: !!body.isActive } : {}),
        ...(body.sort !== undefined ? { sort: Number(body.sort) } : {}),
      },
    });

    res.json(updated);
  } catch (e) {
    res.status(500).json({ message: "Failed update", error: String(e) });
  }
}

async function adminDeleteNews(req, res) {
  try {
    const id = Number(req.params.id);
    await prisma.news.delete({ where: { id } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: "Failed delete", error: String(e) });
  }
}

module.exports = {
  publicListNews,
  publicGetNewsBySlug,
  adminListNews,
  adminCreateNews,
  adminUpdateNews,
  adminDeleteNews,
};
