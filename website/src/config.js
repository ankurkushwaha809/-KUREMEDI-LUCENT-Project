/**
 * API config - use localhost for development, environment var for production
 */
const isDev = typeof window === "undefined" ? process.env.NODE_ENV === "development" : false;

let API_BASE = process.env.NEXT_PUBLIC_API_URL || 
               (isDev ? "http://localhost:5000/api" : "https://api.kuremedi.com/api");

// Normalize common mistakes from env (like `https:/.kuremedi.com/api`)
API_BASE = API_BASE.trim();
API_BASE = API_BASE.replace("https:/.kuremedi.com", "https://api.kuremedi.com");

export const API_BASE_URL = API_BASE;
// Drop the trailing `/api` so uploads come from the base URL
export const API_UPLOAD_BASE =
  API_BASE_URL.replace(/\/api\/?$/, "") || (isDev ? "http://localhost:5000" : "https://api.kuremedi.com");
