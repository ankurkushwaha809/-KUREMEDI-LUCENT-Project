import axios from 'axios';
import { API_BASE_URL } from '@/src/config';

const API_TIMEOUT_MS = 20_000;

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json', 'X-App': 'mr' },
});

// React Native FormData is not always detected by instanceof; ensure multipart is sent correctly
const isFormData = (data: unknown): boolean =>
  typeof data === 'object' &&
  data != null &&
  (data instanceof FormData || typeof (data as FormData).append === 'function');

api.interceptors.request.use((config) => {
  if (isFormData(config.data)) {
    delete config.headers['Content-Type'];
    config.transformRequest = [(data) => data];
  }
  return config;
});

// Surface backend message on 4xx/5xx
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.message;
    if (msg && typeof msg === 'string') err.message = msg;
    return Promise.reject(err);
  }
);
