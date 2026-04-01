import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import WebView from "react-native-webview";
import { useAuth } from "@/src/context/AuthContext";
import { useCart } from "@/src/context/CartContext";
import {
  getAddresses,
  createPaymentOrder,
  verifyPayment,
  addAddress,
  getWallet,
} from "@/src/api";

type AddressType = {
  _id: string;
  label?: string;
  shopName?: string;
  address: string;
  city: string;
  state?: string;
  pincode: string;
  phone: string;
  isDefault?: boolean;
};

export default function Checkout() {
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated } = useAuth();
  const { items, clearCart, loading: cartLoading } = useCart();

  const [addresses, setAddresses] = useState<AddressType[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<AddressType | null>(
    null,
  );
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [notes, setNotes] = useState("");
  const [placing, setPlacing] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [useWalletAmount, setUseWalletAmount] = useState(0);
  const [paymentWebView, setPaymentWebView] = useState<{
    keyId: string;
    razorpayOrderId: string;
    amount: number;
    orderId: string;
  } | null>(null);

  const [newAddr, setNewAddr] = useState({
    address: "",
    city: "",
    state: "",
    pincode: "",
    phone: user?.phone || "",
    shopName: "",
  });

  useEffect(() => {
    if (!isAuthenticated) return;
    getAddresses()
      .then((res) => {
        const data = (res as { data?: AddressType[] })?.data ?? [];
        setAddresses(data);
        const def = data.find((a) => a.isDefault) ?? data[0];
        setSelectedAddress(def ?? null);
      })
      .catch(() => setAddresses([]));
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    getWallet()
      .then((w) => setWalletBalance(w?.balance ?? 0))
      .catch(() => setWalletBalance(0));
  }, [isAuthenticated]);

  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  const maxWalletUse = Math.min(walletBalance, total);
  const razorpayAmount = Math.max(0, total - useWalletAmount);

  const handleAddAddress = async () => {
    if (
      !newAddr.address ||
      !newAddr.city ||
      !newAddr.pincode ||
      !newAddr.phone
    ) {
      Alert.alert("Required", "Please fill address, city, pincode and phone");
      return;
    }
    try {
      const res = await addAddress({
        address: newAddr.address,
        city: newAddr.city,
        state: newAddr.state,
        pincode: newAddr.pincode,
        phone: newAddr.phone,
        shopName: newAddr.shopName || undefined,
      });
      const added = (res as { address?: AddressType })?.address;
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
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to add address";
      Alert.alert("Error", msg);
    }
  };

  const shippingAddress = selectedAddress
    ? {
        shopName: selectedAddress.shopName || "",
        address:
          `${selectedAddress.address}, ${selectedAddress.city}, ${selectedAddress.state || ""} ${selectedAddress.pincode}`.trim(),
        phone: selectedAddress.phone,
      }
    : null;

  const getErrorMessage = (err: unknown): string => {
    const e = err as {
      response?: { data?: { message?: string; error?: string } };
      message?: string;
      code?: number;
    };
    const apiMsg = e?.response?.data?.message || e?.response?.data?.error;
    if (apiMsg) return String(apiMsg);
    if (e?.message) return String(e.message);
    return "Failed to place order";
  };

  const handlePaymentWebViewMessage = async (event: {
    nativeEvent: { data: string };
  }) => {
    try {
      const data = JSON.parse(event.nativeEvent.data) as {
        razorpay_payment_id?: string;
        razorpay_signature?: string;
        razorpay_order_id?: string;
        cancelled?: boolean;
        error?: string;
      };
      if (data.cancelled || data.error) {
        setPaymentWebView(null);
        setPlacing(false);
        if (data.error) Alert.alert("Payment Failed", data.error);
        return;
      }
      if (
        !paymentWebView ||
        !data.razorpay_payment_id ||
        !data.razorpay_signature
      )
        return;
      await verifyPayment({
        razorpayOrderId: paymentWebView.razorpayOrderId,
        razorpayPaymentId: data.razorpay_payment_id,
        razorpaySignature: data.razorpay_signature,
      });
      setPaymentWebView(null);
      setPlacing(false);
      Alert.alert("Success", "Payment successful! Order placed.");
      await clearCart();
      router.replace("/(tabs)");
    } catch (err) {
      setPaymentWebView(null);
      setPlacing(false);
      Alert.alert("Error", getErrorMessage(err));
    }
  };

  const handlePlaceOrder = async () => {
    if (!shippingAddress) {
      Alert.alert("Address", "Please select or add a shipping address");
      return;
    }
    if (items.length === 0) {
      Alert.alert("Cart", "Your cart is empty");
      return;
    }

    const walletToUse = Math.min(useWalletAmount, maxWalletUse);
    if (walletToUse > walletBalance) {
      Alert.alert("Wallet", "Insufficient wallet balance");
      return;
    }

    setPlacing(true);
    try {
      const res = (await createPaymentOrder({
        shippingAddress,
        notes,
        walletAmount: walletToUse,
      })) as {
        orderId?: string;
        razorpayOrderId?: string;
        amount?: number;
        keyId?: string;
        paidByWallet?: boolean;
        walletUsed?: number;
      };

      if (res.paidByWallet) {
        Alert.alert("Success", "Order placed successfully using wallet!");
        await clearCart();
        router.replace("/(tabs)");
        return;
      }

      if (!res.razorpayOrderId || !res.keyId) {
        Alert.alert(
          "Payment Error",
          "Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to backend .env",
        );
        setPlacing(false);
        return;
      }

      const amountInPaise = Math.round((res.amount ?? razorpayAmount) * 100);

      setPaymentWebView({
        keyId: res.keyId,
        razorpayOrderId: res.razorpayOrderId,
        amount: amountInPaise,
        orderId: res.orderId ?? "",
      });
    } catch (err: unknown) {
      Alert.alert("Error", getErrorMessage(err));
      setPlacing(false);
    }
  };

  if (!isAuthenticated) {
    router.replace("/login");
    return null;
  }

  if (user?.kyc !== "APPROVED") {
    router.replace("/kyc?redirect=checkout");
    return null;
  }

  if (items.length === 0 && !cartLoading) {
    return (
      <View
        style={{ paddingTop: insets.top }}
        className="flex-1 bg-[#f8faf8] items-center justify-center px-4"
      >
        <Ionicons name="cart-outline" size={64} color="#d1d5db" />
        <Text className="mt-2 text-gray-600">Cart is empty</Text>
        <Pressable
          onPress={() => router.back()}
          className="mt-4 bg-teal-600 px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-semibold">Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ paddingTop: insets.top }} className="flex-1 bg-[#f8faf8]">
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-200">
        <Pressable onPress={() => router.back()} hitSlop={12} className="p-1">
          <Ionicons name="chevron-back" size={28} color="#111" />
        </Pressable>
        <Text className="flex-1 text-lg font-semibold text-black text-center -ml-6">
          Checkout
        </Text>
        <View className="w-9" />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Address */}
        <View className="px-4 py-4 bg-white mt-2">
          <Text className="text-base font-bold text-black mb-3">
            Shipping Address
          </Text>
          {addresses.map((a) => (
            <Pressable
              key={a._id}
              onPress={() => setSelectedAddress(a)}
              className={`flex-row items-start p-3 rounded-xl border-2 mb-2 ${selectedAddress?._id === a._id ? "border-teal-600 bg-teal-50" : "border-gray-200"}`}
            >
              <Ionicons
                name="location"
                size={20}
                color="#0d9488"
                style={{ marginRight: 8, marginTop: 2 }}
              />
              <View className="flex-1">
                <Text className="font-semibold text-black">{a.address}</Text>
                <Text className="text-sm text-gray-500">
                  {a.city}, {a.state} {a.pincode}
                </Text>
                <Text className="text-sm text-gray-600">{a.phone}</Text>
              </View>
              {selectedAddress?._id === a._id && (
                <Ionicons name="checkmark-circle" size={24} color="#0d9488" />
              )}
            </Pressable>
          ))}
          {showAddAddress ? (
            <View className="border border-gray-200 rounded-xl p-4 mt-2">
              <TextInput
                placeholder="Address"
                value={newAddr.address}
                onChangeText={(t) => setNewAddr((p) => ({ ...p, address: t }))}
                className="bg-gray-100 rounded-lg px-3 py-2 mb-2"
              />
              <TextInput
                placeholder="City"
                value={newAddr.city}
                onChangeText={(t) => setNewAddr((p) => ({ ...p, city: t }))}
                className="bg-gray-100 rounded-lg px-3 py-2 mb-2"
              />
              <TextInput
                placeholder="Pincode"
                value={newAddr.pincode}
                onChangeText={(t) => setNewAddr((p) => ({ ...p, pincode: t }))}
                keyboardType="number-pad"
                className="bg-gray-100 rounded-lg px-3 py-2 mb-2"
              />
              <TextInput
                placeholder="Phone"
                value={newAddr.phone}
                onChangeText={(t) => setNewAddr((p) => ({ ...p, phone: t }))}
                keyboardType="phone-pad"
                className="bg-gray-100 rounded-lg px-3 py-2 mb-2"
              />
              <View className="flex-row gap-2">
                <Pressable
                  onPress={handleAddAddress}
                  className="flex-1 bg-teal-600 py-2 rounded-lg items-center"
                >
                  <Text className="text-white font-semibold">Save</Text>
                </Pressable>
                <Pressable
                  onPress={() => setShowAddAddress(false)}
                  className="flex-1 bg-gray-200 py-2 rounded-lg items-center"
                >
                  <Text className="text-gray-700 font-semibold">Cancel</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable
              onPress={() => setShowAddAddress(true)}
              className="flex-row items-center p-3 rounded-xl border-2 border-dashed border-gray-300 mt-2"
            >
              <Ionicons name="add-circle-outline" size={24} color="#6b7280" />
              <Text className="ml-2 text-gray-600 font-medium">
                Add new address
              </Text>
            </Pressable>
          )}
        </View>

        {/* Payment method: Wallet + Razorpay */}
        <View className="px-4 py-4 bg-white mt-2">
          <Text className="text-base font-bold text-black mb-3">
            Payment Method
          </Text>

          {/* Wallet balance & use option */}
          <View className="flex-row items-center justify-between p-3 rounded-xl border-2 border-gray-200 mb-3">
            <View className="flex-row items-center">
              <Ionicons name="wallet-outline" size={24} color="#0d9488" />
              <View className="ml-3">
                <Text className="font-medium text-black">Wallet Balance</Text>
                <Text className="text-teal-600 font-bold">₹{walletBalance.toFixed(2)}</Text>
              </View>
            </View>
            {maxWalletUse > 0 && (
              <View className="flex-row items-center gap-2">
                <Pressable
                  onPress={() => setUseWalletAmount(useWalletAmount === maxWalletUse ? 0 : maxWalletUse)}
                  className={`px-3 py-1.5 rounded-lg ${useWalletAmount === maxWalletUse ? "bg-teal-600" : "bg-gray-200"}`}
                >
                  <Text className={useWalletAmount === maxWalletUse ? "text-white font-semibold" : "text-gray-700"}>
                    Use ₹{maxWalletUse}
                  </Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* Payment breakdown */}
          {useWalletAmount > 0 && (
            <View className="bg-teal-50 rounded-xl p-3 mb-3 border border-teal-200">
              <Text className="text-sm font-semibold text-teal-800 mb-2">Payment split</Text>
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Wallet</Text>
                <Text className="font-medium">₹{useWalletAmount.toFixed(2)}</Text>
              </View>
              {razorpayAmount > 0 && (
                <View className="flex-row justify-between mt-1">
                  <Text className="text-gray-600">Razorpay (Card/UPI)</Text>
                  <Text className="font-medium">₹{razorpayAmount.toFixed(2)}</Text>
                </View>
              )}
            </View>
          )}

          {/* Razorpay option (always shown when remainder > 0 or no wallet) */}
          {(razorpayAmount > 0 || useWalletAmount === 0) && (
            <View
              className={`flex-row items-center p-4 rounded-xl border-2 ${useWalletAmount > 0 ? "border-gray-200" : "border-teal-600 bg-teal-50"}`}
            >
              <Ionicons name="card-outline" size={24} color="#0d9488" />
              <Text className="ml-3 font-medium text-black">
                {razorpayAmount > 0
                  ? `Pay ₹${razorpayAmount.toFixed(2)} via Razorpay (Card / UPI / Net Banking)`
                  : "Pay via Razorpay (Card / UPI / Net Banking)"}
              </Text>
            </View>
          )}
        </View>

        {/* Notes */}
        <View className="px-4 py-4 bg-white mt-2">
          <Text className="text-base font-bold text-black mb-3">
            Notes (optional)
          </Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Any delivery instructions?"
            className="bg-gray-100 rounded-xl px-4 py-3"
            multiline
            numberOfLines={2}
          />
        </View>

        {/* Order summary */}
        <View className="px-4 py-4 bg-white mt-2">
          <Text className="text-base font-bold text-black mb-3">
            Order Summary
          </Text>
          {items.map((i) => (
            <View key={i._id} className="flex-row items-center mb-3">
              <Image
                source={{ uri: i.image }}
                className="w-12 h-12 rounded-lg bg-gray-100"
              />
              <View className="flex-1 ml-3">
                <Text numberOfLines={1} className="font-medium text-black">
                  {i.name}
                </Text>
                <Text className="text-sm text-gray-500">
                  ₹{i.price} x {i.qty}
                </Text>
              </View>
              <Text className="font-bold text-teal-600">
                ₹{i.price * i.qty}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Razorpay WebView modal (works in Expo Go) */}
      <Modal
        visible={!!paymentWebView}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setPaymentWebView(null);
          setPlacing(false);
        }}
      >
        <View className="flex-1 bg-black/50">
          <View className="flex-1 mt-12 bg-white rounded-t-2xl overflow-hidden">
            <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
              <Text className="text-lg font-semibold text-black">
                Complete Payment
              </Text>
              <Pressable
                onPress={() => {
                  setPaymentWebView(null);
                  setPlacing(false);
                }}
                className="p-2"
              >
                <Ionicons name="close" size={24} color="#374151" />
              </Pressable>
            </View>
            {paymentWebView && (
              <WebView
                source={{
                  html: `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:16px;font-family:system-ui">
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
<script>
(function(){
  var key="${paymentWebView.keyId.replace(/"/g, '\\"')}";
  var amount=${paymentWebView.amount};
  var orderId="${paymentWebView.razorpayOrderId.replace(/"/g, '\\"')}";
  var opts={
    key:key,
    amount:amount,
    currency:"INR",
    order_id:orderId,
    name:"Kuremedi",
    description:"Order payment",
    handler:function(response){
      if(window.ReactNativeWebView){
        window.ReactNativeWebView.postMessage(JSON.stringify({
          razorpay_payment_id:response.razorpay_payment_id,
          razorpay_signature:response.razorpay_signature,
          razorpay_order_id:response.razorpay_order_id
        }));
      }
    },
    modal:{ondismiss:function(){
      if(window.ReactNativeWebView){
        window.ReactNativeWebView.postMessage(JSON.stringify({cancelled:true}));
      }
    }}
  };
  var rzp=new Razorpay(opts);
  rzp.open();
})();
</script>
<p style="color:#115E59;text-align:center">Razorpay checkout will open above. Complete payment to continue.</p>
</body></html>`,
                }}
                onMessage={handlePaymentWebViewMessage}
                javaScriptEnabled
                domStorageEnabled
                originWhitelist={["*"]}
                style={{ flex: 1 }}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Footer */}
      <View
        style={{ paddingBottom: insets.bottom + 16 }}
        className="absolute left-0 right-0 bottom-0 px-4 pt-3 bg-white border-t border-gray-200"
      >
        <View className="flex-row justify-between mb-1">
          <Text className="text-gray-600">Total</Text>
          <Text className="font-bold text-black">₹{total.toFixed(2)}</Text>
        </View>
        {useWalletAmount > 0 && (
          <View className="flex-row justify-between mb-1">
            <Text className="text-gray-500 text-sm">− Wallet</Text>
            <Text className="text-teal-600 font-medium">₹{useWalletAmount.toFixed(2)}</Text>
          </View>
        )}
        {razorpayAmount > 0 && (
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-600 font-medium">Pay now</Text>
            <Text className="text-xl font-bold text-teal-600">₹{razorpayAmount.toFixed(2)}</Text>
          </View>
        )}
        {razorpayAmount === 0 && (
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-600 font-medium">Pay with wallet</Text>
            <Text className="text-xl font-bold text-teal-600">₹{total.toFixed(2)}</Text>
          </View>
        )}
        <Pressable
          onPress={handlePlaceOrder}
          disabled={placing || !shippingAddress}
          className="bg-teal-600 py-4 rounded-xl items-center"
        >
          {placing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-bold text-lg">Place Order</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
