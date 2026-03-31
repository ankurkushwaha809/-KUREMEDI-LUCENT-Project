'use client';

import Link from 'next/link';
import { Shield, ChevronRight } from 'lucide-react';

const KYC_STATUS_LABELS = {
  APPROVED: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: 'text-emerald-600' },
  PENDING: { bg: 'bg-teal-50', text: 'text-teal-700', icon: 'text-teal-700' },
  REJECTED: { bg: 'bg-red-50', text: 'text-red-700', icon: 'text-red-600' },
  BLANK: { bg: 'bg-amber-100', text: 'text-amber-700', icon: 'text-amber-600' },
};

export function KycBanner({ kyc }) {
  if (!kyc || kyc === 'APPROVED') return null;

  const isPending = kyc === 'PENDING';
  const isBlank = kyc === 'BLANK';
  const isRejected = kyc === 'REJECTED';

  const colors = isBlank ? KYC_STATUS_LABELS.BLANK : isPending ? KYC_STATUS_LABELS.PENDING : KYC_STATUS_LABELS.REJECTED;

  return (
    <Link
      href="/kyc"
      className={`mx-4 mt-3 flex items-center gap-3 rounded-xl p-3 ${colors.bg} hover:opacity-90 transition-opacity`}
    >
      <div className={`w-10 h-10 rounded-full bg-white/80 flex items-center justify-center shrink-0 ${colors.icon}`}>
        <Shield className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900">
          {isBlank && 'Complete KYC to order'}
          {isPending && 'KYC under review'}
          {isRejected && 'KYC verification failed'}
        </p>
        <p className="text-sm text-gray-600 mt-0.5">
          {isBlank && 'Submit your documents to add to cart and place orders.'}
          {isPending && 'We are verifying your documents. You can track status in profile.'}
          {isRejected && 'Please resubmit your documents for verification.'}
        </p>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-500 shrink-0" />
    </Link>
  );
}
