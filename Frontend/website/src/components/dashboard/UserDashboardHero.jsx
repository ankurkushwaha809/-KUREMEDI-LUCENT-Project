'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Sparkles } from 'lucide-react';

const KYC_LOOKUP = {
  APPROVED: {
    tone: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    label: 'Approved',
  },
  PENDING: {
    tone: 'bg-amber-100 text-amber-800 border-amber-200',
    label: 'Pending Review',
  },
  REJECTED: {
    tone: 'bg-red-100 text-red-800 border-red-200',
    label: 'Rejected',
  },
  BLANK: {
    tone: 'bg-gray-100 text-gray-700 border-gray-200',
    label: 'Not Submitted',
  },
};

export default function UserDashboardHero({ user }) {
  const name = user?.name || 'Retail Partner';
  const phone = user?.phone ? `+91 ${user.phone}` : 'Phone not available';
  const email = user?.email || 'Email not available';
  const status = user?.kyc || 'BLANK';
  const statusUi = KYC_LOOKUP[status] || KYC_LOOKUP.BLANK;

  return (
    <section className="group relative overflow-hidden rounded-3xl border-2 border-teal-300 bg-linear-to-br from-teal-700 via-cyan-700 to-sky-700 p-6 text-white shadow-xl sm:p-8 hover:shadow-2xl transition-all duration-300">
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15 blur-3xl opacity-75 group-hover:opacity-100 transition-opacity" />
      <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-cyan-200/25 blur-3xl opacity-75 group-hover:opacity-100 transition-opacity" />

      <div className="relative z-10 flex flex-col gap-5">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/50 bg-white/15 text-white transition-all hover:bg-white/30 hover:border-white hover:scale-110"
            aria-label="Back to home"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>

          <span className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/20 px-4 py-2 text-xs font-bold uppercase tracking-widest backdrop-blur-sm">
            <Sparkles className="h-4 w-4" />
            User Dashboard
          </span>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm text-cyan-200 font-semibold">Welcome back</p>
            <h1 className="mt-2 text-4xl font-black leading-tight sm:text-5xl drop-shadow-lg">{name}</h1>
            <p className="mt-3 text-sm text-cyan-100 font-medium">{phone}</p>
            <p className="text-sm text-cyan-100 font-medium">{email}</p>
          </div>

          <div className="rounded-2xl border-2 border-white/35 bg-white/15 p-5 backdrop-blur-sm shadow-lg">
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-100">KYC Status</p>
            <span
              className={`mt-3 inline-flex items-center gap-2 rounded-full border-2 px-4 py-2 text-xs font-bold ${statusUi.tone}`}
            >
              <ShieldCheck className="h-4 w-4" />
              {statusUi.label}
            </span>
            {user?.referralCode ? (
              <div className="mt-4 pt-4 border-t border-white/20">
                <p className="text-xs text-cyan-100 font-semibold opacity-90">Referral Code</p>
                <p className="mt-1 text-sm font-bold text-white">{user.referralCode}</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
