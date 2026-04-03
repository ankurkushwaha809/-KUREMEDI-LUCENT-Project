"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Heart,
  ChevronRight,
  ChevronLeft,
  Plus,
  Minus,
  Search
} from "lucide-react";
import { useAppContext } from "@/context/context";
import { KycBanner } from "@/components/KycBanner";
import { getProductSlug, getCategorySlug, getBrandSlug } from "@/utils/product";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { showToast } from "@/utils/toast";
import Image from "next/image";

import {
  SkeletonBanner,
  SkeletonSectionTitle,
  SkeletonCategoryRow,
  SkeletonBrandRow,
  SkeletonProductRow,
} from "@/components/Skeleton";

const BANNERS = ["/banner.jpeg", "/banner.jpeg", "/banner.jpeg"];

const HomePage = () => {
  const router = useRouter();
  const {
    getCategories,
    getImageUrl,
    getBrands,
    getBrandImageUrl,
    getProducts,
    getProductImageUrl,
    addToCart,
    updateCartQty,
    cartItems,
    toggleWishlist,
    isInWishlist,
    token,
    user,
  } = useAppContext();

  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [products, setProducts] = useState([]);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const bestSelling = useMemo(() => {
    return [...(products || [])].sort((a, b) => {
      const dA = a.discountPercent ?? 0;
      const dB = b.discountPercent ?? 0;
      if (dB !== dA) return dB - dA;
      return (b.sellingPrice ?? b.price ?? 0) - (a.sellingPrice ?? a.price ?? 0);
    });
  }, [products]);

  const newArrivals = useMemo(() => {
    return [...(products || [])].sort((a, b) => {
      const tA = new Date(a.createdAt ?? 0).getTime();
      const tB = new Date(b.createdAt ?? 0).getTime();
      return tB - tA;
    });
  }, [products]);

  const healthEssentials = useMemo(() => {
    return [...(products || [])].sort((a, b) => {
      const stockA = a.stockQuantity ?? 0;
      const stockB = b.stockQuantity ?? 0;
      if (stockA !== stockB) return stockB - stockA;
      return ((a.productName || a.name) ?? "").localeCompare((b.productName || b.name) ?? "");
    });
  }, [products]);

  // Auto-slide Hero Banner
  useEffect(() => {
    const t = setInterval(() => {
      setBannerIndex((i) => (i + 1) % BANNERS.length);
    }, 4000);
    return () => clearInterval(t);
  }, []);

  // Fetch Data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [catRes, brandRes, prodRes] = await Promise.all([
          getCategories(),
          getBrands(),
          getProducts(),
        ]);
        if (catRes?.success && Array.isArray(catRes.data)) setCategories(catRes.data);
        if (brandRes?.success && Array.isArray(brandRes.data)) setBrands(brandRes.data);
        if (prodRes?.success && Array.isArray(prodRes.data)) {
          setProducts(prodRes.data);
        } else if (Array.isArray(prodRes)) {
          setProducts(prodRes);
        }
      } catch (err) {
        console.error("Data load error", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [getCategories, getBrands, getProducts]);

  if (loading) {
    return (
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10 bg-white min-h-screen">
        <section className="text-center py-2">
          <div className="flex justify-center">
            <h1 className="text-2xl md:text-3xl font-bold text-teal-800 tracking-tight">Scaleten</h1>
          </div>
          <p className="text-sm text-gray-600 mt-1">Pharmaceutical Excellence — Your trusted partner</p>
        </section>
        <SkeletonBanner />
        <section><SkeletonSectionTitle /><SkeletonCategoryRow count={8} /></section>
        <section><SkeletonSectionTitle /><SkeletonBrandRow count={4} /></section>
        <section className="pb-8"><SkeletonSectionTitle /><SkeletonProductRow count={5} /></section>
      </div>
    );
  }

  return (
    <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10 bg-white min-h-screen">


      {/* 2. HERO BANNER */}
      <section className="relative w-full h-44 md:h-80 rounded-2xl overflow-hidden shadow-sm">
        {BANNERS.map((src, i) => (
          <img
            key={i}
            src={src}
            alt={`Banner ${i + 1}`}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${bannerIndex === i ? "opacity-100 z-10" : "opacity-0 z-0"
              }`}
          />
        ))}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-20">
          {BANNERS.map((_, i) => (
            <button
              key={i}
              onClick={() => setBannerIndex(i)}
              className={`h-1.5 rounded-full transition-all ${bannerIndex === i ? "w-8 bg-white" : "w-2 bg-white/50"
                }`}
            />
          ))}
        </div>
      </section>

      <KycBanner kyc={user?.kyc} />

      {/* 3. CATEGORIES */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Categories</h2>
          <Link href="/categories" className="text-teal-700 bg-teal-50 px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1 hover:bg-teal-100 transition-all">
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
          {categories.map((cat) => (
            <Link key={cat._id} href={`/categories/${getCategorySlug(cat)}`} className="group text-center">
              <div className="w-16 h-16 md:w-20 md:h-20 mx-auto rounded-full bg-gray-50 flex items-center justify-center overflow-hidden mb-2 border border-gray-100 group-hover:shadow-md group-hover:border-teal-100 transition-all">
                <img src={getImageUrl(cat?.image)} alt={cat?.name} className="w-full h-full object-cover" />
              </div>
              <span className="text-[10px] md:text-xs font-medium text-gray-600 truncate block px-1">
                {cat?.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. BRANDS */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Top Brands</h2>
          <Link href="/brands" className="text-teal-700 bg-teal-50 px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1 hover:bg-teal-100 transition-all">
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {brands.map((brand) => (
            <Link key={brand._id} href={`/brands/${getBrandSlug(brand)}`} className="flex flex-col items-center p-4 border border-gray-100 rounded-2xl hover:border-teal-200 hover:shadow-sm transition-all">
              <div className="h-10 w-full flex items-center justify-center mb-2">
                <img src={getBrandImageUrl(brand?.logo)} alt={brand?.name} className="max-h-full max-w-full object-contain" />
              </div>
              <span className="text-xs text-gray-500 font-medium">{brand.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* 5. PRODUCT CAROUSELS */}
      {!products?.length ? (
        <section className="py-10 flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
          </div>
          <p className="mt-4 text-base font-semibold text-gray-500">No products found</p>
        </section>
      ) : (
        <>
          <ProductCarousel
            title="Best selling medicine"
            products={bestSelling}
            getProductImageUrl={getProductImageUrl}
            addToCart={addToCart}
            updateCartQty={updateCartQty}
            cartItems={cartItems}
            toggleWishlist={toggleWishlist}
            isInWishlist={isInWishlist}
            token={token}
            user={user}
          />
          <ProductCarousel
            title="New added medicine"
            products={newArrivals}
            getProductImageUrl={getProductImageUrl}
            addToCart={addToCart}
            updateCartQty={updateCartQty}
            cartItems={cartItems}
            toggleWishlist={toggleWishlist}
            isInWishlist={isInWishlist}
            token={token}
            user={user}
          />
          <ProductCarousel
            title="Health essentials"
            products={healthEssentials}
            getProductImageUrl={getProductImageUrl}
            addToCart={addToCart}
            updateCartQty={updateCartQty}
            cartItems={cartItems}
            toggleWishlist={toggleWishlist}
            isInWishlist={isInWishlist}
            token={token}
            user={user}
          />
        </>
      )}
    </div>
  );
};

// --- REUSABLE PRODUCT CAROUSEL WITH ARROWS ---
const ProductCarousel = ({
  title,
  products,
  getProductImageUrl,
  addToCart,
  updateCartQty,
  cartItems,
  toggleWishlist,
  isInWishlist,
  token,
  user,
}) => {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const moveBy = clientWidth * 0.75;
      scrollRef.current.scrollTo({
        left: direction === "left" ? scrollLeft - moveBy : scrollLeft + moveBy,
        behavior: "smooth",
      });
    }
  };

  const handleAdd = async (product) => {
    if (!token) return (window.location.href = "/login");
    if (user?.kyc !== "APPROVED") {
      return showToast("Complete KYC to add to cart.", "info", "KYC Required");
    }
    try {
      await addToCart(product._id, product.minOrderQty || 1);
      showToast("Added to cart");
    } catch {
      showToast("Could not add to cart.", "error");
    }
  };

  return (
    <section className="relative group pb-8">
      <div className="flex justify-between items-center mb-6 px-1">
        <h2 className="text-xl font-bold text-gray-800">{title}</h2>
      </div>

      {/* Navigation Arrows (Pharma Style: Clean, Blurry White) */}
      <div className="absolute top-[40%] -translate-y-1/2 left-0 right-0 flex justify-between px-2 z-30 pointer-events-none">
        <button
          onClick={() => scroll("left")}
          className="p-2.5 rounded-full bg-white/90 backdrop-blur-md shadow-lg border border-gray-200 text-teal-700 pointer-events-auto opacity-0 group-hover:opacity-100 transition-all hover:bg-teal-600 hover:text-white"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => scroll("right")}
          className="p-2.5 rounded-full bg-white/90 backdrop-blur-md shadow-lg border border-gray-200 text-teal-700 pointer-events-auto opacity-0 group-hover:opacity-100 transition-all hover:bg-teal-600 hover:text-white"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4 no-scrollbar scroll-smooth"
      >
        {products.map((product) => {
          const wished = isInWishlist?.(product._id);
          const cartItem = cartItems.find((item) => item._id === product._id);
          const img = product?.productImages?.[0] || product?.image;
          const outOfStock = (product.stockQuantity ?? 1) <= 0;

          return (
            <div
              key={product._id}
              className="min-w-[180px] md:min-w-[240px] shrink-0 border border-gray-100 rounded-2xl p-4 relative hover:shadow-xl hover:border-teal-100 transition-all bg-white"
            >
              {/* Wishlist */}
              <button
                onClick={() =>
                  toggleWishlist?.({
                    _id: product._id,
                    name: product.productName,
                    price: product.sellingPrice,
                    image: getProductImageUrl(img),
                    unit: product.packSize || "1 unit",
                  })
                }
                className={`absolute top-3 right-3 p-1.5 rounded-full z-10 transition-colors ${wished ? "bg-red-50 text-red-500" : "bg-gray-50 text-gray-400 hover:text-red-500"
                  }`}
              >
                <Heart className={`w-4 h-4 ${wished ? "fill-current" : ""}`} />
              </button>

              {/* Product Image */}
              <Link href={`/products/${getProductSlug(product)}`}>
                <div className="h-32 md:h-40 w-full flex items-center justify-center mb-4">
                  <img
                    src={getProductImageUrl(img) || "https://placehold.co/200x150?text=No+Image"}
                    alt={product.productName}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              </Link>

              {/* Info */}
              <div className="space-y-1">
                <div className="flex items-baseline justify-between">
                  <span className="text-teal-700 font-bold text-lg">₹{product.sellingPrice}</span>
                  <span className="text-[10px] text-gray-400 font-medium">{product.packSize}</span>
                </div>
                <h3 className="text-sm font-semibold text-gray-700 capitalize line-clamp-2 min-h-[40px]">
                  {product.productName}
                </h3>
              </div>

              {/* Action Area */}
              <div className="mt-4">
                {cartItem ? (
                  <div className="flex items-center justify-between bg-teal-50 rounded-xl border border-teal-200 p-1">
                    <button
                      onClick={() => updateCartQty(product._id, cartItem.qty - (product.minOrderQty || 1))}
                      className="p-1.5 text-teal-700 hover:bg-white rounded-lg transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-bold text-teal-800 text-sm">{cartItem.qty}</span>
                    <button
                      onClick={() => updateCartQty(product._id, cartItem.qty + 1)}
                      disabled={cartItem.qty >= product.stockQuantity}
                      className="p-1.5 text-teal-700 hover:bg-white rounded-lg transition-colors disabled:opacity-30"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleAdd(product)}
                    disabled={outOfStock}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs tracking-widest uppercase transition-all ${outOfStock
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-700 hover:text-white"
                      }`}
                  >
                    {outOfStock ? "Out of Stock" : "Add to Cart"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default HomePage;