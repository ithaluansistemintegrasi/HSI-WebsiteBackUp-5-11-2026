import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { login, clearToken } from "./api";

export default function AdminLogin() {
  const nav = useNavigate();
  const loc = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const location = useLocation();
  const reason = location.state?.reason;

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await login(email, password);
      setEmail("");
      setPassword("");
      const to = loc.state?.from || "/admin";
      nav(to, { replace: true });
    } catch (e2) {
      setErr(e2?.message || "Login error");
      clearToken();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="text-xl font-semibold text-slate-900">Admin Login</div>
        <div className="text-sm text-slate-600 mt-1">
          HSI Website Admin Panel
        </div>

        {err ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {err}
          </div>
        ) : null}

        {reason === "idle" && (
          <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
            Session Expired. Login again.
          </p>
        )}

        <form onSubmit={onSubmit} className="mt-5 grid gap-3">
          <input
            className="border rounded-lg px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email"
          />
          <input
            className="border rounded-lg px-3 py-2"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="password"
          />

          <button
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-slate-900 text-white disabled:opacity-60"
          >
            {loading ? "Loading..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
