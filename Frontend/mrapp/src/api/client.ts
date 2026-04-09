import axios from 'axios';
import { API_BASE_CANDIDATES, API_BASE_URL } from '@/src/config';

const API_TIMEOUT_MS = 20_000;

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json', 'X-App': 'mr' },
});

const nextFallbackBase = (currentBase?: string): string | null => {
  const current = (currentBase || API_BASE_URL).replace(/\/$/, '');
  const idx = API_BASE_CANDIDATES.findIndex((base) => base.replace(/\/$/, '') === current);
  if (idx >= 0 && idx < API_BASE_CANDIDATES.length - 1) {
    return API_BASE_CANDIDATES[idx + 1];
  }
  return null;
};

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
  async (err) => {
    const config = err?.config as (Record<string, unknown> & { baseURL?: string }) | undefined;
    const hasResponse = !!err?.response;
    const isTimeout = err?.code === 'ECONNABORTED';
    const isNetworkFailure = !hasResponse || isTimeout;

    if (config && isNetworkFailure) {
      const attemptedFallback = Boolean(config.__attemptedFallback);
      if (!attemptedFallback) {
        const fallbackBase = nextFallbackBase(config.baseURL);
        if (fallbackBase) {
          config.baseURL = fallbackBase;
          config.__attemptedFallback = true;
          return api.request(config as never);
        }
      }
    }

    const msg = err.response?.data?.message;
    if (msg && typeof msg === 'string') err.message = msg;
    return Promise.reject(err);
  }
);
