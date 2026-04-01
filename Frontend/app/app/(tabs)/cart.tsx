import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useRef, useState } from "react";
import { Alert, FlatList, Image, Pressable, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../src/context/AuthContext";
import { useCart } from "../../src/context/CartContext";
import type { CartItem } from "../../src/context/CartContext";
import { SkeletonList } from "../../src/components/Skeleton";
import { showToast } from "../../src/utils/toast";

export default function Cart() {
  const insets = useSafeAreaInsets();
  const [editingQtyId, setEditingQtyId] = useState<string | null>(null);
  const [editingQtyVal, setEditingQtyVal] = useState("");
  const editingQtyValRef = useRef("");

  const { items, updateItemQty, removeItem, loading } = useCart();
  const { isAuthenticated, user } = useAuth();

  const total = items.reduce((s, i) => s + i.price * i.qty, 0);

  const handleCheckout = () => {
    if (!isAuthenticated) {
      Alert.alert("Login Required", "Please login to checkout.", [
        { text: "Cancel", style: "cancel" },
        { text: "Login", onPress: () => router.push("/login") },
      ]);
      return;
    }
    if (user?.kyc !== "APPROVED") {
      router.replace("/kyc?redirect=checkout");
      return;
    }
    if (items.length === 0) {
      showToast("Please add items to your cart.", "info", "Empty Cart");
      return;
    }
    router.push("/checkout");
  };

  const handleDecrease = (item: CartItem) => {
    if (editingQtyId === item._id) setEditingQtyId(null);
    const minQty = item.minOrderQty ?? 1;
    const newQty = item.qty <= minQty ? 0 : item.qty - 1;
    updateItemQty(item._id, newQty);
  };

  const handleAdd = (item: CartItem) => {
    if (user?.kyc !== "APPROVED") {
      Alert.alert("KYC Required", "Complete KYC to modify cart.", [
        { text: "OK", onPress: () => router.push("/kyc") },
      ]);
      return;
    }
    if (editingQtyId === item._id) setEditingQtyId(null);
    updateItemQty(item._id, item.qty + 1);
  };

  const handleQtyFocus = (item: CartItem) => {
    const val = String(item.qty);
    setEditingQtyId(item._id);
    setEditingQtyVal(val);
    editingQtyValRef.current = val;
  };

  const handleQtyBlur = (item: CartItem) => {
    setEditingQtyId(null);
    const text = editingQtyValRef.current;
    const n = parseInt(text.replace(/\D/g, ""), 10);
    if (isNaN(n) || n < 0) {
      updateItemQty(item._id, 0);
      return;
    }
    const minQty = item.minOrderQty ?? 1;
    const clamped = n === 0 ? 0 : Math.min(9999, Math.max(minQty, n));
    updateItemQty(item._id, clamped);
  };

  return (
    <View
      style={{ paddingTop: insets.top + 16 }}
      className="flex-1 bg-[#f8faf8]"
    >
      <View className="px-4 mb-4">
        <Text className="text-2xl font-bold text-black">My Cart</Text>
        {items.length > 0 && (
          <Text className="text-sm text-gray-500 mt-1">
            {items.length} item{items.length !== 1 ? "s" : ""}
          </Text>
        )}
      </View>

      {loading && items.length === 0 ? (
        <SkeletonList count={4} hasImage />
      ) : items.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-24 h-24 rounded-full bg-teal-50 items-center justify-center">
            <Ionicons name="cart-outline" size={48} color="#0d9488" />
          </View>
          <Text className="mt-4 text-lg font-semibold text-gray-700">
            Cart is empty
          </Text>
          <Text className="mt-1 text-sm text-gray-500 text-center">
            Add items from the store to get started
          </Text>
          <Pressable
            onPress={() => router.replace("/(tabs)")}
            style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
            className="mt-6 bg-teal-600 px-6 py-3 rounded-xl"
          >
            <Text className="text-white font-semibold">Browse Products</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <FlatList
            data={items}
            keyExtractor={(i) => i._id}
            showsVerticalScrollIndicator={false}
            className="flex-1"
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
            renderItem={({ item }) => (
              <View className="flex-row items-center bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100">
                <Image
                  source={{ uri: item.image }}
                  className="w-20 h-20 rounded-xl bg-gray-100"
                  resizeMode="contain"
                />

                <View className="flex-1 ml-4">
                  <Text
                    className="text-base font-semibold text-black"
                    numberOfLines={2}
                  >
                    {item.name}
                  </Text>
                  <Text className="text-sm text-gray-500 mt-0.5">
                    ₹{item.price} each
                  </Text>
                  <Text className="text-base font-bold text-teal-600 mt-1">
                    ₹{item.price * item.qty}
                  </Text>
                </View>

                <View className="items-end">
                  <View className="flex-row items-center bg-teal-50 border border-teal-600 rounded-xl overflow-hidden">
                    <Pressable
                      onPress={() => handleDecrease(item)}
                      disabled={loading}
                      style={({ pressed }) => [
                        { opacity: loading ? 0.5 : pressed ? 0.8 : 1 },
                      ]}
                      className="px-3 py-2"
                    >
                      <Ionicons name="remove" size={18} color="#0d9488" />
                    </Pressable>

                    <TextInput
                      value={
                        editingQtyId === item._id
                          ? editingQtyVal
                          : String(item.qty)
                      }
                      onChangeText={(t) => {
                        const v = t.replace(/\D/g, "").slice(0, 4);
                        editingQtyValRef.current = v;
                        setEditingQtyVal(v);
                      }}
                      onFocus={() => handleQtyFocus(item)}
                      onBlur={() => handleQtyBlur(item)}
                      keyboardType="number-pad"
                      selectTextOnFocus
                      className="text-teal-700 text-sm font-bold text-center min-w-[40px] py-2 px-0"
                      maxLength={4}
                    />

                    <Pressable
                      onPress={() => handleAdd(item)}
                      disabled={loading}
                      style={({ pressed }) => [
                        { opacity: loading ? 0.5 : pressed ? 0.8 : 1 },
                      ]}
                      className="px-3 py-2"
                    >
                      <Ionicons name="add" size={18} color="#0d9488" />
                    </Pressable>
                  </View>

                  <Pressable
                    onPress={() => removeItem(item._id)}
                    disabled={loading}
                    style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
                    className="flex-row items-center mt-2"
                  >
                    <Ionicons name="trash-outline" size={14} color="#dc2626" />
                    <Text className="ml-1 text-xs font-medium text-red-600">
                      Remove
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}
          />
          
          <View
            style={{ paddingBottom: 20 }}
            className="pt-4 border-t border-gray-200 bg-white px-4"
          >
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-black">Total</Text>
              <Text className="text-2xl font-extrabold text-teal-600">
                ₹{total}
              </Text>
            </View>

            <Pressable
              onPress={handleCheckout}
              disabled={loading || items.length === 0}
              style={({ pressed }) => [
                {
                  opacity:
                    loading || items.length === 0 ? 0.7 : pressed ? 0.9 : 1,
                },
              ]}
              className="flex-row items-center justify-between px-5 py-4 rounded-2xl bg-teal-600 shadow-lg"
            >
              <Text className="text-lg font-bold text-white">
                {loading ? "Loading..." : "Proceed to Checkout"}
              </Text>
              {!loading && items.length > 0 && (
                <Ionicons name="chevron-forward" size={22} color="#fff" />
              )}
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}
