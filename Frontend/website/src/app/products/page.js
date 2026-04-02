"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getProductSlug, normalizeProducts } from "@/utils/product";
import { Heart, ChevronLeft } from "lucide-react";
import { useAppContext } from "@/context/context";
import { ProductCard } from "@/components/ProductCard";
import { SkeletonProductGrid } from "@/components/Skeleton";
import { showToast } from "@/utils/toast";

export default function ProductsPage() {
  const { getProducts, toggleWishlist, isInWishlist, addToCart, updateCartQty, cartItems, token, user, getProductImageUrl } =
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
      {/* Header Section */}
      <section className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-teal-800 tracking-tight">All Products</h1>
            <p className="text-sm text-gray-600 mt-1">Browse our complete pharmaceutical catalog</p>
          </div>
        </div>
        <div className="inline-block bg-teal-50 rounded-full px-4 py-2 text-sm font-semibold text-teal-700 border border-teal-200">
          {products.length} products available
        </div>
      </section>

      {/* Loading State */}
      {loading ? (
        <SkeletonProductGrid count={20} />
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-4">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <p className="text-lg font-semibold text-gray-600 mb-2">No products found</p>
          <p className="text-sm text-gray-500 mb-4">Check back soon for our latest offerings</p>
          <Link href="/" className="text-teal-700 font-semibold hover:underline">
            ← Return to Home
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {products.map((product) => {
            const wished = isInWishlist?.(product._id);
            const cartItem = cartItems.find((item) => item._id === product._id);
            const img = product?.productImages?.[0] || product?.image;
            const discountPercent = product.discountPercent || 0;

            return (
              <ProductCard
                key={product._id}
                product={product}
                cartItem={cartItem}
                wished={wished}
                onAdd={() => handleAdd(product)}
                onUpdateQty={updateCartQty}
                onToggleWishlist={() =>
                  toggleWishlist?.({
                    _id: product._id,
                    name: product.productName || product.name,
                    price: product.sellingPrice || product.price,
                    image: getProductImageUrl?.(img),
                    unit: product.packSize || product.unit || "1 unit",
                  })
                }
                imageUrl={getProductImageUrl?.(img)}
                showBadge={discountPercent > 0}
                badgeText={discountPercent > 0 ? `${discountPercent}% OFF` : ""}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
