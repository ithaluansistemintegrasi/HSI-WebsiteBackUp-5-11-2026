// src/middlewares/requireAdmin.js
const { requireAuth, requireRole } = require("./auth");

// ADMIN-only
module.exports = [requireAuth, requireRole("ADMIN")];
