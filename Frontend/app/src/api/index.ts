/**
 * App API - mirrors admin context structure.
 * All endpoints reference backend: /api/products, /api/categories, /api/brands
 */

import { API_BASE_URL } from "@/src/config";
import { api } from "./client";

// Products - GET /products returns array, GET /products/:id returns single. Supports ?category=, ?categoryId=, ?brand=, ?brandId=, ?search=
export const getProducts = (params?: {
  category?: string;
  categoryId?: string;
  brand?: string;
  brandId?: string;
  search?: string;
}) => api.get("/products", { params }).then((res) => res.data);

export const getProductById = (id: string) =>
  api.get(`/products/${id}`).then((res) => res.data);

// Categories - GET /categories returns { success, data }
export const getCategories = () =>
  api.get("/categories").then((res) => res.data);

// Brands - GET /brands returns { success, data }
export const getBrands = () => api.get("/brands").then((res) => res.data);

// Marketing banners - GET /marketing/banners returns { success, data }
export const getMarketingBanners = () =>
  api.get("/marketing/banners").then((res) => res.data);

// Auth - mobile OTP flow (backend uses "phone")
export const sendOtp = (phone: string) =>
  api.post("/auth/send-otp", { phone }).then((res) => res.data);

export const verifyOtp = (phone: string, otp: string) =>
  api.post("/auth/verify-otp", { phone, otp }).then((res) => res.data);

export const loginWithPassword = (email: string, password: string) =>
  api.post("/auth/login", { email, password }).then((res) => res.data);

export const completeRegistration = (
  tempToken: string,
  data: {
    name: string;
    email: string;
    password?: string;
    referralCode?: string;
  },
) =>
  api
    .post("/auth/complete-registration", {
      ...data,
      referralCode: data.referralCode ?? "",
    }, {
      headers: { Authorization: `Bearer ${tempToken}` },
    })
    .then((res) => res.data);

// Auth profile - GET /auth/me (requires token)
export const getMe = () => api.get("/auth/me").then((res) => res.data);

// Update profile - PUT /auth/me
export const updateProfile = (data: { name?: string; email?: string }) =>
  api.put("/auth/me", data).then((res) => res.data);

// KYC - PUT /auth/kyc (multipart). Use fetch() so RN FormData file uploads (uri/name/type) work reliably.
const KYC_UPLOAD_TIMEOUT_MS = 120000;

export async function submitKyc(
  formData: FormData,
  token: string
): Promise<{ message: string; user: unknown }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), KYC_UPLOAD_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_BASE_URL}/auth/kyc`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        // Do NOT set Content-Type - let runtime set multipart/form-data with boundary
      },
      body: formData,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(
        (data && typeof data.message === "string" ? data.message : null) ||
          `Request failed (${res.status})`
      ) as Error & { response?: { status: number; data?: unknown } };
      err.response = { status: res.status, data };
      throw err;
    }
    return data as { message: string; user: unknown };
  } catch (e) {
    clearTimeout(timeoutId);
    if ((e as Error).name === "AbortError") {
      const err = new Error("Request timed out. Try again.") as Error & {
        code?: string;
      };
      err.code = "ECONNABORTED";
      throw err;
    }
    throw e;
  }
}

// Orders - GET /orders/my
export const getMyOrders = () => api.get("/orders/my").then((res) => res.data);

// Order tracking - GET /orders/:orderId/tracking (live status + Shiprocket scans)
export const getOrderTracking = (orderId: string) =>
  api.get(`/orders/${orderId}/tracking`).then((res) => res.data);

// Place order (COD) - POST /orders
export const placeOrder = (data: {
  shippingAddress: { shopName?: string; address: string; phone: string };
  notes?: string;
}) => api.post("/orders", data).then((res) => res.data);

// Cart - requires KYC approved
export const getCart = () =>
  api
    .get("/cart")
    .then(
      (res) =>
        res.data as { success: boolean; items?: unknown[]; cart?: unknown },
    );

export const addToCart = (productId: string, quantity?: number) =>
  api
    .post("/cart/add", { productId, quantity: quantity ?? 1 })
    .then((res) => res.data);

export const updateCartQty = (productId: string, quantity: number) =>
  api.put("/cart/update", { productId, quantity }).then((res) => res.data);

export const removeFromCart = (productId: string) =>
  api.delete(`/cart/remove/${productId}`).then((res) => res.data);

export const clearCart = () =>
  api.delete("/cart/clear").then((res) => res.data);

// Addresses
export const getAddresses = () =>
  api
    .get("/addresses")
    .then((res) => res.data as { success: boolean; data?: unknown[] });

export const addAddress = (data: {
  label?: string;
  shopName?: string;
  address: string;
  city: string;
  state?: string;
  pincode: string;
  phone: string;
  isDefault?: boolean;
}) => api.post("/addresses", data).then((res) => res.data);

// Wallet - GET /wallet (balance + transactions including referral bonus)
export type WalletTransaction = {
  amount: number;
  type: "CREDIT" | "DEBIT";
  description: string;
  reference?: string;
  balanceAfter?: number;
  createdAt?: string;
};

export type WalletResponse = {
  balance: number;
  walletId?: string;
  transactions?: WalletTransaction[];
};

export const getWallet = () =>
  api.get("/wallet").then((res) => res.data as WalletResponse);

// Wallet recharge
export const createWalletRechargeOrder = (amount: number) =>
  api
    .post("/wallet/recharge", { amount })
    .then(
      (res) =>
        res.data as { razorpayOrderId: string; amount: number; keyId: string },
    );

export const verifyWalletRecharge = (data: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}) =>
  api
    .post("/wallet/recharge/verify", data)
    .then(
      (res) =>
        res.data as { newBalance: number; amount: number; receipt: string },
    );

// Checkout - Online payment flow
export const createPaymentOrder = (data?: {
  shippingAddress?: { shopName?: string; address?: string; phone?: string };
  notes?: string;
  walletAmount?: number;
}) => api.post("/payment/create-order", data || {}).then((res) => res.data);

export const verifyPayment = (data: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}) => api.post("/payment/verify-payment", data).then((res) => res.data);

// Support / Customer care – tickets and chat
export type SupportTicketCategory =
  | "ORDER"
  | "PAYMENT"
  | "PRODUCT"
  | "WALLET"
  | "KYC"
  | "DELIVERY"
  | "OTHER";
export type SupportTicketStatus =
  | "NEW"
  | "OPEN"
  | "IN_PROGRESS"
  | "CALLING"
  | "RESOLVED"
  | "CLOSED";
export type SupportTicketPriority = "LOW" | "MEDIUM" | "HIGH";

export type SupportTicket = {
  _id: string;
  ticketNo?: string;
  user: string | { _id: string; name?: string; phone?: string; email?: string };
  subject: string;
  category: SupportTicketCategory;
  priority: SupportTicketPriority;
  status: SupportTicketStatus;
  contactPhone?: string;
  contactName?: string;
  contactEmail?: string;
  initialMessage: string;
  lastMessageAt?: string;
  createdAt?: string;
  direction?: "INBOUND" | "OUTBOUND";
};

export type SupportMessage = {
  _id: string;
  ticket: string;
  body: string;
  isFromAdmin: boolean;
  type?: "message" | "call_note";
  attachment?: string;
  createdAt?: string;
};

export const createSupportTicket = (data: {
  message: string;
  subject?: string;
  category?: SupportTicketCategory;
  priority?: SupportTicketPriority;
  contactPhone?: string;
  contactName?: string;
  contactEmail?: string;
  problemType?: SupportTicketCategory;
  attachment?: string;
}) => api.post("/support/tickets", data).then((res) => res.data);

export const getMySupportTickets = () =>
  api
    .get("/support/tickets")
    .then((res) => res.data as { success: boolean; data: SupportTicket[] });

export const getSupportTicketById = (id: string) =>
  api
    .get(`/support/tickets/${id}`)
    .then(
      (res) =>
        res.data as {
          success: boolean;
          data: { ticket: SupportTicket; messages: SupportMessage[] };
        }
    );

export const sendSupportMessage = (ticketId: string, body: string) =>
  api
    .post(`/support/tickets/${ticketId}/messages`, { body })
    .then((res) => res.data as { success: boolean; data: SupportMessage });

export const registerSupportPushToken = (token: string) =>
  api.post("/support/push-token", { token }).then((res) => res.data);
