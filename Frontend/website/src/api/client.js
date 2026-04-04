import { API_BASE_URL } from "../config";

const getToken = () => (typeof window !== "undefined" ? localStorage.getItem("token") : null);

function forceLogoutIfBlocked(status, data) {
  if (typeof window === "undefined") return;
  const hasToken = !!localStorage.getItem("token");
  if (!hasToken) return;

  const message = String(data?.message || "").toLowerCase();
  const isBlocked = status === 403 && message.includes("blocked");
  const isUnauthorized = status === 401;

  if (!isBlocked && !isUnauthorized) return;

  if (isBlocked && data?.message) {
    try {
      sessionStorage.setItem("blocked_message", String(data.message));
    } catch (_) {}
  }

  localStorage.removeItem("token");
  localStorage.removeItem("user");
  if (window.location.pathname !== "/login") {
    window.location.href = isBlocked ? "/login?blocked=1" : "/login";
  }
}

async function parseResponse(res) {
  const raw = await res.text();
  let data = null;

  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      data = { message: raw };
    }
  }

  if (!res.ok) {
    forceLogoutIfBlocked(res.status, data);
    const error = new Error(data?.message || `Request failed with status ${res.status}`);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

export async function apiGet(path) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Authorization: getToken() ? `Bearer ${getToken()}` : "",
    },
  });
  return parseResponse(res);
}

export async function apiPost(path, body) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: getToken() ? `Bearer ${getToken()}` : "",
    },
    body: JSON.stringify(body),
  });
  return parseResponse(res);
}

export async function apiPut(path, body) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: getToken() ? `Bearer ${getToken()}` : "",
    },
    body: JSON.stringify(body),
  });
  return parseResponse(res);
}

export async function apiDelete(path) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "DELETE",
    headers: {
      Authorization: getToken() ? `Bearer ${getToken()}` : "",
    },
  });
  return parseResponse(res);
}
