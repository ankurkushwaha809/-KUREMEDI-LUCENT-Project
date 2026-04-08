const processEnv: Record<string, string> | undefined =
  typeof process !== "undefined"
    ? (process as unknown as { env?: Record<string, string> }).env
    : undefined;

// API: EXPO_PUBLIC_API_URL (full URL). Default points to production API.
const DEFAULT_API_URL = "https://api.kuremedi.com/api";

const getBaseUrl = (): string => {
  const envUrl = processEnv?.EXPO_PUBLIC_API_URL;
  if (envUrl && envUrl.trim()) {
    const base = envUrl.trim().replace(/\/$/, "");
    return base.endsWith("/api") ? base : `${base}/api`;
  }
  // Fallback to production API
  return DEFAULT_API_URL;
};

export const API_BASE_URL = getBaseUrl();
export const API_UPLOAD_BASE =
  API_BASE_URL.replace(/\/api\/?$/, "") ||
  DEFAULT_API_URL.replace(/\/api\/?$/, "");

/** WebSocket URL for support chat (same host as API). */
export const SUPPORT_WS_URL = (() => {
  const base =
    API_BASE_URL.replace(/\/api\/?$/, "") ||
    DEFAULT_API_URL.replace(/\/api\/?$/, "");
  return base.replace(/^http/, "ws");
})();
