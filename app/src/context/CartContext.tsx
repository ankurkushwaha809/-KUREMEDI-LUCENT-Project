import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { API_UPLOAD_BASE } from "@/src/config";
import {
  addToCart as apiAddToCart,
  getCart,
  updateCartQty,
  removeFromCart as apiRemoveFromCart,
  clearCart as apiClearCart,
} from "@/src/api";
import { useAuth } from "./AuthContext";

export type CartItem = {
  _id: string;
  name: string;
  price: number;
  image: string;
  qty: number;
  minOrderQty?: number;
};

function getImageUrl(path: string | undefined): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const p = String(path).replace(/\\/g, "/").replace(/^\//, "");
  return `${API_UPLOAD_BASE}/${p}`;
}

function mapCartItem(item: {
  product?: { _id: string; productName?: string; sellingPrice?: number; productImages?: string[]; minOrderQty?: number };
  quantity?: number;
}): CartItem | null {
  const p = item?.product;
  if (!p?._id) return null;
  const imgs = p.productImages || [];
  const firstImg = Array.isArray(imgs) ? imgs[0] : "";
  return {
    _id: p._id,
    name: p.productName || "",
    price: Number(p.sellingPrice ?? 0),
    image: getImageUrl(firstImg),
    qty: item.quantity ?? 1,
    minOrderQty: p.minOrderQty != null ? Number(p.minOrderQty) : undefined,
  };
}

type CartContextType = {
  items: CartItem[];
  loading: boolean;
  addItem: (item: Omit<CartItem, "qty">, quantity?: number) => Promise<void>;
  decreaseItem: (id: string) => Promise<void>;
  updateItemQty: (id: string, newQty: number) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
};

const CartContext = createContext<CartContextType | null>(null);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) {
      setItems([]);
      return;
    }
    try {
      const res = (await getCart()) as {
        items?: { product?: { _id: string; productName?: string; sellingPrice?: number; productImages?: string[] }; quantity?: number }[];
      };
      const rawItems = res?.items ?? [];
      const mapped = rawItems
        .map((i) => mapCartItem(i))
        .filter((x): x is CartItem => x != null);
      setItems(mapped);
    } catch {
      setItems([]);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addItem = useCallback(
    async (item: Omit<CartItem, "qty">, quantity = 1) => {
      if (!isAuthenticated) return;
      // Optimistic: add or merge immediately
      setItems((prev) => {
        const idx = prev.findIndex((i) => i._id === item._id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], qty: next[idx].qty + quantity };
          return next;
        }
        return [...prev, { ...item, qty: quantity }];
      });
      setLoading(true);
      try {
        await apiAddToCart(item._id, quantity);
        await refreshCart();
      } catch {
        await refreshCart(); // revert on error
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, refreshCart]
  );

  const decreaseItem = useCallback(
    async (id: string) => {
      if (!isAuthenticated) return;
      const curr = items.find((i) => i._id === id);
      if (!curr) return;
      const newQty = curr.qty - 1;
      setLoading(true);
      try {
        if (newQty <= 0) {
          await apiRemoveFromCart(id);
        } else {
          await updateCartQty(id, newQty);
        }
        await refreshCart();
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, items, refreshCart]
  );

  const updateItemQty = useCallback(
    async (id: string, newQty: number) => {
      if (!isAuthenticated) return;
      // Optimistic: update UI immediately
      setItems((prev) => {
        if (newQty <= 0) return prev.filter((i) => i._id !== id);
        const idx = prev.findIndex((i) => i._id === id);
        if (idx < 0) return prev;
        const next = [...prev];
        next[idx] = { ...next[idx], qty: newQty };
        return next;
      });
      setLoading(true);
      try {
        if (newQty <= 0) {
          await apiRemoveFromCart(id);
        } else {
          await updateCartQty(id, newQty);
        }
        await refreshCart();
      } catch {
        await refreshCart(); // revert on error
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, refreshCart]
  );

  const removeItem = useCallback(
    async (id: string) => {
      if (!isAuthenticated) return;
      setLoading(true);
      try {
        await apiRemoveFromCart(id);
        await refreshCart();
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, refreshCart]
  );

  const clearCart = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      await apiClearCart();
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  return (
    <CartContext.Provider
      value={{
        items,
        loading,
        addItem,
        decreaseItem,
        updateItemQty,
        removeItem,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be inside CartProvider");
  return ctx;
};
