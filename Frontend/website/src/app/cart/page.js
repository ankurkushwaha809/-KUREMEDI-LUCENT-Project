"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, Plus, Minus, ShoppingBag, Truck, ShieldCheck, ArrowRight } from "lucide-react";
import { useAppContext } from "@/context/context";
import { getImageUrl } from "@/utils/product";
import { showToast } from "@/utils/toast";
import * as api from "@/api";

const toPaise = (value) => Math.round((Number(value) || 0) * 100);
const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
const formatPercent = (value) => {
  const n = Number(value) || 0;
  return Number.isInteger(n) ? `${n}%` : `${n.toFixed(2)}%`;
};
const getLineGstAmount = (item) => {
  const qty = Number(item?.qty) || 0;
  const unitGst = Number(item?.gstAmount);
  if (Number.isFinite(unitGst)) return unitGst * qty;
  const gstPercent = Math.max(0, Number(item?.gstPercent ?? item?.gst ?? 0));
  return ((Number(item?.price || 0) * qty) * gstPercent) / 100;
};

export default function CartPage() {
  const router = useRouter();
  const { cartItems, cartLoading, updateCartQty, removeFromCart, token, user } = useAppContext();
  const [minimumCheckoutAmount, setMinimumCheckoutAmount] = React.useState(0);

  const subtotalPaise =
    cartItems?.reduce((acc, item) => acc + toPaise(item.price) * (Number(item.qty) || 0), 0) ?? 0;
  const freeDeliveryThresholdPaise = toPaise(999);
  const deliveryFeePaise = subtotalPaise >= freeDeliveryThresholdPaise ? 0 : toPaise(40);
  const totalPaise = subtotalPaise + deliveryFeePaise;

  const subtotal = subtotalPaise / 100;
  const deliveryFee = deliveryFeePaise / 100;
  const total = totalPaise / 100;
  const amountToFreeDelivery = Math.max(0, (freeDeliveryThresholdPaise - subtotalPaise) / 100);
  const totalUnits = cartItems?.reduce((acc, item) => acc + (Number(item.qty) || 0), 0) ?? 0;

  React.useEffect(() => {
    api
      .getMinimumCheckoutAmount()
      .then((res) => {
        const amount = Number(res?.amount || 0);
        setMinimumCheckoutAmount(Number.isFinite(amount) ? Math.max(0, amount) : 0);
      })
      .catch(() => setMinimumCheckoutAmount(0));
  }, []);

  const handleDecrease = (item) => {
    const minQty = item.minOrderQty ?? 1;
    if ((Number(item.qty) || 0) <= minQty) {
      showToast(`Minimum buy quantity is ${minQty} unit${minQty > 1 ? "s" : ""}.`, "info");
      return;
    }
    updateCartQty(item._id, item.qty - 1);
  };

  const handleIncrease = (item) => {
    const stock = Number(item?.stockQuantity ?? 0);
    const qty = Number(item?.qty) || 0;
    if (stock > 0 && qty >= stock) {
      showToast(`Only ${stock} stock quantity are present.`, "error");
      return;
    }
    updateCartQty(item._id, item.qty + 1);
  };

  const handleCheckout = () => {
    if (!token) {
      router.push("/login");
      return;
    }
    if (user?.kyc !== "APPROVED") {
      showToast("Complete KYC to checkout.", "info", "KYC Required");
      router.push("/profile");
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

    router.push("/checkout");
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,#e6fffa_0%,#f8fafc_48%,#ffffff_100%)] py-6 md:py-10">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="rounded-3xl border border-teal-100 bg-white/80 backdrop-blur-sm p-5 md:p-7 shadow-[0_10px_35px_rgba(13,148,136,0.10)] mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-600/10 text-teal-700">
                  <ShoppingBag className="h-5 w-5" />
                </span>
                Cart Overview
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                {cartItems?.length ?? 0} items, {totalUnits} units in your basket
              </p>
            </div>
            <div className="rounded-2xl bg-slate-900 text-white px-4 py-3 min-w-52.5">
              <p className="text-[11px] uppercase tracking-wider text-slate-300">Items Total</p>
              <p className="text-2xl font-extrabold mt-0.5">{formatCurrency(subtotal)}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 md:gap-8">
          <div className="space-y-4">
            {cartItems?.length > 0 ? (
              cartItems.map((item) => {
                const lineTotal = (toPaise(item.price) * (Number(item.qty) || 0)) / 100;
                const lineGstPercent = Math.max(0, Number(item?.gstPercent ?? item?.gst ?? 0));
                const lineGstAmount = getLineGstAmount(item);
                const showGst = lineGstPercent > 0 && lineGstAmount > 0;
                const preGstAmount = Math.max(0, lineTotal - lineGstAmount);
                return (
                  <div
                    key={item._id}
                    className="group rounded-3xl border border-slate-200 bg-white p-4 md:p-5 transition-all hover:border-slate-300 hover:shadow-[0_8px_22px_rgba(15,23,42,0.06)]"
                  >
                    <div className="flex gap-4">
                      <div className="h-20 w-20 md:h-24 md:w-24 rounded-2xl bg-slate-50 border border-slate-200 shrink-0 overflow-hidden flex items-center justify-center">
                        <img
                          src={getImageUrl(item.image) || "/images/product-fallback.svg"}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="text-[15px] md:text-base font-extrabold text-slate-900 capitalize truncate">
                              {item.name}
                            </h3>
                            <p className="text-sm font-bold text-slate-900 mt-1">Price Details</p>
                            <p className="text-xs text-slate-500 mt-1">
                              Amount (Pre-GST): <span className="font-semibold text-slate-700">{formatCurrency(preGstAmount)}</span>
                            </p>
                            <p className="text-xs text-slate-700 mt-0.5 font-semibold">
                              {showGst
                                ? `GST: ${formatPercent(lineGstPercent)} (${formatCurrency(lineGstAmount)})`
                                : "GST not included"}
                            </p>
                            <p className="text-lg md:text-xl leading-tight font-extrabold text-emerald-600 mt-1">
                              Final Amount: {formatCurrency(lineTotal)}
                            </p>
                            <p className="text-[11px] text-slate-400 mt-1">
                              Min order: {item.minOrderQty ?? 1}
                            </p>
                          </div>
                          <button
                            onClick={() => removeFromCart(item._id)}
                            disabled={cartLoading}
                            className="text-slate-400 hover:text-rose-600 transition-colors p-1.5 rounded-xl hover:bg-rose-50 disabled:opacity-60"
                            aria-label="Remove item"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-3">
                          <div className="inline-flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-2 py-1.5 gap-2">
                            <button
                              onClick={() => handleDecrease(item)}
                              disabled={cartLoading}
                              className="h-8 w-8 inline-flex items-center justify-center rounded-xl text-teal-700 hover:bg-teal-100 disabled:opacity-50"
                            >
                              <Minus size={16} />
                            </button>
                            <span className="w-8 text-center text-sm font-bold text-slate-800">{item.qty}</span>
                            <button
                              onClick={() => handleIncrease(item)}
                              disabled={cartLoading}
                              className="h-8 w-8 inline-flex items-center justify-center rounded-xl text-teal-700 hover:bg-teal-100 disabled:opacity-50"
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                          <p className="text-xl md:text-2xl font-extrabold text-emerald-600">{formatCurrency(lineTotal)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-16 md:py-20 rounded-3xl border border-dashed border-slate-300 bg-white">
                <ShoppingBag size={60} className="mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500 text-lg font-medium">Your cart is empty</p>
                <Link
                  href="/"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-2.5 text-white font-semibold hover:bg-teal-800"
                >
                  Start Shopping <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}

            {cartItems?.length > 0 && (
              <>
                <div className="mt-5 space-y-2 rounded-2xl bg-slate-50 p-4 border border-slate-200">
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>Items total</span>
                    <span className="font-semibold text-slate-900">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>Delivery fee</span>
                    <span className="font-semibold text-slate-900">
                      {deliveryFee > 0 ? formatCurrency(deliveryFee) : "Free"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-base font-extrabold text-slate-900">
                    <span>Payable amount</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-teal-100 bg-teal-50 p-4 flex items-center gap-3">
                    <Truck className="text-teal-700 h-5 w-5" />
                    <p className="text-sm text-teal-900 font-medium">
                      {amountToFreeDelivery > 0
                        ? `Add ${formatCurrency(amountToFreeDelivery)} more for free delivery.`
                        : "You unlocked free delivery on this order."}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-teal-100 bg-teal-50 p-4 flex items-center gap-3">
                    <ShieldCheck className="text-teal-700 h-5 w-5" />
                    <p className="text-sm text-teal-900 font-medium">Only verified and authentic products.</p>
                  </div>
                </div>
              </>
            )}
          </div>

          {cartItems?.length > 0 && (
            <div>
              <div className="sticky top-24 rounded-3xl border border-slate-200 bg-white p-5 md:p-6 shadow-[0_12px_30px_rgba(2,6,23,0.08)]">
                <h2 className="text-lg font-extrabold text-slate-900">Continue</h2>
                <p className="text-xs text-slate-500 mt-1">Proceed to checkout to review final payable details.</p>

                {minimumCheckoutAmount > 0 && total < minimumCheckoutAmount && (
                  <p className="mt-4 rounded-xl bg-rose-50 border border-rose-100 px-3 py-2 text-xs text-rose-700 font-medium">
                    Add {formatCurrency(minimumCheckoutAmount - total)} more to reach minimum checkout value.
                  </p>
                )}

                <button
                  onClick={handleCheckout}
                  disabled={cartLoading}
                  className="mt-5 w-full bg-teal-700 hover:bg-teal-800 text-white py-3.5 rounded-2xl font-bold text-base shadow-lg shadow-teal-100 flex justify-center items-center gap-2 group transition-all disabled:opacity-70"
                >
                  {cartLoading ? "Loading..." : "Proceed to Checkout"}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>

                <p className="text-[11px] text-center text-slate-400 mt-4 leading-relaxed">
                  Safe payments and authenticated stock.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
