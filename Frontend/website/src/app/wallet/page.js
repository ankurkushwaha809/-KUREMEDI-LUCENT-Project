'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { ArrowLeft, Wallet, CheckCircle } from 'lucide-react';
import { useAppContext } from '@/context/context';
import * as api from '@/api';
import { showToast } from '@/utils/toast';

const PRESET_AMOUNTS = [100, 250, 500, 1000, 2500, 5000];

export default function WalletPage() {
  const { token } = useAppContext();
  const [balance, setBalance] = useState(null);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [recharging, setRecharging] = useState(false);
  const [receiptPopup, setReceiptPopup] = useState(null);

  const fetchBalance = () => {
    api
      .getWallet()
      .then((w) => setBalance(w?.balance ?? 0))
      .catch(() => setBalance(0));
  };

  useEffect(() => {
    if (!token) return;
    fetchBalance();
  }, [token]);

  const handleRecharge = async () => {
    const amt = Math.round(Number(rechargeAmount) || 0);
    if (amt < 1) {
      showToast('Please enter a valid amount (min ₹1)', 'error');
      return;
    }
    if (amt > 100000) {
      showToast('Maximum recharge is ₹1,00,000', 'error');
      return;
    }

    setRecharging(true);
    try {
      const res = await api.createWalletRechargeOrder(amt);
      if (!res?.razorpayOrderId || !res?.keyId) {
        showToast('Payment gateway not configured. Contact support.', 'error');
        setRecharging(false);
        return;
      }

      const options = {
        key: res.keyId,
        amount: res.amount * 100,
        currency: 'INR',
        order_id: res.razorpayOrderId,
        name: 'LucentMR',
        description: 'Wallet recharge',
        handler: async (response) => {
          try {
            const verifyRes = await api.verifyWalletRecharge({
              razorpayOrderId: res.razorpayOrderId,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            fetchBalance();
            setRechargeAmount('');
            setReceiptPopup({
              amount: verifyRes?.amount ?? 0,
              newBalance: verifyRes?.newBalance ?? 0,
              receipt: (verifyRes?.receipt ?? response.razorpay_payment_id ?? '').slice(0, 40),
            });
          } catch {
            showToast('Failed to verify recharge', 'error');
          } finally {
            setRecharging(false);
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', () => {
        setRecharging(false);
      });
      rzp.open();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to create recharge';
      showToast(msg, 'error');
      setRecharging(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Please login to view Wallet</p>
          <Link href="/login" className="inline-block bg-teal-700 text-white px-6 py-3 rounded-xl font-semibold hover:bg-teal-800">
            Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <div className="min-h-screen bg-gray-50">
        <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
          <div className="container mx-auto px-4 py-3 flex items-center gap-4">
            <Link href="/profile" className="p-1 -ml-1 text-gray-700 hover:text-gray-900">
              <ArrowLeft className="w-7 h-7" />
            </Link>
            <h1 className="text-lg font-semibold text-gray-900">Wallet</h1>
          </div>
        </div>

        <div className="max-w-xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <div className="w-24 h-24 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-12 h-12 text-teal-700" />
            </div>
            {balance === null ? (
              <div className="h-8 w-32 bg-gray-200 rounded animate-pulse mx-auto" />
            ) : (
              <p className="text-2xl font-bold text-gray-900">₹{balance.toFixed(2)}</p>
            )}
            <p className="text-gray-500 text-sm mt-1">Available balance</p>
          </div>

          <div className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-3">Recharge Wallet</h3>
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <label className="block text-gray-600 text-sm mb-2">Enter amount (₹)</label>
              <input
                type="number"
                value={rechargeAmount}
                onChange={(e) => setRechargeAmount(e.target.value)}
                placeholder="e.g. 500"
                className="w-full bg-gray-100 rounded-lg px-4 py-3 text-lg font-medium mb-3 outline-none focus:ring-2 focus:ring-teal-700"
              />
              <div className="flex flex-wrap gap-2 mb-4">
                {PRESET_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setRechargeAmount(String(amt))}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      rechargeAmount === String(amt) ? 'bg-teal-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={handleRecharge}
                disabled={recharging || !rechargeAmount}
                className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {recharging ? 'Processing...' : `Recharge ₹${rechargeAmount || '0'}`}
              </button>
            </div>
          </div>

          <div className="bg-teal-50 rounded-xl p-4 border border-teal-200">
            <p className="text-teal-800 text-sm text-center">
              Use your wallet balance at checkout. You can combine wallet with Razorpay for the remaining amount. Min ₹1, max ₹1,00,000 per recharge.
            </p>
          </div>
        </div>
      </div>

      {/* Receipt popup */}
      {receiptPopup && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setReceiptPopup(null)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Escape' && setReceiptPopup(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Recharge Successful</h3>
            </div>
            <div className="border-t border-gray-200 pt-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Amount</span>
                <span className="font-semibold">₹{receiptPopup.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">New Balance</span>
                <span className="font-semibold text-teal-700">₹{receiptPopup.newBalance.toFixed(2)}</span>
              </div>
              <div>
                <p className="text-gray-600 text-sm mb-1">Receipt</p>
                <p className="font-mono text-sm text-gray-800 break-all">{receiptPopup.receipt || '—'}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setReceiptPopup(null)}
              className="w-full bg-teal-700 text-white font-bold py-3 rounded-xl mt-4 hover:bg-teal-800"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
}
