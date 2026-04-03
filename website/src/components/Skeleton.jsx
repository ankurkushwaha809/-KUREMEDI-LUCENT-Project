"use client";

import React from "react";

const baseClass = "animate-pulse bg-gray-200 rounded";

/** Single line placeholder */
export function SkeletonLine({ className = "h-4" }) {
  return <div className={`${baseClass} ${className}`} />;
}

/** Circle (e.g. category avatar) */
export function SkeletonCircle({ size = "w-16 h-16" }) {
  return <div className={`${baseClass} ${size} rounded-full`} />;
}

/** Card: large rounded block (image) + two text lines - like the reference image */
export function SkeletonCard({ imageClass = "h-32 md:h-40", line1Class = "h-4 w-3/4", line2Class = "h-3 w-1/2" }) {
  return (
    <div className="min-w-[160px] md:min-w-[240px] shrink-0 border border-gray-100 rounded-2xl p-3 bg-white">
      <div className={`${baseClass} w-full ${imageClass} rounded-xl mb-4`} />
      <div className="space-y-2">
        <div className={`${baseClass} ${line1Class}`} />
        <div className={`${baseClass} ${line2Class}`} />
      </div>
    </div>
  );
}

/** Banner placeholder */
export function SkeletonBanner({ className = "h-40 md:h-64" }) {
  return <div className={`${baseClass} w-full ${className} rounded-2xl`} />;
}

/** Section title + optional "View all" line */
export function SkeletonSectionTitle() {
  return (
    <div className="flex justify-between items-center mb-6">
      <div className={`${baseClass} h-6 w-28`} />
      <div className={`${baseClass} h-8 w-20 rounded-full`} />
    </div>
  );
}

/** Row of product skeleton cards (for carousel) */
export function SkeletonProductRow({ count = 5 }) {
  return (
    <div className="flex gap-4 overflow-hidden pb-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

/** Row of category circles */
export function SkeletonCategoryRow({ count = 8 }) {
  return (
    <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col items-center text-center">
          <SkeletonCircle size="w-16 h-16 md:w-20 md:h-20" />
          <div className={`${baseClass} h-3 w-12 mt-2`} />
        </div>
      ))}
    </div>
  );
}

/** Category grid for "all categories" page (3/6/8 cols) */
export function SkeletonCategoryGrid({ count = 12 }) {
  return (
    <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col items-center text-center">
          <SkeletonCircle size="w-20 h-20 md:w-24 md:h-24" />
          <div className={`${baseClass} h-3 w-14 mt-3`} />
        </div>
      ))}
    </div>
  );
}

/** Product grid (2/4/5 cols) for brand/category detail pages */
export function SkeletonProductGrid({ count = 10 }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="border border-gray-100 rounded-2xl p-4 bg-white">
          <div className={`${baseClass} w-full h-24 rounded-xl mb-3`} />
          <div className={`${baseClass} h-4 w-16 mb-2`} />
          <div className={`${baseClass} h-3 w-full mb-1`} />
          <div className={`${baseClass} h-3 w-3/4 mb-3`} />
          <div className={`${baseClass} h-9 w-full rounded-lg`} />
        </div>
      ))}
    </div>
  );
}

/** Row of brand cards (logo box + line) */
export function SkeletonBrandRow({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col items-center p-4 border border-gray-100 rounded-xl">
          <div className={`${baseClass} h-12 w-full rounded mb-2`} />
          <div className={`${baseClass} h-3 w-16`} />
        </div>
      ))}
    </div>
  );
}

export default { SkeletonLine, SkeletonCircle, SkeletonCard, SkeletonBanner, SkeletonSectionTitle, SkeletonProductRow, SkeletonCategoryRow, SkeletonBrandRow };
