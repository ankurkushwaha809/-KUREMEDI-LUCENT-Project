"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  Heart,
  Share2,
  ShieldCheck,
  Truck
} from "lucide-react";
import { useAppContext } from "@/context/context";
import { normalizeProduct, slugify, getProductSlug, getCategorySlug, parseProductSlugOrId } from "@/utils/product";
import { showToast } from "@/utils/toast";

const isMongoId = (s) => typeof s === "string" && /^[a-f0-9]{24}$/i.test(s);

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slugOrId = params?.id;
  const { getProductById, getProducts, addToCart, token, user, toggleWishlist, isInWishlist } = useAppContext();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [similarProduct, setSimilarProducts] = useState([]);
  const similarScrollRef = useRef(null);

  useEffect(() => {
    if (!slugOrId) return;
    setLoading(true);
    const { id } = parseProductSlugOrId(slugOrId);
    const effectiveId = id || (isMongoId(slugOrId) ? slugOrId : null);

    if (effectiveId) {
      getProductById(effectiveId)
        .then((data) => {
          const p = normalizeProduct(data);
          setProduct(p);
          if (p?.minOrderQty) setQty(p.minOrderQty);
        })
        .finally(() => setLoading(false));
    } else {
      getProducts()
        .then((res) => {
          const list = Array.isArray(res) ? res : res?.data ?? [];
          const name = decodeURIComponent(slugOrId).replace(/-/g, " ");
          const found = list.find(
            (p) =>
              slugify(p.productName || p.name || "") === slugOrId ||
              getProductSlug(p) === slugOrId ||
              (p.productName || p.name || "").toLowerCase() === name.toLowerCase()
          );
          const p = found ? normalizeProduct(found) : null;
          setProduct(p);
          if (p?.minOrderQty) setQty(p.minOrderQty);
        })
        .finally(() => setLoading(false));
    }
  }, [slugOrId, getProductById, getProducts]);

  useEffect(() => {
    if (!product?.categoryName) return;
    setLoadingSimilar(true);
    getProducts({ category: product.categoryName })
      .then((res) => {
        const list = Array.isArray(res) ? res : res?.data ?? [];
        const similar = list
          .filter((p) => p._id !== product._id)
          .slice(0, 10)
          .map((p) => normalizeProduct(p));
        setSimilarProducts(similar);
      })
      .finally(() => setLoadingSimilar(false));
  }, [product?.categoryName, product?._id, getProducts]);

  if (loading || !product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-teal-100 border-t-teal-600 rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">{loading ? "Fetching Details..." : "Product not found"}</p>
        </div>
      </div>
    );
  }

  const imageList = product.images?.length ? product.images : [product?.image].filter(Boolean);
  const minQty = product.minOrderQty ?? 1;
  const maxQty = Math.min(product.stockQuantity ?? 999, 999);
  const total = (product.price * qty).toLocaleString('en-IN');
  const wished = isInWishlist(product._id);

  const handleAddToCart = async () => {
    if (!token) return router.push("/login");
    if (user?.kyc !== "APPROVED") {
      showToast("Complete KYC verification to order.", "info", "KYC Required");
      return router.push("/profile");
    }
    try {
      await addToCart(product._id, qty);
      showToast("Added to cart");
      router.push("/cart");
    } catch {
      showToast("Could not add to cart.", "error");
    }
  };

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const shareData = {
      title: product?.name || "Product",
      text: product?.name ? `${product.name} - ₹${product.price}` : undefined,
      url,
    };
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
        showToast("Shared successfully");
      } catch (e) {
        if (e.name !== "AbortError") handleShareFallback(shareData);
      }
    } else {
      handleShareFallback(shareData);
    }
  };

  const handleShareFallback = ({ url, title }) => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url || title || "").then(() => showToast("Link copied to clipboard"));
    } else {
      showToast("Share not supported on this device");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* 1. CLEAN STICKY HEADER */}
      <div className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center">
          <button onClick={() => router.back()} className="flex items-center text-gray-700 hover:text-teal-600 transition-colors group">
            <div className="p-1.5 rounded-full group-hover:bg-teal-50">
              <ChevronLeft className="w-5 h-5" />
            </div>
            <span className="ml-1 font-semibold">Back to Search</span>
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

          {/* 2. LEFT COLUMN: IMAGE GALLERY WITH OVERLAY BUTTONS */}
          <div className="space-y-4">
            <div className="relative group/main bg-white border border-gray-100 rounded-[32px] overflow-hidden aspect-square flex items-center justify-center p-10 hover:shadow-xl transition-all duration-500">
              <img
                src={imageList[activeImage] || "https://placehold.co/500?text=No+Image"}
                alt={product.name}
                className="max-h-full max-w-full object-contain mix-blend-multiply transition-transform duration-500 group-hover/main:scale-105"
              />

              {/* Floating Action Buttons on Image */}
              <div className="absolute top-6 right-6 flex flex-col gap-3">
                <button
                  onClick={handleShare}
                  className="p-3 bg-white/90 backdrop-blur-md border border-gray-100 rounded-full text-gray-600 shadow-lg hover:bg-teal-600 hover:text-white transition-all active:scale-90"
                >
                  <Share2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => toggleWishlist(product)}
                  className={`p-3 bg-white/90 backdrop-blur-md border border-gray-100 rounded-full shadow-lg transition-all active:scale-90 ${wished ? "text-red-500" : "text-gray-400 hover:text-red-500"
                    }`}
                >
                  <Heart className={`w-5 h-5 ${wished ? "fill-current" : ""}`} />
                </button>
              </div>
            </div>

            {/* Thumbnails below main image */}
            {imageList.length > 1 && (
              <div className="flex gap-3 overflow-x-auto py-2 no-scrollbar">
                {imageList.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    className={`shrink-0 w-20 h-20 border-2 rounded-2xl overflow-hidden transition-all ${activeImage === idx ? "border-teal-600 bg-teal-50 shadow-md" : "border-gray-100 hover:border-teal-200"
                      }`}
                  >
                    <img src={img} alt="thumb" className="w-full h-full object-contain p-2" />
                  </button>
                ))}
              </div>
            )}

            {/* Trust Badges */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="flex items-center gap-3 p-4 bg-teal-50/50 rounded-2xl border border-teal-100">
                <ShieldCheck className="w-6 h-6 text-teal-600" />
                <div>
                  <p className="text-xs font-bold text-teal-900">Genuine Product</p>
                  <p className="text-[10px] text-teal-700">100% Quality Assurance</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                <Truck className="w-6 h-6 text-blue-600" />
                <div>
                  <p className="text-xs font-bold text-blue-900">Express Delivery</p>
                  <p className="text-[10px] text-blue-700">Same day available</p>
                </div>
              </div>
            </div>
          </div>

          {/* 3. RIGHT COLUMN: PRODUCT INFO */}
          <div className="space-y-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-teal-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Verified Pharmaceutical
                </span>
                {product.brand && <span className="text-teal-600 text-sm font-semibold tracking-wide">{product.brand}</span>}
              </div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight leading-tight uppercase">
                {product.name}
              </h1>
            </div>

            {/* Price Card */}
            <div className="p-6 bg-gray-50 rounded-[32px] space-y-4 border border-gray-100">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-black text-teal-700">₹{product.price}</span>
                {product.mrp && product.mrp > product.price && (
                  <>
                    <span className="text-xl text-gray-400 line-through">₹{product.mrp}</span>
                    <span className="bg-teal-100 text-teal-700 px-3 py-1 rounded-full font-bold text-xs">
                      {Math.round(((product.mrp - product.price) / product.mrp) * 100)}% SAVINGS
                    </span>
                  </>
                )}
              </div>
              <div className="h-px bg-gray-200 w-full" />

              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Pack Specification</p>
                <div className="flex gap-3">
                  <button className="px-5 py-2.5 rounded-xl border-2 border-teal-600 bg-white text-teal-700 font-bold text-sm shadow-sm">
                    {product.unit || "Standard Unit"}
                  </button>
                </div>
              </div>
            </div>

            {/* Quantity and CTA */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase mb-2">Order Quantity</p>
                  <div className="flex items-center bg-white border-2 border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                    <button
                      onClick={() => setQty(Math.max(minQty, qty - 1))}
                      className="p-3 hover:bg-teal-50 text-gray-600 transition-colors"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <span className="px-6 font-bold text-lg text-gray-800 border-x border-gray-100">{qty}</span>
                    <button
                      onClick={() => setQty(Math.min(maxQty, qty + 1))}
                      className="p-3 hover:bg-teal-50 text-gray-600 transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 font-bold uppercase mb-2">Checkout Total</p>
                  <p className="text-2xl font-black text-gray-900">₹{total}</p>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={(product.stockQuantity ?? 0) <= 0}
                className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-black text-lg shadow-xl shadow-teal-100 transition-all flex items-center justify-center gap-2 group disabled:bg-gray-200 disabled:shadow-none active:scale-[0.98]"
              >
                {(product.stockQuantity ?? 0) <= 0 ? "OUT OF STOCK" : "ADD TO CART"}
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {product.description && (
              <div className="space-y-3 pt-6 border-t border-gray-100">
                <h3 className="font-bold text-gray-900 uppercase text-xs tracking-widest">Medical Description</h3>
                <p className="text-gray-600 leading-relaxed text-sm text-justify">{product.description}</p>
              </div>
            )}
          </div>
        </div>

          {/* Similar Products Section */}
          {similarProduct.length > 0 && (
            <section className="mt-16 relative">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Similar Products</h2>
                {(product.categoryName || product.category) && (
                  <Link
                    href={`/categories/${getCategorySlug(product.categoryName || product.category)}`}
                    className="text-teal-600 hover:text-teal-700 font-semibold text-sm"
                  >
                    View All →
                  </Link>
                )}
              </div>

            <div
              ref={similarScrollRef}
              className="flex gap-6 overflow-x-auto pb-8 no-scrollbar scroll-smooth"
            >
              {similarProduct.map((item) => (
                <div
                  key={item._id}
                  className="w-56 md:w-64 shrink-0 border border-gray-100 rounded-[24px] p-5 bg-white hover:shadow-2xl hover:border-teal-100 transition-all group/card"
                >
                  <Link href={`/products/${getProductSlug(item)}`} className="block relative">
                    <div className="w-full h-44 bg-gray-50 rounded-2xl flex items-center justify-center p-4 mb-4 group-hover/card:bg-white transition-colors">
                      <img src={item.image} alt={item.name} className="max-h-full max-w-full object-contain mix-blend-multiply" />
                    </div>
                  </Link>

                  <div className="space-y-2">
                    <p className="text-teal-700 font-black text-xl">₹{item.price}</p>
                    <h3 className="text-sm font-bold text-gray-700 line-clamp-2 min-h-[40px] uppercase">
                      {item.name}
                    </h3>
                    <button
                      onClick={() => addToCart(item._id, item.minOrderQty || 1)}
                      className="w-full py-2.5 bg-teal-50 text-teal-700 border border-teal-100 font-bold rounded-xl hover:bg-teal-600 hover:text-white transition-all text-xs uppercase tracking-tighter"
                    >
                      Quick Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}