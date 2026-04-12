"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getProductSlug, normalizeProducts } from "@/utils/product";
import { ChevronLeft, Search } from "lucide-react";
import { useAppContext } from "@/context/context";
import { ProductCard } from "@/components/ProductCard";
import { SkeletonProductGrid } from "@/components/Skeleton";
import { showToast } from "@/utils/toast";

export default function ProductsPage() {
  const { getProducts, toggleWishlist, isInWishlist, addToCart, updateCartQty, cartItems, token, user, getProductImageUrl } =
    useAppContext();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchText.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, sortBy]);

  useEffect(() => {
    setLoading(true);
    getProducts({
      page,
      limit,
      search: debouncedSearch || undefined,
      sortBy,
    })
      .then((res) => {
        const items = Array.isArray(res)
          ? res
          : Array.isArray(res?.items)
            ? res.items
            : Array.isArray(res?.data)
              ? res.data
              : [];

        setProducts(normalizeProducts(items));

        const total = Number(res?.total);
        const pages = Number(res?.totalPages);
        setTotalProducts(Number.isFinite(total) ? total : items.length);
        setTotalPages(Number.isFinite(pages) && pages > 0 ? pages : 1);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [getProducts, page, limit, debouncedSearch, sortBy]);

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
    } catch (err) {
      showToast(err?.message || "Could not add to cart.", "error");
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
          {totalProducts} products available
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search by product, brand, category"
              className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-teal-400"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 px-3 text-sm outline-none focus:border-teal-400"
          >
            <option value="newest">Sort by: Newest</option>
            <option value="name-asc">Sort by: Name (A-Z)</option>
            <option value="name-desc">Sort by: Name (Z-A)</option>
            <option value="price-low">Sort by: Price (Low to High)</option>
            <option value="price-high">Sort by: Price (High to Low)</option>
          </select>
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
          <p className="text-sm text-gray-500 mb-4">Try a different search or sort option</p>
          <Link href="/" className="text-teal-700 font-semibold hover:underline">
            ← Return to Home
          </Link>
        </div>
      ) : (
        <>
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

          <div className="mt-8 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page <= 1 || loading}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page >= totalPages || loading}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
