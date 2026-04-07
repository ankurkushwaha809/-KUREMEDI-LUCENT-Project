/**
 * API config - matches app config. Use same backend as React Native app.
 */
const isDevelopment = process.env.NODE_ENV !== "production";
const defaultApiBase = isDevelopment
  ? "http://localhost:5000/api"
  : "http://65.1.65.146:5000/api";

let API_BASE = process.env.NEXT_PUBLIC_API_URL || defaultApiBase;

// Normalize common mistakes from env (like `https:/.kuremedi.com/api`)
API_BASE = API_BASE.trim();
API_BASE = API_BASE.replace("https:/.kuremedi.com", "http://65.1.65.146:5000");

export const API_BASE_URL = API_BASE;
// If API is relative (/api), uploads should also be relative (/uploads).
// If API is absolute, drop trailing /api so uploads use same backend host.
export const API_UPLOAD_BASE =
  process.env.NEXT_PUBLIC_UPLOAD_BASE ||
  (API_BASE_URL.startsWith("/")
    ? API_BASE_URL.replace(/\/api\/?$/, "") || "/"
    : API_BASE_URL.replace(/\/api\/?$/, "")) ||
  (isDevelopment ? "http://localhost:5000" : "http://65.1.65.146:5000");
