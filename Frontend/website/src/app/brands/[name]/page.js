"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getProductSlug, normalizeProducts, slugify } from "@/utils/product";
import { Heart, ArrowLeft } from "lucide-react";
import { useAppContext } from "@/context/context";
import { SkeletonProductGrid } from "@/components/Skeleton";
import { showToast } from "@/utils/toast";

export default function BrandByNamePage() {
  const params = useParams();
  const slug = params?.name || "";
  const { getProducts, getBrands, toggleWishlist, isInWishlist, addToCart, token, user } =
    useAppContext();

  const [brandName, setBrandName] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setNotFound(false);
    getBrands()
      .then((res) => {
        const list = res?.data ?? (Array.isArray(res) ? res : []);
        const brand = list.find((b) => slugify(b?.name || "") === slug);
        if (!brand) {
          setNotFound(true);
          setBrandName(decodeURIComponent(slug).replace(/-/g, " "));
          setProducts([]);
          setLoading(false);
          return;
        }
        const name = brand.name || "";
        setBrandName(name);
        return getProducts({ brand: name });
      })
      .then((res) => {
        if (!res) return;
        const list = Array.isArray(res) ? res : res?.data ?? [];
        setProducts(normalizeProducts(list));
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [slug, getProducts, getBrands]);

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
      <Link
        href="/brands"
        className="inline-flex items-center gap-2 text-teal-700 hover:text-teal-800 font-medium mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Brands
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6 capitalize">
        {brandName || decodeURIComponent(slug).replace(/-/g, " ")}
      </h1>
      {loading ? (
        <SkeletonProductGrid count={10} />
      ) : notFound || products.length === 0 ? (
        <p className="text-gray-500">No products found for this brand.</p>
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
                    className="w-full h-25 object-contain rounded-xl mb-3"
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
