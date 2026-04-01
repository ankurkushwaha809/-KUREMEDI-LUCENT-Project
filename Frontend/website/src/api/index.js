/**
 * Website API - mirrors app API structure. Same endpoints as React Native app.
 */
import { API_BASE_URL } from "../config";
import { apiGet, apiPost, apiPut, apiDelete } from "./client";

export const getProducts = (params = {}) => {
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v != null && v !== "")
  );
  const q = new URLSearchParams(clean).toString();
  return apiGet(`/products${q ? `?${q}` : ""}`);
};

export const getProductById = (id) => apiGet(`/products/${id}`);

export const getCategories = () => apiGet("/categories");

export const getBrands = () => apiGet("/brands");

export const sendOtp = (phone) => apiPost("/auth/send-otp", { phone });

export const verifyOtp = (phone, otp) => apiPost("/auth/verify-otp", { phone, otp });

export const completeRegistration = (tempToken, data) =>
  fetch(`${API_BASE_URL}/auth/complete-registration`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tempToken}`,
    },
    body: JSON.stringify(data),
  }).then((r) => r.json());

export const getMe = () => apiGet("/auth/me");

export const getCart = () => apiGet("/cart");

export const addToCart = (productId, quantity = 1) =>
  apiPost("/cart/add", { productId, quantity });

export const updateCartQty = (productId, quantity) =>
  apiPut("/cart/update", { productId, quantity });

export const removeFromCart = (productId) =>
  apiDelete(`/cart/remove/${productId}`);

export const clearCart = () => apiDelete("/cart/clear");

export const updateProfile = (data) => apiPut("/auth/me", data);

export const submitKyc = async (formData) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) throw new Error("Not authenticated");
  const res = await fetch(`${API_BASE_URL}/auth/kyc`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  return res.json();
};

export const getWallet = () => apiGet("/wallet");

export const getMyOrders = () => apiGet("/orders/my");

export const getOrderTracking = (orderId) => apiGet(`/orders/${orderId}/tracking`);

export const createWalletRechargeOrder = (amount) =>
  apiPost("/wallet/recharge", { amount });

export const verifyWalletRecharge = (data) =>
  apiPost("/wallet/recharge/verify", data);

export const getAddresses = () => apiGet("/addresses");

export const addAddress = (data) => apiPost("/addresses", data);

export const getMinimumCheckoutAmount = () =>
  apiGet("/config/minimum-checkout-amount");

export const createPaymentOrder = (data) =>
  apiPost("/payment/create-order", data || {});

export const verifyPayment = (data) =>
  apiPost("/payment/verify-payment", data);

// --- Support API ---

export const getMySupportTickets = () => apiGet("/support/tickets");

export const getSupportTicketById = (id) => apiGet(`/support/tickets/${id}`);

export const createSupportTicket = (data) =>
  apiPost("/support/tickets", {
    message: data.message,
    subject: data.subject,
    category: data.category || data.problemType,
    priority: data.priority,
    contactName: data.contactName,
    contactPhone: data.contactPhone,
    contactEmail: data.contactEmail,
    attachment: data.attachment,
  }).then((res) => res.data);

export const sendSupportMessage = (ticketId, body, attachment) =>
  apiPost(`/support/tickets/${ticketId}/messages`, { body, ...(attachment && { attachment }) });
