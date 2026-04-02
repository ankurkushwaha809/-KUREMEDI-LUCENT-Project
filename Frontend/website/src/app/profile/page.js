'use client';

import React, { useCallback, useEffect } from 'react';
import Link from 'next/link';
import {
  User,
  Gift,
  Wallet,
  ShieldCheck,
  Receipt,
  LogOut,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Contact,
  HelpCircle,
  FileText,
} from 'lucide-react';
import { useAppContext } from '@/context/context';
import { KycBanner } from '@/components/KycBanner';

const KYC_STATUS_LABELS = {
  APPROVED: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  PENDING: { bg: 'bg-amber-100', text: 'text-amber-700' },
  REJECTED: { bg: 'bg-red-100', text: 'text-red-700' },
  BLANK: { bg: 'bg-gray-100', text: 'text-gray-600' },
};

export default function ProfilePage() {
  const { user, token, logout, refreshUser } = useAppContext();

  const loadProfile = useCallback(() => {
    if (token) refreshUser();
  }, [token, refreshUser]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  if (!token || !user) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 pt-8 pb-12">
         <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile
          
         </h1>
        <div className="bg-white rounded-2xl p-8 text-center border border-gray-200 shadow-sm">
          <div className="w-24 h-24 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-4">
            <User className="w-14 h-14 text-teal-700" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Welcome to Kuremedi</h2>
          <p className="text-sm text-gray-500 mb-6">
            Login to access your profile, orders, and KYC verification
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-teal-700 text-white px-6 py-3.5 rounded-xl font-semibold hover:bg-teal-800 transition-colors"
          >
            Login with Mobile & OTP
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    );
  }

  const kycStatus = user.kyc || 'BLANK';
  const kycColors = KYC_STATUS_LABELS[kycStatus] || KYC_STATUS_LABELS.BLANK;
  const displayName = user.name || 'User';
  const displayPhone = user.phone ? `+91 ${user.phone}` : '';

  return (
    <div className="min-h-screen bg-gray-50 px-4 pt-8 pb-12">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/"
          className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-gray-200 bg-white text-gray-700 hover:text-teal-700 hover:border-teal-300 shadow-sm transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
      </div>

      <KycBanner kyc={user.kyc} />

      {/* Profile Card */}
      <div className="bg-white rounded-2xl p-6 mb-4 border border-gray-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-teal-700 flex items-center justify-center shrink-0">
            <span className="text-white text-3xl font-bold">{displayName.charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900">{displayName}</h2>
            <p className="text-sm text-gray-500">{displayPhone}</p>
            {user.email && <p className="text-sm text-gray-500">{user.email}</p>}
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">KYC Status</span>
            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${kycColors.bg} ${kycColors.text}`}>
              {kycStatus}
            </span>
          </div>
          {user.referralCode && (
            <p className="text-xs text-gray-500 mt-2">Referral Code: {user.referralCode}</p>
          )}
        </div>
      </div>

      {/* Menu */}
      <div className="bg-white rounded-2xl overflow-hidden mb-4 border border-gray-200 shadow-sm">
        <Link
          href="/profile-edit"
          className="flex items-center gap-3 p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
        >
          <User className="w-5 h-5 text-gray-500" />
          <span className="flex-1 font-medium text-gray-900">Profile Update</span>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </Link>
        <Link
          href="/refer-earn"
          className="flex items-center gap-3 p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
        >
          <Gift className="w-5 h-5 text-gray-500" />
          <span className="flex-1 font-medium text-gray-900">Refer & Earn</span>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </Link>
        <Link
          href="/wallet"
          className="flex items-center gap-3 p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
        >
          <Wallet className="w-5 h-5 text-gray-500" />
          <span className="flex-1 font-medium text-gray-900">Wallet</span>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </Link>
        <Link
          href="/kyc"
          className="flex items-center gap-3 p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
        >
          <ShieldCheck className="w-5 h-5 text-gray-500" />
          <span className="flex-1 font-medium text-gray-900">KYC Verification</span>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </Link>
        <Link
          href="/orders"
          className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors"
        >
          <Receipt className="w-5 h-5 text-gray-500" />
          <span className="flex-1 font-medium text-gray-900">My Orders</span>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </Link>

        <Link
          href="/support"
          className="flex items-center gap-3 p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
        >
          <Contact className="w-5 h-5 text-gray-500" />
          <span className="flex-1 font-medium text-gray-900">Support</span>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </Link>
        <Link
          href="/faq"
          className="flex items-center gap-3 p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
        >
          <HelpCircle className="w-5 h-5 text-gray-500" />
          <span className="flex-1 font-medium text-gray-900">FAQ</span>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </Link>
        <Link
          href="/privacy-policy"
          className="flex items-center gap-3 p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
        >
          <ShieldCheck className="w-5 h-5 text-gray-500" />
          <span className="flex-1 font-medium text-gray-900">Privacy Policy</span>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </Link>
        <Link
          href="/terms-and-conditions"
          className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors"
        >
          <FileText className="w-5 h-5 text-gray-500" />
          <span className="flex-1 font-medium text-gray-900">Terms & Conditions</span>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </Link>
      </div>

      {/* Logout */}
      <button
        onClick={logout}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-xl border border-red-200 bg-red-50 text-red-600 font-semibold hover:bg-red-100 transition-colors"
      >
        <LogOut className="w-5 h-5" />
        Logout
      </button>
    </div>
  );
}
