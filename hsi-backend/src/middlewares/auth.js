const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;

  if (!token)
    return res.status(401).json({ ok: false, message: "Missing Bearer token" });
  if (!process.env.JWT_ACCESS_SECRET) {
    return res
      .status(500)
      .json({ ok: false, message: "JWT_ACCESS_SECRET belum di-set di .env" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch (e) {
    return res
      .status(401)
      .json({ ok: false, message: "Invalid/expired token" });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user)
      return res.status(401).json({ ok: false, message: "Unauthenticated" });
    if (!roles.includes(req.user.role))
      return res.status(403).json({ ok: false, message: "Forbidden" });
    next();
  };
}

module.exports = { requireAuth, requireRole };
