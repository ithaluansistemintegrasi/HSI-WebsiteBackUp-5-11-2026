require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const multer = require("multer");

const authRoutes = require("./routes/auth");
const bannerRoutes = require("./routes/banners");
const eventRoutes = require("./routes/events");
const productRoutes = require("./routes/products");
const sparepartRoutes = require("./routes/spareparts");
const newsRoutes = require("./routes/news");
const uploadRoutes = require("./routes/uploads");
const partnerRoutes = require("./routes/partners");

const app = express();
app.use(express.json());

const allowed = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true);
      if (allowed.length === 0) return cb(null, true);
      if (allowed.includes(origin)) return cb(null, true);
      return cb(new Error("CORS blocked: " + origin));
    },
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  }),
);

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/auth", authRoutes);
app.use("/banners", bannerRoutes);
app.use("/events", eventRoutes);
app.use("/products", productRoutes);
app.use("/spareparts", sparepartRoutes);
app.use("/news", newsRoutes);
app.use("/partners", partnerRoutes);
app.use("/uploads-api", uploadRoutes);

app.use((err, req, res, next) => {
  if (!err) return next();

  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "Ukuran file maksimal 3 MB" });
    }

    return res.status(400).json({ message: err.message || "Upload gagal" });
  }

  if (
    err.message === "Only jpg/png/webp allowed" ||
    err.message === "Only jpg/png/webp/svg allowed"
  ) {
    return res
      .status(400)
      .json({ message: "Format file harus jpg, png, webp, atau svg" });
  }

  return res.status(500).json({ message: err.message || "Server error" });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log("API running on port", PORT));
