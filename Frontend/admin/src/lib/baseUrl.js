const isDev = import.meta.env.DEV;

let rawBase =
  import.meta.env.VITE_BASE_URL ||
  (isDev ? "http://localhost:5000/api" : "http://65.1.65.146:5000/api");

rawBase = String(rawBase || "").trim();
rawBase = rawBase.replace("https:/.kuremedi.com", "http://65.1.65.146:5000");

export const ADMIN_API_BASE_URL = rawBase.replace(/\/$/, "");
export const ADMIN_UPLOAD_BASE_URL = ADMIN_API_BASE_URL.replace(/\/api\/?$/, "");

export const resolveUploadUrl = (value) => {
  if (!value) return "";
  const raw = String(value).trim();
  if (!raw) return "";
  if (raw.startsWith("http") || raw.startsWith("blob:") || raw.startsWith("data:")) {
    return raw;
  }
  const normalized = raw.replace(/\\/g, "/").replace(/^\/+/, "");
  return `${ADMIN_UPLOAD_BASE_URL}/${normalized}`;
};
