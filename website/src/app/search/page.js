"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, X, Search, ChevronRight } from "lucide-react";
import { useAppContext } from "@/context/context";
import { normalizeProducts, getProductSlug } from "@/utils/product";

/** Derive short suggestion text from product name (e.g. "Dolo 650mg Strip..." -> "Dolo 650") */
function getSuggestionFromName(name) {
  if (!name || typeof name !== "string") return "";
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 2) return name.trim();
  return parts.slice(0, 2).join(" ");
}

/** Get pack/packing subtitle for product card */
function getPackSubtitle(p) {
  const packing = p?.packing || p?.packSize || "";
  const unit = p?.unit || "";
  if (packing) return packing;
  if (unit && unit !== "1 unit") return unit;
  return "";
}

// Wrap useSearchParams usage in Suspense so Next.js prerender/export is happy
export default function SearchPage() {
  return (
    <Suspense fallback={<div className="px-4 py-6 text-center text-gray-500">Loading search...</div>}>
      <SearchPageInner />
    </Suspense>
  );
}

function SearchPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQ = searchParams.get("q") || "";
  const { getProducts } = useAppContext();

  const [query, setQuery] = useState(initialQ);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchProducts = useCallback(
    async (q) => {
      if (!q || !q.trim()) {
        setProducts([]);
        return;
      }
      setLoading(true);
      try {
        const res = await getProducts({ search: q.trim() });
        const list = Array.isArray(res) ? res : res?.data ?? [];
        setProducts(normalizeProducts(list));
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    },
    [getProducts]
  );

  useEffect(() => {
    setQuery(initialQ);
    if (initialQ.trim()) searchProducts(initialQ);
    else setProducts([]);
  }, [initialQ, searchProducts]);

  useEffect(() => {
    if (query === initialQ) return;
    const t = setTimeout(() => {
      if (query.trim()) {
        router.replace(`/search?q=${encodeURIComponent(query)}`, { scroll: false });
        searchProducts(query);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [query, initialQ, router, searchProducts]);

  const handleSuggestionClick = (s) => {
    setQuery(s);
    router.replace(`/search?q=${encodeURIComponent(s)}`, { scroll: false });
    searchProducts(s);
  };

  const suggestions = React.useMemo(() => {
    const seen = new Set();
    const arr = [];
    for (const p of products) {
      const s = getSuggestionFromName(p.name);
      if (s && !seen.has(s.toLowerCase())) {
        seen.add(s.toLowerCase());
        arr.push(s);
        if (arr.length >= 5) break;
      }
    }
    return arr;
  }, [products]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Search bar */}
        <div className="flex items-center gap-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <button
            onClick={() => router.back()}
            className="p-3 text-gray-600 hover:text-teal-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 flex items-center">
            <Search className="w-5 h-5 text-gray-400 mr-2 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search medicines, health products..."
              className="flex-1 py-3 text-base outline-none"
              autoFocus
            />
          </div>
          {query && (
            <button
              onClick={() => {
                setQuery("");
                router.replace("/search", { scroll: false });
              }}
              className="p-3 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {loading ? (
          <p className="text-gray-500 text-center py-8">Searching...</p>
        ) : !query.trim() ? (
          <p className="text-gray-500 text-center py-8">
            Type to search for medicines and health products
          </p>
        ) : (
          <>
            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div>
                <p className="text-gray-500 text-sm mb-3">
                  Showing suggestions for <span className="font-medium text-gray-700">{query}</span>
                </p>
                <ul className="space-y-1">
                  {suggestions.map((s, i) => (
                    <li key={i}>
                      <button
                        onClick={() => handleSuggestionClick(s)}
                        className="w-full flex items-center justify-between py-3 px-4 bg-white rounded-xl border border-gray-100 hover:border-teal-200 hover:bg-teal-50/50 transition-colors text-left"
                      >
                        <span className="font-medium text-gray-900">{s}</span>
                        <Search className="w-4 h-4 text-gray-400" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Product results */}
            <div className="space-y-2">
              {products.map((p) => (
                <Link
                  key={p._id}
                  href={`/products/${getProductSlug(p)}`}
                  className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 hover:border-teal-200 hover:shadow-md transition-all"
                >
                  <div className="w-14 h-14 rounded-xl bg-gray-100 shrink-0 flex items-center justify-center overflow-hidden">
                    <img
                      src={p.image || "https://placehold.co/56?text=No+Image"}
                      alt={p.name}
                      className="w-12 h-12 object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate capitalize">
                      {p.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {getPackSubtitle(p) || p.unit || "—"}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
                </Link>
              ))}
            </div>

            {products.length === 0 && (
              <p className="text-gray-500 text-center py-8">
                No products found for &quot;{query}&quot;
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
