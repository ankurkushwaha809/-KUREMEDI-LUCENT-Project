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
  const maxQty = Math.min(product.stockQuantity ?? 9999, 9999);
  const unitPrice = Number(product.price || 0);
  const sellingPrice = Number(product.sellingPrice ?? unitPrice);
  const mrpValue = Number(product.mrp);
  const hasValidMrp = Number.isFinite(mrpValue) && mrpValue > 0;
  const discountPercent = Math.max(0, Math.min(100, Number(product.discountPercent || 0)));
  const discountAmount = (sellingPrice * discountPercent) / 100;
  const discountedPrice = Math.max(0, sellingPrice - discountAmount);
  const gstPercentValue = Math.max(0, Number(product.gstPercent || 0));
  const isGstApplied = gstPercentValue > 0;
  const gstAmount = isGstApplied ? (sellingPrice * gstPercentValue) / 100 : 0;
  const computedFinalPrice = discountedPrice + gstAmount;
  const finalUnitPrice = Number.isFinite(computedFinalPrice) ? computedFinalPrice : unitPrice;
  const total = (finalUnitPrice * qty).toLocaleString("en-IN");
  const showDiscount = discountPercent > 0;
  const formatMoney = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
  const taxLabel = isGstApplied
    ? `GST Applied (${gstPercentValue.toFixed(2)}%)`
    : "GST Not Applied";
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
    <div className="min-h-screen bg-gray-50">
      {/* Header with breadcrumb */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-teal-600 transition-colors gap-1 mb-2"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT: Image Gallery - Takes 1.5 columns */}
          <div className="lg:col-span-1 space-y-4">
            {/* Main Image */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden aspect-square flex items-center justify-center p-6 relative group">
              <img
                src={imageList[activeImage] || "https://placehold.co/500?text=No+Image"}
                alt={product.name}
                className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
              />
              
              {/* Floating Wishlist Button */}
              <button
                onClick={() => toggleWishlist(product)}
                className={`absolute top-4 right-4 w-10 h-10 rounded-full bg-white border-2 shadow-md transition-all flex items-center justify-center ${
                  wished ? "border-pink-500" : "border-gray-200 hover:border-pink-500"
                }`}
              >
                <Heart className={`w-5 h-5 ${wished ? "fill-pink-500 text-pink-500" : "text-gray-400"}`} />
              </button>

              {/* Share Button */}
              <button
                onClick={handleShare}
                className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white border-2 border-gray-200 shadow-md hover:border-teal-600 transition-all flex items-center justify-center"
              >
                <Share2 className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Thumbnails */}
            {imageList.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {imageList.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    className={`shrink-0 w-16 h-16 border-2 rounded-lg overflow-hidden bg-white transition-all ${
                      activeImage === idx
                        ? "border-teal-600 shadow-md"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <img src={img} alt="thumb" className="w-full h-full object-contain p-1" />
                  </button>
                ))}
              </div>
            )}

            {/* Trust Badges */}
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <ShieldCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-green-700">Genuine Product</p>
                  <p className="text-[11px] text-green-600">100% Quality Assurance</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <Truck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-blue-700">Express Delivery</p>
                  <p className="text-[11px] text-blue-600">Same day available</p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Product Details - Takes 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Header */}
            <div>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="inline-block bg-green-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                  ✓ Verified
                </span>
                {product.brand && (
                  <span className="text-gray-600 text-sm font-semibold">{product.brand}</span>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 leading-snug">
                {product.name}
              </h1>

              {product.hsnCode && (
                <div className="mt-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 border-l-4 border-purple-500 rounded">
                  <p className="text-xs font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent uppercase tracking-wide">HSN Code: {product.hsnCode}</p>
                </div>
              )}
            </div>

            {/* Price Section */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-4">
                <div>
                  <p className="text-xs font-semibold tracking-[0.12em] text-gray-500 uppercase">Pricing Summary</p>
                  <p className="text-sm text-gray-500 mt-1">{taxLabel}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">MRP</p>
                  <p className="text-3xl font-black text-teal-700">{formatMoney(hasValidMrp ? mrpValue : sellingPrice)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                {hasValidMrp && (
                  <>
                    <p className="text-gray-600">MRP</p>
                    <p className="text-gray-900 font-semibold sm:text-right">{formatMoney(mrpValue)}</p>
                  </>
                )}

                <p className="text-gray-600">Selling Price</p>
                <p className="text-gray-900 font-semibold sm:text-right">{formatMoney(sellingPrice)}</p>

                <p className="text-gray-600">Discount ({discountPercent.toFixed(0)}%)</p>
                <p className="text-gray-900 font-semibold sm:text-right">-{formatMoney(discountAmount)}</p>

                <p className="text-gray-600">Price After Discount</p>
                <p className="text-gray-900 font-semibold sm:text-right">{formatMoney(discountedPrice)}</p>

                <p className="text-gray-600">GST ({gstPercentValue.toFixed(2)}%)</p>
                <p className="text-gray-900 font-semibold sm:text-right">{isGstApplied ? formatMoney(gstAmount) : "Not Applied"}</p>
              </div>

              <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 flex items-center justify-between">
                <p className="text-sm font-semibold text-teal-800 uppercase tracking-wide">Final Price</p>
                <p className="text-2xl font-black text-teal-800">{formatMoney(finalUnitPrice)}</p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <p className="text-xs font-bold text-gray-600 uppercase mb-3">Pack Size</p>
                <div className="flex gap-2">
                  <button className="px-4 py-2 border-2 border-teal-600 bg-white text-teal-700 font-bold text-sm rounded-lg">
                    {product.unit || "Standard"}
                  </button>
                </div>
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-700 mb-2">Quantity</p>
                  <div className="flex items-center border-2 border-gray-200 rounded-lg overflow-hidden w-fit">
                    <button
                      onClick={() => setQty(Math.max(minQty, qty - 1))}
                      disabled={qty <= minQty}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <span className="px-6 py-2 font-bold text-gray-800 border-x border-gray-200">{qty}</span>
                    <button
                      onClick={() => setQty(Math.min(maxQty, qty + 1))}
                      disabled={qty >= maxQty}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Total Price</p>
                  <p className="text-2xl font-black text-gray-900">₹{total}</p>
                </div>
              </div>

              {/* CTA Buttons */}
              <div>
                <button
                  onClick={handleAddToCart}
                  disabled={(product.stockQuantity ?? 0) <= 0}
                  className="w-full py-3 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-lg shadow-teal-200"
                >
                  {(product.stockQuantity ?? 0) <= 0 ? "OUT OF STOCK" : "ADD TO CART"}
                  {(product.stockQuantity ?? 0) > 0 && <ChevronRight className="w-5 h-5" />}
                </button>
              </div>

              {/* Delivery Info */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm font-bold text-green-700">Get in 30 minutes</p>
                <p className="text-xs text-green-600">Order within 2 hours 30 mins</p>
              </div>
            </div>

            {/* Product Highlights */}
            {product.description && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="font-bold text-gray-900 mb-4 uppercase text-sm">Product Highlights</h3>
                <p className="text-gray-700 leading-relaxed text-sm">
                  {product.description}
                </p>
                {product.expiryDate && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs font-semibold text-red-600 bg-red-50 px-3 py-2 rounded">
                      <span>Expiry Date:</span> {new Date(product.expiryDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Similar Products Section */}
        {similarProduct.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Similar Products</h2>
            <div
              ref={similarScrollRef}
              className="flex gap-6 overflow-x-auto pb-6 no-scrollbar scroll-smooth"
            >
              {similarProduct.map((item) => (
                <Link
                  key={item._id}
                  href={`/products/${getProductSlug(item)}`}
                  className="w-56 shrink-0 bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow"
                >
                  <div className="w-full h-40 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <p className="text-teal-700 font-bold text-lg mb-2">₹{item.price}</p>
                  <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 mb-3 min-h-[40px]">
                    {item.name}
                  </h3>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      addToCart(item._id, item.minOrderQty || 1);
                    }}
                    className="w-full py-2 bg-teal-50 text-teal-700 border border-teal-200 font-semibold rounded-lg hover:bg-teal-600 hover:text-white transition-colors text-xs uppercase"
                  >
                    Quick Add
                  </button>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}