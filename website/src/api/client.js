import { API_BASE_URL } from "../config";

const getToken = () => (typeof window !== "undefined" ? localStorage.getItem("token") : null);

export async function apiGet(path) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Authorization: getToken() ? `Bearer ${getToken()}` : "",
    },
  });
  return res.json();
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
  return res.json();
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
  return res.json();
}

export async function apiDelete(path) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "DELETE",
    headers: {
      Authorization: getToken() ? `Bearer ${getToken()}` : "",
    },
  });
  return res.json();
}
