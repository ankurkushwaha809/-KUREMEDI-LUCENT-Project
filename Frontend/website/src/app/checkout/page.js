"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Script from "next/script";
import {
  MapPin,
  CreditCard,
  ChevronRight,
  ChevronLeft,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Wallet,
} from "lucide-react";
import { useAppContext } from "@/context/context";
import * as api from "@/api";
import { showToast } from "@/utils/toast";

const toPaise = (value) => Math.round((Number(value) || 0) * 100);
const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

export default function CheckoutPage() {
  const router = useRouter();
  const {
    cartItems,
    cartLoading,
    token,
    user,
    refreshCart,
  } = useAppContext();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [notes, setNotes] = useState("");
  const [placing, setPlacing] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [useWalletAmount, setUseWalletAmount] = useState(0);
  const [paymentModal, setPaymentModal] = useState(null);
  const [minimumCheckoutAmount, setMinimumCheckoutAmount] = useState(0);
  const [newAddr, setNewAddr] = useState({
    address: "",
    city: "",
    state: "",
    pincode: "",
    phone: user?.phone || "",
    shopName: "",
  });

  useEffect(() => {
    if (!token) return;
    api
      .getAddresses()
      .then((res) => {
        const data = Array.isArray(res?.data) ? res.data : [];
        setAddresses(data);
        const def = data.find((a) => a.isDefault) ?? data[0];
        setSelectedAddress(def ?? null);
        if (data.length === 0) setShowAddAddress(true);
      })
      .catch(() => setAddresses([]));
  }, [token]);

  useEffect(() => {
    if (!token) return;
    api
      .getWallet()
      .then((w) => setWalletBalance(w?.balance ?? 0))
      .catch(() => setWalletBalance(0));
  }, [token]);

  useEffect(() => {
    api
      .getMinimumCheckoutAmount()
      .then((res) => {
        const amount = Number(res?.amount || 0);
        setMinimumCheckoutAmount(Number.isFinite(amount) ? Math.max(0, amount) : 0);
      })
      .catch(() => setMinimumCheckoutAmount(0));
  }, []);

  useEffect(() => {
    if (user?.phone && !newAddr.phone) {
      setNewAddr((p) => ({ ...p, phone: user.phone || "" }));
    }
  }, [user?.phone, newAddr.phone]);

  const totalPaise =
    cartItems?.reduce((s, i) => s + toPaise(i.price) * (Number(i.qty) || 0), 0) ?? 0;
  const walletBalancePaise = toPaise(walletBalance);
  const total = totalPaise / 100;
  const maxWalletUsePaise = Math.min(walletBalancePaise, totalPaise);
  const maxWalletUse = maxWalletUsePaise / 100;
  const useWalletAmountPaise = Math.min(toPaise(useWalletAmount), maxWalletUsePaise);
  const razorpayAmountPaise = Math.max(0, totalPaise - useWalletAmountPaise);
  const razorpayAmount = razorpayAmountPaise / 100;

  const shippingAddress = selectedAddress
    ? {
        shopName: selectedAddress.shopName || "",
        address: selectedAddress.address || "",
        phone: selectedAddress.phone || "",
        city: selectedAddress.city || "",
        state: selectedAddress.state || "",
        pincode: selectedAddress.pincode || "",
      }
    : null;

  const handleAddAddress = async () => {
    if (!newAddr.address?.trim() || !newAddr.city?.trim() || !newAddr.pincode?.trim() || !newAddr.phone?.trim()) {
      showToast("Please fill address, city, pincode and phone", "error");
      return;
    }
    try {
      const res = await api.addAddress({
        address: newAddr.address.trim(),
        city: newAddr.city.trim(),
        state: newAddr.state?.trim() || undefined,
        pincode: newAddr.pincode.trim(),
        phone: newAddr.phone.trim(),
        shopName: newAddr.shopName?.trim() || undefined,
      });
      const added = res?.address;
      if (added) {
        setAddresses((prev) => [...prev, added]);
        setSelectedAddress(added);
        setShowAddAddress(false);
        setNewAddr({
          address: "",
          city: "",
          state: "",
          pincode: "",
          phone: user?.phone || "",
          shopName: "",
        });
      }
    } catch (err) {
      showToast(err?.response?.data?.message || err?.message || "Failed to add address", "error");
    }
  };

  const sanitizeCartBeforeCheckout = async () => {
    const cartRes = await api.getCart();
    const rawItems = Array.isArray(cartRes?.items) ? cartRes.items : [];

    let changed = false;

    for (const item of rawItems) {
      const product = item?.product;
      const productId = product?._id;
      const qty = Number(item?.quantity || 0);
      const stock = Number(product?.stockQuantity ?? 0);
      const isActive = Boolean(product?.isActive);

      if (!productId) continue;

      if (!isActive || stock <= 0) {
        await api.removeFromCart(productId);
        changed = true;
        continue;
      }

      if (qty > stock) {
        await api.updateCartQty(productId, stock);
        changed = true;
      }
    }

    let latestCount = rawItems.length;
    if (changed) {
      const refreshedCart = await api.getCart();
      latestCount = Array.isArray(refreshedCart?.items) ? refreshedCart.items.length : 0;
      await refreshCart();
    }

    return { changed, latestCount };
  };

  const handlePlaceOrder = async () => {
    if (placing || paymentModal) {
      return;
    }

    if (!token) {
      router.push("/login");
      return;
    }
    if (user?.kyc !== "APPROVED") {
      router.push("/kyc?redirect=checkout");
      return;
    }
    if (!shippingAddress) {
      showToast("Please select or add a shipping address", "error");
      return;
    }
    if (!cartItems?.length) {
      showToast("Your cart is empty", "info");
      return;
    }

    if (minimumCheckoutAmount > 0 && total < minimumCheckoutAmount) {
      const shortBy = Math.max(0, minimumCheckoutAmount - total);
      showToast(
        `Minimum order value is ${formatCurrency(minimumCheckoutAmount)}. Add ${formatCurrency(shortBy)} more to continue.`,
        "error",
      );
      return;
    }

    const walletToUse = Math.min(useWalletAmount, maxWalletUse);

    setPlacing(true);
    try {
      const sanitizeResult = await sanitizeCartBeforeCheckout();
      if (sanitizeResult.changed && sanitizeResult.latestCount === 0) {
        showToast("Some products were removed from your cart. Please review and try again.", "error");
        router.push("/cart");
        return;
      }

      const res = await api.createPaymentOrder({
        shippingAddress,
        notes: notes.trim() || undefined,
        walletAmount: walletToUse,
      });

      if (res?.requiresCartReview) {
        await refreshCart();
        showToast(res?.message || "Some products are no longer available. Please review your cart.", "error");
        router.push("/cart");
        return;
      }

      if (res?.cartAdjusted) {
        await refreshCart();
        const adjustedCount = Array.isArray(res?.adjustments) ? res.adjustments.length : 0;
        showToast(
          adjustedCount > 0
            ? `${adjustedCount} cart item(s) were adjusted to available stock.`
            : "Some cart quantities were adjusted to available stock.",
          "info",
        );
      }

      if (res?.paidByWallet) {
        await refreshCart();
        showToast("Order placed successfully using wallet!", "success");
        router.push("/orders");
        return;
      }

      if (!res?.razorpayOrderId || !res?.keyId) {
        showToast(res?.message || "Payment gateway not configured. Contact support.", "error");
        setPlacing(false);
        return;
      }

      const amountInPaise = Math.round((res.amount ?? razorpayAmount) * 100);

      setPaymentModal({
        keyId: res.keyId,
        razorpayOrderId: res.razorpayOrderId,
        amount: amountInPaise,
        orderId: res.orderId ?? "",
      });
      setPlacing(false);
    } catch (err) {
      const errMessage = err?.data?.message || err?.message || "Failed to place order";
      const errCode = err?.data?.code;

      if (
        errCode === "CART_EMPTY_AFTER_SYNC" ||
        /product not available|out of stock/i.test(errMessage)
      ) {
        await refreshCart();
        showToast("Some products are no longer available. Please review your cart.", "error");
        router.push("/cart");
        return;
      }

      if (errCode === "RAZORPAY_RATE_LIMIT" || /too many requests/i.test(errMessage)) {
        showToast("Too many payment attempts. Please wait a few seconds and try again.", "error");
        return;
      }

      showToast(errMessage, "error");
    } finally {
      setPlacing(false);
    }
  };

  const handleRazorpaySuccess = async (paymentId, signature) => {
    if (!paymentModal) return;
    setPaymentModal(null);
    try {
      await api.verifyPayment({
        razorpayOrderId: paymentModal.razorpayOrderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: signature,
      });
      await refreshCart();
      showToast("Payment successful! Order placed.", "success");
      router.push("/orders");
    } catch (err) {
      setPaymentModal(null);
      showToast(err?.data?.message || err?.message || "Payment verification failed", "error");
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <p className="text-gray-600 mb-4">Please login to checkout</p>
        <Link href="/login" className="bg-teal-700 text-white px-6 py-3 rounded-xl font-semibold hover:bg-teal-800">
          Login
        </Link>
      </div>
    );
  }

  if (user?.kyc !== "APPROVED") {
    router.push("/kyc?redirect=checkout");
    return null;
  }

  if ((!cartItems?.length && !cartLoading) || cartItems?.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <p className="text-gray-600 mb-4">Your cart is empty</p>
        <Link href="/" className="bg-teal-700 text-white px-6 py-3 rounded-xl font-semibold hover:bg-teal-800">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <div className="min-h-screen bg-gray-50 py-10">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex items-center gap-4 mb-8">
            <Link href="/cart" className="text-gray-600 hover:text-teal-700">
              <ChevronLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
            <div className="h-px grow bg-gray-200 hidden md:block" />
            <div className="flex items-center gap-2 text-teal-700 font-medium">
              <ShieldCheck size={20} />
              <span className="text-sm uppercase tracking-wide">Secure Checkout</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Delivery Address */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <MapPin className="text-teal-700" /> 1. Delivery Address
                  </h2>
                  {!showAddAddress && (
                    <button
                      onClick={() => setShowAddAddress(true)}
                      className="text-teal-700 font-bold text-sm flex items-center gap-1 hover:underline"
                    >
                      <Plus size={16} /> Add New
                    </button>
                  )}
                </div>

                {showAddAddress ? (
                  <div className="space-y-4 p-4 border border-gray-200 rounded-2xl bg-gray-50/50">
                    <input
                      type="text"
                      placeholder="Address *"
                      value={newAddr.address}
                      onChange={(e) => setNewAddr((p) => ({ ...p, address: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-teal-700"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="City *"
                        value={newAddr.city}
                        onChange={(e) => setNewAddr((p) => ({ ...p, city: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-teal-700"
                      />
                      <input
                        type="text"
                        placeholder="Pincode *"
                        value={newAddr.pincode}
                        onChange={(e) => setNewAddr((p) => ({ ...p, pincode: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-teal-700"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Phone *"
                      value={newAddr.phone}
                      onChange={(e) => setNewAddr((p) => ({ ...p, phone: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-teal-700"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddAddress}
                        className="flex-1 bg-teal-700 text-white py-3 rounded-xl font-bold hover:bg-teal-800"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setShowAddAddress(false)}
                        className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((addr) => (
                      <div
                        key={addr._id}
                        onClick={() => setSelectedAddress(addr)}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                          selectedAddress?._id === addr._id
                            ? "border-teal-700 bg-teal-50/30"
                            : "border-gray-100 bg-white hover:border-gray-200"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                            {addr.shopName || "Address"}
                          </span>
                          {selectedAddress?._id === addr._id && (
                            <CheckCircle2 size={18} className="text-teal-700 fill-teal-50" />
                          )}
                        </div>
                        <p className="font-bold text-gray-800">{addr.address}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {addr.city}
                          {addr.state && `, ${addr.state}`} {addr.pincode}
                        </p>
                        <p className="text-sm text-gray-700 mt-2 font-medium">{addr.phone}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-6">
                  <CreditCard className="text-teal-700" /> 2. Payment Method
                </h2>

                {/* Wallet */}
                <div className="flex items-center justify-between p-4 rounded-2xl border-2 border-gray-200 mb-4">
                  <div className="flex items-center gap-3">
                    <Wallet className="w-6 h-6 text-teal-700" />
                    <div>
                      <p className="font-medium text-gray-800">Wallet Balance</p>
                      <p className="text-teal-700 font-bold">{formatCurrency(walletBalance)}</p>
                    </div>
                  </div>
                  {maxWalletUse > 0 && (
                    <button
                      onClick={() =>
                        setUseWalletAmount(useWalletAmount === maxWalletUse ? 0 : maxWalletUse)
                      }
                      className={`px-4 py-2 rounded-xl font-semibold ${
                        useWalletAmount === maxWalletUse ? "bg-teal-700 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      Use {formatCurrency(maxWalletUse)}
                    </button>
                  )}
                </div>

                {useWalletAmount > 0 && (
                  <div className="bg-teal-50 rounded-xl p-4 mb-4 border border-teal-200">
                    <p className="text-sm font-semibold text-teal-800 mb-2">Payment split</p>
                    <div className="flex justify-between text-gray-600">
                      <span>Wallet</span>
                      <span className="font-medium">{formatCurrency(useWalletAmountPaise / 100)}</span>
                    </div>
                    {razorpayAmount > 0 && (
                      <div className="flex justify-between text-gray-600 mt-1">
                        <span>Razorpay (Card/UPI)</span>
                        <span className="font-medium">{formatCurrency(razorpayAmount)}</span>
                      </div>
                    )}
                  </div>
                )}

                {(razorpayAmount > 0 || useWalletAmount === 0) && (
                  <div
                    className={`p-4 rounded-2xl border-2 ${
                      useWalletAmount > 0 ? "border-gray-200" : "border-teal-700 bg-teal-50/30"
                    }`}
                  >
                    <p className="font-medium text-gray-800">
                      {razorpayAmount > 0
                        ? `Pay ${formatCurrency(razorpayAmount)} via Razorpay (Card / UPI / Net Banking)`
                        : "Pay via Razorpay (Card / UPI / Net Banking)"}
                    </p>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Notes (optional)</h2>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any delivery instructions?"
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-teal-700 resize-none"
                />
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden sticky top-24">
                <div className="bg-teal-700 p-6 text-white">
                  <h2 className="text-lg font-bold">Order Summary</h2>
                  <p className="text-gray-400 text-xs mt-1">{cartItems?.length ?? 0} items</p>
                </div>

                <div className="p-6">
                  <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                    {cartItems?.map((item) => (
                      <div key={item._id} className="flex justify-between items-center">
                        <div className="text-sm">
                          <p className="font-bold text-gray-800 capitalize">
                            {item.name} <span className="text-gray-400 font-normal">x {item.qty}</span>
                          </p>
                        </div>
                        <span className="font-bold text-gray-700">
                          {formatCurrency((toPaise(item.price) * (Number(item.qty) || 0)) / 100)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3 pt-4 border-t border-gray-100 mb-6">
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Subtotal</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                    {minimumCheckoutAmount > 0 && (
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>Minimum Order Value</span>
                        <span>{formatCurrency(minimumCheckoutAmount)}</span>
                      </div>
                    )}
                    {useWalletAmount > 0 && (
                      <div className="flex justify-between text-sm text-teal-700">
                        <span>Wallet</span>
                        <span>-{formatCurrency(useWalletAmountPaise / 100)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-2xl font-black text-gray-900 pt-2">
                      <span>Total</span>
                      <span>{formatCurrency((razorpayAmount > 0 ? razorpayAmount : total) || 0)}</span>
                    </div>
                  </div>

                  <button
                    onClick={handlePlaceOrder}
                    disabled={placing || !!paymentModal || !shippingAddress || cartLoading}
                    className="w-full bg-teal-700 hover:bg-teal-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-teal-100 flex justify-center items-center gap-2 group transition-all"
                  >
                    {placing ? "Processing..." : "Place Order"}
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>

                  {minimumCheckoutAmount > 0 && total < minimumCheckoutAmount && (
                    <p className="mt-3 text-xs text-red-600 font-medium">
                      Add {formatCurrency(minimumCheckoutAmount - total)} more to reach minimum checkout value.
                    </p>
                  )}

                  <div className="mt-6 p-3 bg-orange-50 rounded-xl border border-orange-100">
                    <p className="text-[10px] text-orange-800 font-medium leading-tight">
                      By placing the order, you agree to our terms of service and verify that you have a valid prescription for regulated medicines.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Razorpay modal */}
      {paymentModal && (
        <RazorpayModal
          paymentModal={paymentModal}
          onSuccess={handleRazorpaySuccess}
          onClose={() => setPaymentModal(null)}
        />
      )}
    </>
  );
}

function RazorpayModal({ paymentModal, onSuccess, onClose }) {
  useEffect(() => {
    if (!paymentModal || !window.Razorpay) return;
    const options = {
      key: paymentModal.keyId,
      amount: paymentModal.amount,
      currency: "INR",
      order_id: paymentModal.razorpayOrderId,
      name: "Lucent Biotech Pharmacy",
      description: "Order payment",
      handler: (response) => {
        onSuccess(response.razorpay_payment_id, response.razorpay_signature);
      },
      modal: {
        ondismiss: () => onClose(),
      },
    };
    const rzp = new window.Razorpay(options);
    rzp.open();
    return () => {
      try { rzp.close?.(); } catch (_) {}
    };
  }, [paymentModal?.razorpayOrderId]);

  return null;
}
