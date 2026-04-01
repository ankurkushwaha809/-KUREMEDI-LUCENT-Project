import React, { createContext, useContext, useState } from "react";

export type WishlistItem = {
  _id: string;
  name: string;
  price: number;
  image: string;
  unit: string;
};

type WishlistContextType = {
  items: WishlistItem[];
  toggleWishlist: (item: WishlistItem) => void;
  isInWishlist: (id: string) => boolean;
  clearWishlist: () => void;
};

const WishlistContext = createContext<WishlistContextType | null>(null);

export const WishlistProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [items, setItems] = useState<WishlistItem[]>([]);

  const toggleWishlist = (item: WishlistItem) => {
    setItems((prev) => {
      const exists = prev.find((p) => p._id === item._id);

      if (exists) {
        return prev.filter((p) => p._id !== item._id);
      }

      return [...prev, item];
    });
  };

  const isInWishlist = (id: string) => {
    return items.some((p) => p._id === id);
  };

  const clearWishlist = () => setItems([]);

  return (
    <WishlistContext.Provider
      value={{ items, toggleWishlist, isInWishlist, clearWishlist }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used inside WishlistProvider");
  return ctx;
};
