"use client";

import React from "react";
import Link from "next/link";
import { getProductSlug } from "@/utils/product";
import { Heart } from "lucide-react";
import { useAppContext } from "@/context/context";
import { showToast } from "@/utils/toast";

export default function WishlistPage() {
  const { wishlistItems, addToCart, toggleWishlist, isInWishlist, token, user } = useAppContext();

  const handleAdd = async (item) => {
    if (!token) {
      window.location.href = "/login";
      return;
    }
    if (user?.kyc !== "APPROVED") {
      showToast("Complete KYC to add to cart.", "info", "KYC Required");
      return;
    }
    try {
      await addToCart(item._id, 1);
      showToast("Added to cart");
    } catch (err) {
      showToast(err?.message || "Could not add to cart.", "error");
    }
  };

  if (!wishlistItems?.length) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <div className="w-24 h-24 rounded-full bg-pink-50 flex items-center justify-center mb-4">
          <Heart className="w-12 h-12 text-pink-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">No wishlist items</h2>
        <p className="text-gray-500 mt-1 text-center">Add products you like from the store</p>
        <Link href="/" className="mt-6 text-teal-700 font-semibold hover:underline">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Wishlist</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {wishlistItems.map((item) => {
          const wished = isInWishlist?.(item._id);
          return (
            <div
              key={item._id}
              className="relative border border-gray-100 rounded-2xl p-4 bg-white hover:shadow-lg transition-shadow"
            >
              <button
                onClick={() => toggleWishlist?.(item)}
                className={`absolute top-4 right-4 p-1.5 bg-white rounded-full shadow z-10 ${wished ? "text-red-500" : "text-gray-400"}`}
              >
                <Heart className={`w-4 h-4 fill-current`} />
              </button>
              <Link href={`/products/${getProductSlug(item)}`}>
                <img
                  src={item.image || "https://placehold.co/200?text=No+Image"}
                  alt={item.name}
                  className="w-full h-40 object-contain rounded-xl mb-3"
                />
              </Link>
              <p className="text-teal-700 font-bold">₹{item.price}</p>
              <p className="text-sm text-gray-700 line-clamp-2">{item.name}</p>
              <button
                onClick={() => handleAdd(item)}
                className="mt-3 w-full py-2 border border-pink-200 text-pink-600 font-bold rounded-lg hover:bg-pink-50 uppercase text-xs"
              >
                Add to Cart
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
