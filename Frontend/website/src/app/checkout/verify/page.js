"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import * as api from "@/api";
import { useAppContext } from "@/context/context";
import { showToast } from "@/utils/toast";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function verifyWithRetry(payload, maxAttempts = 3) {
  let lastErr;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await api.verifyPayment(payload);
    } catch (err) {
      lastErr = err;
      const code = err?.data?.code || err?.response?.data?.code;
      const message = String(err?.data?.message || err?.response?.data?.message || err?.message || "");
      const status = Number(err?.status || err?.response?.status || 0);
      const retryable =
        code === "VERIFY_PAYMENT_FAILED" ||
        code === "RAZORPAY_VERIFY_FETCH_FAILED" ||
        status >= 500 ||
        /network|timeout|failed to fetch|server error/i.test(message);

      if (!retryable || attempt === maxAttempts) {
        throw err;
      }

      await wait(700 * attempt);
    }
  }
  throw lastErr;
}

export default function CheckoutVerifyPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { token, refreshCart } = useAppContext();
  const [status, setStatus] = useState("processing");
  const [errorMessage, setErrorMessage] = useState("");
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (!token) {
      router.replace("/login?redirect=checkout");
      return;
    }

    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    const razorpayOrderId = params.get("razorpay_order_id") || "";
    const razorpayPaymentId = params.get("razorpay_payment_id") || "";
    const razorpaySignature = params.get("razorpay_signature") || "";

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      setStatus("failed");
      setErrorMessage("Missing payment details in callback. Please try payment again.");
      return;
    }

    (async () => {
      try {
        await verifyWithRetry(
          {
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature,
          },
          3,
        );

        try {
          await api.clearCart();
        } catch {
          // Fallback to refresh-only path if clear API fails.
        }

        await refreshCart();
        showToast("Payment successful! Order placed.", "success");
        setStatus("success");
        router.replace("/orders");
      } catch (err) {
        const msg = err?.data?.message || err?.response?.data?.message || err?.message || "Payment verification failed";
        setStatus("failed");
        setErrorMessage(msg);
        showToast(msg, "error");
      }
    })();
  }, [params, refreshCart, router, token]);

  if (status === "processing") {
    return (
      <main className="min-h-screen grid place-items-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-xl border border-slate-100">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-teal-700 border-t-transparent" />
          <h1 className="text-xl font-bold text-slate-900">Verifying payment</h1>
          <p className="mt-2 text-sm text-slate-600">Please wait while we confirm your transaction and update your cart.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen grid place-items-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-xl border border-slate-100">
        <h1 className="text-xl font-bold text-rose-700">Payment verification failed</h1>
        <p className="mt-2 text-sm text-slate-600">{errorMessage || "Please retry from checkout."}</p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link href="/checkout" className="rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800">
            Back to checkout
          </Link>
          <Link href="/orders" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            View orders
          </Link>
        </div>
      </div>
    </main>
  );
}
