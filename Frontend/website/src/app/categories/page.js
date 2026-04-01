"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAppContext } from "@/context/context";
import { getCategorySlug } from "@/utils/product";
import { SkeletonCategoryGrid } from "@/components/Skeleton";

export default function CategoriesPage() {
  const { getCategories, getImageUrl } = useAppContext();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getCategories()
      .then((res) => {
        const list = res?.data ?? (Array.isArray(res) ? res : []);
        setCategories(list);
      })
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, [getCategories]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Categories</h1>

      {loading ? (
        <>
          <div className="animate-pulse bg-gray-200 rounded h-8 w-56 mb-6" />
          <SkeletonCategoryGrid count={12} />
        </>
      ) : categories.length === 0 ? (
        <div className="flex justify-center items-center py-20">
          <p className="text-gray-500">No categories found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-6">
          {categories.map((cat, i) => (
            <Link
              key={cat._id || i}
              href={`/categories/${getCategorySlug(cat)}`}
              className="flex flex-col items-center text-center group cursor-pointer"
            >
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-teal-50 to-teal-100 flex items-center justify-center overflow-hidden mb-3 border-2 border-gray-100 group-hover:border-teal-300 group-hover:shadow-lg transition-all">
                <img
                  src={getImageUrl(cat?.image)}
                  alt={cat?.name || "Category"}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = "https://placehold.co/100x100?text=No+Image";
                  }}
                />
              </div>
              <span className="text-xs md:text-sm font-medium text-gray-700 group-hover:text-teal-700 transition-colors line-clamp-2 w-full">
                {cat?.name || "Unnamed"}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
