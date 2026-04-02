'use client';

import React from 'react';

export default function UserDashboardStatCard({ icon: Icon, label, value, hint, tone = 'teal' }) {
  const toneMap = {
    teal: {
      bg: 'from-teal-50 to-cyan-50',
      border: 'border-teal-300',
      text: 'text-teal-900',
      iconBg: 'bg-teal-100 text-teal-700',
      labelColor: 'text-teal-700',
      valueBg: 'bg-linear-to-r from-teal-600 to-cyan-500 text-white',
    },
    amber: {
      bg: 'from-amber-50 to-orange-50',
      border: 'border-amber-300',
      text: 'text-amber-900',
      iconBg: 'bg-amber-100 text-amber-700',
      labelColor: 'text-amber-700',
      valueBg: 'bg-linear-to-r from-amber-600 to-orange-500 text-white',
    },
    violet: {
      bg: 'from-indigo-50 to-sky-50',
      border: 'border-indigo-300',
      text: 'text-indigo-900',
      iconBg: 'bg-indigo-100 text-indigo-700',
      labelColor: 'text-indigo-700',
      valueBg: 'bg-linear-to-r from-indigo-600 to-sky-500 text-white',
    },
  };

  const selectedTone = toneMap[tone] || toneMap.teal;

  return (
    <article 
      className={`group relative overflow-hidden rounded-2xl border-2 ${selectedTone.border} bg-linear-to-br ${selectedTone.bg} p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105`}
    >
      {/* Animated Background Blur */}
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/40 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/30 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-3 mb-4">
          <p className={`text-xs font-bold uppercase tracking-widest ${selectedTone.labelColor}`}>{label}</p>
          {Icon ? (
            <span className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${selectedTone.iconBg} shadow-md`}>
              <Icon className="h-6 w-6" />
            </span>
          ) : null}
        </div>

        <div className={`rounded-xl ${selectedTone.valueBg} px-4 py-3 inline-block shadow-md`}>
          <p className="text-3xl font-black">{value}</p>
        </div>

        {hint ? (
          <p className={`mt-3 text-xs font-medium ${selectedTone.labelColor} opacity-80`}>
            {hint}
          </p>
        ) : null}
      </div>
    </article>
  );
}
