/**
 * Normalizes backend Brand for app use.
 * Backend: { _id, name, description, logo, isActive }
 */

import { API_UPLOAD_BASE } from "@/src/config";

const getImageUrl = (path: string | undefined): string => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const p = String(path).replace(/\\/g, "/").replace(/^\//, "");
  return `${API_UPLOAD_BASE}/${p}`;
};

export type AppBrand = {
  id: string;
  _id: string;
  name: string;
  description?: string;
  logo: string;
  isActive: boolean;
};

export type BackendBrand = {
  _id: string;
  name: string;
  description?: string;
  logo?: string;
  isActive?: boolean;
};

export function normalizeBrand(b: BackendBrand): AppBrand {
  return {
    id: b._id,
    _id: b._id,
    name: b.name,
    description: b.description,
    logo: getImageUrl(b.logo),
    isActive: b.isActive ?? true,
  };
}

export function normalizeBrands(data: unknown): AppBrand[] {
  const arr = Array.isArray(data) ? data : (data as { data?: unknown[] })?.data;
  if (!Array.isArray(arr)) return [];
  return arr.map((b) => normalizeBrand(b as BackendBrand));
}
