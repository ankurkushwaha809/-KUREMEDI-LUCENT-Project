'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export default function UserDashboardMenuSection({ title, items }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <header className="border-b border-gray-100 px-4 py-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">{title}</h2>
      </header>

      <div className="divide-y divide-gray-100">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-gray-50"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                <Icon className="h-4.5 w-4.5" />
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900">{item.label}</p>
                {item.description ? (
                  <p className="mt-0.5 truncate text-xs text-gray-500">{item.description}</p>
                ) : null}
              </div>

              <ChevronRight className="h-4.5 w-4.5 text-gray-400" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
