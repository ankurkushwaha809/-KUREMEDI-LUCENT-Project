/**
 * Normalizes backend Category for app use.
 * Backend: { _id, name, description, image }
 */

import { API_UPLOAD_BASE } from "@/src/config";

type IconName = "nutrition-outline" | "leaf-outline" | "fast-food-outline" | "cart-outline" | "cube-outline" | "water-outline";
const ICON_MAP: Record<string, IconName> = {
  fruits: "nutrition-outline",
  fresh: "leaf-outline",
  vegetables: "leaf-outline",
  snack: "fast-food-outline",
  grocery: "cart-outline",
  nuts: "cube-outline",
  oils: "water-outline",
  dairy: "water-outline",
};

const getIcon = (name: string) => {
  const key = name.toLowerCase().replace(/\s+/g, "");
  return ICON_MAP[key] ?? "cart-outline";
};

const getImageUrl = (path: string | undefined): string => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const p = String(path).replace(/\\/g, "/").replace(/^\//, "");
  return `${API_UPLOAD_BASE}/${p}`;
};

export type AppCategory = {
  id: string;
  _id: string;
  name: string;
  description?: string;
  image: string;
  icon: IconName;
};

export type BackendCategory = {
  _id: string;
  name: string;
  description?: string;
  image?: string;
};

export function normalizeCategory(c: BackendCategory): AppCategory {
  return {
    id: c._id,
    _id: c._id,
    name: c.name,
    description: c.description,
    image: getImageUrl(c.image),
    icon: getIcon(c.name),
  };
}

export function normalizeCategories(data: unknown): AppCategory[] {
  const arr = Array.isArray(data) ? data : (data as { data?: unknown[] })?.data;
  if (!Array.isArray(arr)) return [];
  return arr.map((c) => normalizeCategory(c as BackendCategory));
}
