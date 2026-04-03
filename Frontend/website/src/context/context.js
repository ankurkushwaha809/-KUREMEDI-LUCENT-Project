"use client";

import { createContext, useState, useContext, useCallback, useEffect, useRef } from "react";
import * as api from "@/api";
import { getImageUrl } from "@/utils/product";

export const AppContext = createContext();

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within AppProvider");
  return context;
};

function mapCartItem(item) {
  const p = item?.product;
  if (!p?._id) return null;
  const rawImages = p.productImages || p.images || p.image || [];
  const imgs = Array.isArray(rawImages) ? rawImages : [rawImages].filter(Boolean);
  const firstImg = imgs[0] || "";
  const imgUrl = getImageUrl(firstImg);
  return {
    _id: p._id,
    name: p.productName || "",
    price: Number(p.finalSellingPrice ?? p.sellingPrice ?? 0),
    image: imgUrl,
    qty: item.quantity ?? 1,
    minOrderQty: p.minOrderQty != null ? Number(p.minOrderQty) : undefined,
  };
}

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [cartLoading, setCartLoading] = useState(false);
  const [wishlistItems, setWishlistItems] = useState([]);

  // SUPPORT STATES (Moved inside the component)
  const [supportTickets, setSupportTickets] = useState([]);
  const [activeTicket, setActiveTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [supportLoading, setSupportLoading] = useState(false);
  const pollingRef = useRef(null);

  // Load user/token from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const t = localStorage.getItem("token");
    const u = localStorage.getItem("user");
    if (t) setToken(t);
    if (u) try { setUser(JSON.parse(u)); } catch (e) { }
  }, []);

  const login = useCallback((authToken, userData) => {
    setToken(authToken);
    setUser(userData);
    if (typeof window !== "undefined") {
      localStorage.setItem("token", authToken);
      localStorage.setItem("user", JSON.stringify(userData));
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setCartItems([]);
    setSupportTickets([]); // Reset support on logout
    setActiveTicket(null);
    setMessages([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) return;
    try {
      const freshUser = await api.getMe();
      setUser(freshUser);
      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(freshUser));
      }
    } catch (err) {
      console.warn("Failed to refresh user:", err);
    }
  }, [token]);

  const refreshCart = useCallback(async () => {
    if (!token) {
      setCartItems([]);
      return;
    }
    try {
      const res = await api.getCart();
      const raw = res?.items ?? [];
      const mapped = raw.map((i) => mapCartItem(i)).filter(Boolean);
      setCartItems(mapped);
    } catch {
      setCartItems([]);
    }
  }, [token]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addToCart = useCallback(async (productId, quantity = 1) => {
    if (!token) return;
    setCartLoading(true);
    try {
      await api.addToCart(productId, quantity);
      await refreshCart();
    } finally {
      setCartLoading(false);
    }
  }, [token, refreshCart]);

  const updateCartQty = useCallback(async (productId, quantity) => {
    if (!token) return;
    setCartLoading(true);
    try {
      if (quantity <= 0) await api.removeFromCart(productId);
      else await api.updateCartQty(productId, quantity);
      await refreshCart();
    } finally {
      setCartLoading(false);
    }
  }, [token, refreshCart]);

  const removeFromCart = useCallback(async (productId) => {
    if (!token) return;
    setCartLoading(true);
    try {
      await api.removeFromCart(productId);
      await refreshCart();
    } finally {
      setCartLoading(false);
    }
  }, [token, refreshCart]);

  const toggleWishlist = useCallback((item) => {
    setWishlistItems((prev) => {
      const exists = prev.find((p) => p._id === item._id);
      if (exists) return prev.filter((p) => p._id !== item._id);
      return [...prev, { _id: item._id, name: item.name, price: item.price, image: item.image, unit: item.unit || "1 unit" }];
    });
  }, []);

  const isInWishlist = useCallback((id) => wishlistItems.some((p) => p._id === id), [wishlistItems]);

  const getProductImageUrl = (path) => getImageUrl(path);
  const getBrandImageUrl = (path) => getImageUrl(path);

  // --- SUPPORT ACTIONS ---

  const fetchSupportTickets = useCallback(async () => {
    if (!token) return;
    try {
      const res = await api.getMySupportTickets();
      setSupportTickets(res?.data || res || []);
    } catch (err) {
      console.error("Error fetching tickets:", err);
    }
  }, [token]);

  const loadTicketChat = useCallback(async (ticketId) => {
    if (!token) return;
    setSupportLoading(true);
    try {
      const res = await api.getSupportTicketById(ticketId);
      const data = res?.data || res;
      setMessages(data?.messages || []);
      setActiveTicket(data?.ticket || data);
    } catch (err) {
      console.error("Error loading chat:", err);
    } finally {
      setSupportLoading(false);
    }
  }, [token]);

  const sendSupportMsg = useCallback(async (text, category = "OTHER", extra = {}) => {
    if (!token || !text.trim()) return;
    try {
      if (!activeTicket || activeTicket.status === "CLOSED") {
        const res = await api.createSupportTicket({
          message: text,
          category,
          contactName: extra.contactName,
          contactPhone: extra.contactPhone,
          contactEmail: extra.contactEmail,
          problemType: extra.problemType || category,
          attachment: extra.attachment,
        });
        const newTicket = res?.data || res;
        setActiveTicket(newTicket);
        setMessages([]);
        fetchSupportTickets();
      } else {
        const res = await api.sendSupportMessage(activeTicket._id, text, extra.attachment);
        const newMsg = res?.data || res;
        setMessages((prev) => [...prev, newMsg]);
        fetchSupportTickets();
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      throw err;
    }
  }, [token, activeTicket, fetchSupportTickets]);

  // POLLING LOGIC (Syncs with your mobile 4s interval)
  useEffect(() => {
    if (activeTicket?._id && token) {
      pollingRef.current = setInterval(async () => {
        try {
          const res = await api.getSupportTicketById(activeTicket._id);
          const data = res?.data || res;
          const serverMsgs = data?.messages || [];

          setMessages((prev) => {
            const existingIds = new Set(prev.map(m => m._id));
            const newMsgs = serverMsgs.filter(m => !existingIds.has(m._id));
            if (newMsgs.length === 0) return prev;
            const merged = [...prev, ...newMsgs].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            return merged;
          });
        } catch (e) { }
      }, 4000);
    }
    return () => clearInterval(pollingRef.current);
  }, [activeTicket?._id, token]);

  return (
    <AppContext.Provider
      value={{
        // Auth & Identity
        user, token, login, logout, refreshUser,
        sendOtp: api.sendOtp,
        verifyOtp: api.verifyOtp,
        loginWithPassword: api.loginWithPassword,
        sendPasswordResetOtp: api.sendPasswordResetOtp,
        verifyPasswordResetOtp: api.verifyPasswordResetOtp,
        completePasswordReset: api.completePasswordReset,
        completeRegistration: api.completeRegistration,

        // Support System
        supportTickets, activeTicket, messages, supportLoading,
        fetchSupportTickets, loadTicketChat, sendSupportMsg,
        setActiveTicket, setMessages,

        // Products & Media
        getCategories: api.getCategories,
        getProducts: api.getProducts,
        getProductById: api.getProductById,
        getBrands: api.getBrands,
        getImageUrl, getProductImageUrl, getBrandImageUrl,

        // Cart & Wishlist
        cartItems, cartLoading, addToCart, updateCartQty,
        removeFromCart, refreshCart, wishlistItems, toggleWishlist, isInWishlist,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};