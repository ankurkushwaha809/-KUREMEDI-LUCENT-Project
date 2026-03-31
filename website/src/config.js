/**
 * API config - matches app config. Use same backend as React Native app.
 */
let API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.kuremedi.com/api";

// Normalize common mistakes from env (like `https:/.kuremedi.com/api`)
API_BASE = API_BASE.trim();
API_BASE = API_BASE.replace("https:/.kuremedi.com", "https://api.kuremedi.com");

export const API_BASE_URL = API_BASE;
// Drop the trailing `/api` so uploads come from `https://api.kuremedi.com/...`
export const API_UPLOAD_BASE =
  API_BASE_URL.replace(/\/api\/?$/, "") || "https://api.kuremedi.com";
