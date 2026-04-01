'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { useAppContext } from '@/context/context';

export default function GlobalKycPendingBanner() {
  const { token, user, refreshUser } = useAppContext();

  useEffect(() => {
    if (!token) return;
    refreshUser();
  }, [token, refreshUser]);

  useEffect(() => {
    if (!token || user?.kyc !== 'PENDING') return;

    const interval = setInterval(() => {
      refreshUser();
    }, 30000);

    return () => clearInterval(interval);
  }, [token, user?.kyc, refreshUser]);

  if (!token || user?.kyc !== 'PENDING') return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200">
      <div className="container mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-amber-800 min-w-0">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <p className="text-sm font-medium truncate">
            KYC submitted. Please wait for admin approval.
          </p>
        </div>
        <Link
          href="/kyc"
          className="text-xs font-semibold text-amber-900 underline underline-offset-2 whitespace-nowrap"
        >
          View status
        </Link>
      </div>
    </div>
  );
}
