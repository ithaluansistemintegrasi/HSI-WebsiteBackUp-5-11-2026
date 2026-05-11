const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { z } = require("zod");
const prisma = require("../prisma");
const { requireAuth } = require("../middlewares/auth");

const router = express.Router();

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

router.post("/login", async (req, res) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      message: "Invalid input",
      errors: parsed.error.errors,
    });
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user)
    return res.status(401).json({ ok: false, message: "Email/password salah" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok)
    return res.status(401).json({ ok: false, message: "Email/password salah" });

  if (!process.env.JWT_ACCESS_SECRET) {
    return res
      .status(500)
      .json({ ok: false, message: "JWT_ACCESS_SECRET belum di-set di .env" });
  }

  const accessToken = jwt.sign(
    { sub: user.id, role: user.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRES || "15m" },
  );

  res.json({
    ok: true,
    accessToken,
    user: { id: user.id, email: user.email, role: user.role },
  });
});

router.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, email: true, role: true, createdAt: true },
  });
  res.json({ ok: true, user });
});

module.exports = router;
