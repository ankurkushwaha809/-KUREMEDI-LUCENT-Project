const rawBase = "http://13.127.14.35:5000/api";

export const ADMIN_API_BASE_URL = rawBase;
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
