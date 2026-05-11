const express = require("express");
const router = express.Router();

const {
  publicListNews,
  publicGetNewsBySlug,
  adminListNews,
  adminCreateNews,
  adminUpdateNews,
  adminDeleteNews,
} = require("../controllers/news.controller");

// Kalau kamu belum punya middleware admin, biarkan tembus dulu.
// Nanti kita sambungkan ke middleware auth yang kamu pakai.
let requireAdmin;
try {
  requireAdmin = require("../middlewares/requireAdmin");
} catch (e) {
  requireAdmin = (req, res, next) => next();
}

// ADMIN (taruh di atas biar gak ketangkep sebagai slug)
router.get("/admin/list", requireAdmin, adminListNews);
router.post("/admin", requireAdmin, adminCreateNews);
router.patch("/admin/:id", requireAdmin, adminUpdateNews); // ✅ PATCH (sesuai CORS kamu)
router.delete("/admin/:id", requireAdmin, adminDeleteNews);

// PUBLIC
router.get("/", publicListNews);
router.get("/:slug", publicGetNewsBySlug);

module.exports = router;
