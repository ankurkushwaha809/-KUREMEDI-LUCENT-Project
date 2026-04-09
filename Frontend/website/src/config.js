/**
 * API config - matches app config. Use same backend as React Native app.
 */
const isDevelopment = process.env.NODE_ENV !== "production";
const defaultApiBase = isDevelopment
  ? "http://localhost:5000/api"
  : "https://backend.kuremedi.com/api";

let API_BASE = process.env.NEXT_PUBLIC_API_URL || defaultApiBase;

// Normalize common mistakes from env (like `https:/.kuremedi.com/api`)
API_BASE = API_BASE.trim();
API_BASE = API_BASE.replace("https:/.kuremedi.com", "https://backend.kuremedi.com");

// Ensure API base always points to `/api` even if env is set as just domain.
if (API_BASE) {
  const normalizedBase = API_BASE.replace(/\/+$/, "");
  if (normalizedBase.startsWith("http")) {
    API_BASE = normalizedBase.endsWith("/api") ? normalizedBase : `${normalizedBase}/api`;
  } else {
    API_BASE = normalizedBase.endsWith("/api") ? normalizedBase : `${normalizedBase}/api`;
  }
}

export const API_BASE_URL = API_BASE;
// If API is relative (/api), uploads should also be relative (/uploads).
// If API is absolute, drop trailing /api so uploads use same backend host.
export const API_UPLOAD_BASE =
  process.env.NEXT_PUBLIC_UPLOAD_BASE ||
  (API_BASE_URL.startsWith("/")
    ? API_BASE_URL.replace(/\/api\/?$/, "") || "/"
    : API_BASE_URL.replace(/\/api\/?$/, "")) ||
  (isDevelopment ? "http://localhost:5000" : "https://backend.kuremedi.com");
