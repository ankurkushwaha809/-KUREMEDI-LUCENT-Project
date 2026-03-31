"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, Plus, Minus, ShoppingBag, Truck, ShieldCheck, ArrowRight } from "lucide-react";
import { useAppContext } from "@/context/context";
import { getImageUrl } from "@/utils/product";
import { showToast } from "@/utils/toast";

export default function CartPage() {
  const router = useRouter();
  const { cartItems, cartLoading, updateCartQty, removeFromCart, token, user } = useAppContext();

  const subtotal = cartItems?.reduce((acc, item) => acc + item.price * item.qty, 0) ?? 0;
  const deliveryFee = 40;
  const discount = subtotal >= 999 ? 50 : 0;
  const total = subtotal + deliveryFee - discount;

  const handleDecrease = (item) => {
    const minQty = item.minOrderQty ?? 1;
    const newQty = item.qty <= minQty ? 0 : item.qty - 1;
    updateCartQty(item._id, newQty);
  };

  const handleIncrease = (item) => {
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
    router.push("/checkout");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
          <ShoppingBag className="text-teal-600" /> My Cart ({cartItems?.length ?? 0})
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cartItems?.length > 0 ? (
              cartItems.map((item) => (
                <div
                  key={item._id}
                  className="bg-white p-4 md:p-6 rounded-3xl shadow-sm border border-gray-100 flex gap-4 md:gap-6 items-center"
                >
                  <div className="w-20 h-20 md:w-28 md:h-28 bg-gray-50 rounded-2xl flex-shrink-0 flex items-center justify-center overflow-hidden">
                    <img
                      src={item.image || "https://placehold.co/100?text=No+Image"}
                      alt={item.name}
                      className="w-16 md:w-20 object-contain"
                    />
                  </div>

                  <div className="flex-grow">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 capitalize">{item.name}</h3>
                        <p className="text-sm text-gray-500 mb-2">₹{item.price} each</p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item._id)}
                        disabled={cartLoading}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>

                    <div className="flex justify-between items-end mt-2">
                      <div className="flex items-center bg-gray-50 border border-gray-200 rounded-full px-3 py-1 gap-4">
                        <button
                          onClick={() => handleDecrease(item)}
                          disabled={cartLoading}
                          className="text-teal-600 hover:text-teal-800 p-1 disabled:opacity-50"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="font-bold text-gray-800 min-w-[24px] text-center">
                          {item.qty}
                        </span>
                        <button
                          onClick={() => handleIncrease(item)}
                          disabled={cartLoading}
                          className="text-teal-600 hover:text-teal-800 p-1 disabled:opacity-50"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      <p className="text-xl font-black text-teal-600">₹{item.price * item.qty}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
                <ShoppingBag size={64} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg">Your cart is empty</p>
                <Link href="/" className="text-teal-600 font-bold mt-2 inline-block">
                  Start Shopping
                </Link>
              </div>
            )}

            {cartItems?.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-teal-50 p-4 rounded-2xl flex items-center gap-3">
                  <Truck className="text-teal-700" />
                  <span className="text-sm font-medium text-teal-800">
                    Free delivery on orders above ₹999
                  </span>
                </div>
                <div className="bg-teal-50 p-4 rounded-2xl flex items-center gap-3">
                  <ShieldCheck className="text-teal-700" />
                  <span className="text-sm font-medium text-teal-800">
                    100% Genuine Medicines
                  </span>
                </div>
              </div>
            )}
          </div>

          {cartItems?.length > 0 && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 sticky top-24">
                <h2 className="text-lg font-bold text-gray-900 mb-6 border-b pb-4">Bill Details</h2>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Item Total</span>
                    <span>₹{subtotal}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery Fee</span>
                    <span className="text-green-600">₹{deliveryFee}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Promotional Discount</span>
                      <span className="text-green-600">-₹{discount}</span>
                    </div>
                  )}
                  <hr className="border-gray-50" />
                  <div className="flex justify-between text-xl font-black text-gray-900">
                    <span>To Pay</span>
                    <span>₹{total}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={cartLoading}
                  className="w-full bg-teal-700 hover:bg-teal-800 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-teal-100 flex justify-center items-center gap-2 group transition-all disabled:opacity-70"
                >
                  {cartLoading ? "Loading..." : "Checkout"}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>

                <p className="text-[10px] text-center text-gray-400 mt-4 leading-relaxed uppercase tracking-tighter">
                  Safe and secure payments. 100% Authentic products only.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
