"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getProductSlug, normalizeProducts } from "@/utils/product";
import { Heart } from "lucide-react";
import { useAppContext } from "@/context/context";
import { SkeletonProductGrid } from "@/components/Skeleton";
import { showToast } from "@/utils/toast";

export default function ProductsPage() {
  const { getProducts, toggleWishlist, isInWishlist, addToCart, token, user } =
    useAppContext();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getProducts()
      .then((res) => {
        const list = Array.isArray(res) ? res : res?.data ?? [];
        setProducts(normalizeProducts(list));
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [getProducts]);

  const handleAdd = async (product) => {
    if (!token) {
      window.location.href = "/login";
      return;
    }
    if (user?.kyc !== "APPROVED") {
      showToast("Complete KYC to add to cart.", "info", "KYC Required");
      return;
    }
    try {
      await addToCart(product._id, product.minOrderQty ?? 1);
      showToast("Added to cart");
    } catch {
      showToast("Could not add to cart.", "error");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <section className="text-center py-2 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-teal-800 tracking-tight">Scaleten</h1>
        <p className="text-sm text-gray-600 mt-1">Pharmaceutical Excellence — Your trusted partner in healthcare</p>
      </section>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">All Products</h2>

      {loading ? (
        <SkeletonProductGrid count={10} />
      ) : products.length === 0 ? (
        <p className="text-gray-500">No products found.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {products.map((product) => {
            const wished = isInWishlist?.(product._id);
            return (
              <div
                key={product._id}
                className="relative border border-gray-100 rounded-2xl p-4 bg-white hover:shadow-lg transition-shadow"
              >
                <button
                  onClick={() =>
                    toggleWishlist?.({
                      _id: product._id,
                      name: product.name,
                      price: product.price,
                      image: product.image,
                      unit: product.unit,
                    })
                  }
                  className={`absolute top-4 right-4 p-1.5 bg-white rounded-full shadow z-10 ${
                    wished ? "text-red-500" : "text-gray-400"
                  }`}
                >
                  <Heart className={`w-4 h-4 ${wished ? "fill-current" : ""}`} />
                </button>
                <Link href={`/products/${getProductSlug(product)}`}>
                  <img
                    src={product.image || "https://placehold.co/200?text=No+Image"}
                    alt={product.name}
                    className="w-full h-24 object-contain rounded-xl mb-3"
                  />
                </Link>
                <p className="text-teal-700 font-bold">₹{product.price}</p>
                <p className="text-sm text-gray-700 line-clamp-2">{product.name}</p>
                <button
                  onClick={() => handleAdd(product)}
                  disabled={(product.stockQuantity ?? 1) <= 0}
                  className="mt-3 w-full py-2 border border-teal-600 text-teal-600 font-bold rounded-lg hover:bg-teal-50 uppercase text-xs disabled:opacity-50"
                >
                  {(product.stockQuantity ?? 1) <= 0 ? "Out" : "Add"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
