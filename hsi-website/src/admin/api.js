const API_BASE =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ||
  "https://api.darul.hsi-fablab.com";

const TOKEN_KEY = "hsi_admin_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}

export function setToken(t) {
  localStorage.setItem(TOKEN_KEY, t);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function apiUrl(path) {
  if (path.startsWith("http")) return path;
  return `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
}

export async function apiFetch(path, options = {}) {
  const token = getToken();

  const headers = { Accept: "application/json", ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;

  const body = options.body;

  const isFormData =
    typeof FormData !== "undefined" && body instanceof FormData;

  const isPlainObject =
    body &&
    typeof body === "object" &&
    !isFormData &&
    !(body instanceof Blob) &&
    !(body instanceof ArrayBuffer);

  const finalOptions = { ...options, headers };

  if (isPlainObject) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
    finalOptions.body = JSON.stringify(body);
  } else {
    // FormData/undefined/string => kirim apa adanya
    finalOptions.body = body;
  }

  const res = await fetch(apiUrl(path), finalOptions);

  let json = null;
  const text = await res.text();
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!res.ok) {
    const msg = json?.message || `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return json;
}

export async function login(email, password) {
  const res = await fetch(apiUrl("/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.accessToken)
    throw new Error(json?.message || "Login failed");
  setToken(json.accessToken);
  return json.accessToken;
}

export async function me() {
  // kalau endpoint /auth/me sudah kamu buat
  return apiFetch("/auth/me");
}
