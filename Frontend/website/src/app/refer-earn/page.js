'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Gift, Copy, Share2, Check } from 'lucide-react';
import { useAppContext } from '@/context/context';

export default function ReferEarnPage() {
  const { user, token } = useAppContext();
  const [copied, setCopied] = useState(false);

  if (!token || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Please login to view Refer & Earn</p>
          <Link href="/login" className="inline-block bg-teal-700 text-white px-6 py-3 rounded-xl font-semibold hover:bg-teal-800">
            Login
          </Link>
        </div>
      </div>
    );
  }

  const referralCode = user.referralCode || '—';

  const handleCopy = async () => {
    if (referralCode && referralCode !== '—') {
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (referralCode && referralCode !== '—' && navigator.share) {
      try {
        await navigator.share({
          title: 'Referral Code',
          text: `Use my referral code ${referralCode} on LucentMR to get rewards!`,
        });
      } catch (e) {
        if (e.name !== 'AbortError') {
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          <Link href="/profile" className="p-1 -ml-1 text-gray-700 hover:text-gray-900">
            <ArrowLeft className="w-7 h-7" />
          </Link>
          <h1 className="text-lg font-semibold text-gray-900">Refer & Earn</h1>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-8">
        <div className="bg-teal-50 rounded-2xl p-6 border border-teal-200 mb-6">
          <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-4">
            <Gift className="w-8 h-8 text-teal-700" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 text-center mb-2">Invite Friends, Earn Rewards</h2>
          <p className="text-gray-600 text-center text-sm">
            Share your referral code with friends. When they sign up and place an order, you both earn rewards!
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-200 mb-6">
          <label className="block text-sm font-medium text-gray-600 mb-2">Your Referral Code</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex-1 flex items-center justify-between bg-gray-100 rounded-xl px-4 py-4 hover:bg-gray-200 transition-colors"
            >
              <span className="text-lg font-bold text-teal-700 tracking-widest">{referralCode}</span>
              <span className="flex items-center gap-2 text-teal-700 font-semibold text-sm">
                {copied ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
                {copied ? 'Copied' : 'Copy'}
              </span>
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="flex items-center gap-2 bg-teal-100 rounded-xl px-4 py-4 hover:bg-teal-200 transition-colors"
            >
              <Share2 className="w-5 h-5 text-teal-700" />
              <span className="text-teal-700 font-semibold text-sm">Share</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-200">
          <h3 className="text-base font-semibold text-gray-900 mb-4">How it works</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                <span className="text-teal-700 font-bold">1</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Share your code</p>
                <p className="text-gray-500 text-sm">Send your referral code to friends and family</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                <span className="text-teal-700 font-bold">2</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">They sign up</p>
                <p className="text-gray-500 text-sm">Friends use your code when registering</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                <span className="text-teal-700 font-bold">3</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">You both earn</p>
                <p className="text-gray-500 text-sm">Get rewards when they place their first order</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
