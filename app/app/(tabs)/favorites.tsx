import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useRef, useState } from "react";
import { Alert, FlatList, Image, Pressable, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useWishlist } from "../../src/context/WishlistContext";
import { useCart } from "../../src/context/CartContext";
import { useAuth } from "../../src/context/AuthContext";
import type { WishlistItem } from "../../src/context/WishlistContext";
import { showToast } from "../../src/utils/toast";

export default function Favorites() {
  const insets = useSafeAreaInsets();
  const [editingQtyId, setEditingQtyId] = useState<string | null>(null);
  const [editingQtyVal, setEditingQtyVal] = useState("");
  const editingQtyValRef = useRef("");

  const { items, toggleWishlist, isInWishlist } = useWishlist();
  const { addItem, updateItemQty, items: cartItems } = useCart();
  const { user, isAuthenticated } = useAuth();

  const getQty = (id: string) => cartItems.find((i) => i._id === id)?.qty ?? 0;

  const handleAddToCart = async (item: WishlistItem) => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (user?.kyc !== "APPROVED") {
      Alert.alert("KYC Required", "Complete KYC to add to cart.", [
        { text: "Cancel", style: "cancel" },
        { text: "Complete KYC", onPress: () => router.push("/kyc") },
      ]);
      return;
    }
    try {
      await addItem(
        { _id: item._id, name: item.name, price: item.price, image: item.image },
        1
      );
      showToast("Added to cart");
    } catch {
      showToast("Could not add to cart.", "error");
    }
  };

  const handleDecrease = (item: WishlistItem) => {
    if (!isAuthenticated) return;
    if (editingQtyId === item._id) setEditingQtyId(null);
    const curr = getQty(item._id);
    const minQty = 1;
    const newQty = curr <= minQty ? 0 : curr - 1;
    updateItemQty(item._id, newQty);
  };

  const handleIncrease = (item: WishlistItem) => {
    if (!isAuthenticated) return;
    if (editingQtyId === item._id) setEditingQtyId(null);
    const curr = getQty(item._id);
    updateItemQty(item._id, Math.min(9999, curr + 1));
  };

  const handleQtyFocus = (item: WishlistItem) => {
    const val = String(getQty(item._id));
    setEditingQtyId(item._id);
    setEditingQtyVal(val);
    editingQtyValRef.current = val;
  };

  const handleQtyBlur = (item: WishlistItem) => {
    setEditingQtyId(null);
    const text = editingQtyValRef.current;
    const n = parseInt(text.replace(/\D/g, ""), 10);
    if (isNaN(n) || n < 0) {
      updateItemQty(item._id, 0);
      return;
    }
    const minQty = 1;
    const clamped = n === 0 ? 0 : Math.min(9999, Math.max(minQty, n));
    updateItemQty(item._id, clamped);
  };

  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0);

  return (
    <View style={{ paddingTop: insets.top }} className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
        <Pressable onPress={() => router.replace("/(tabs)")} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color="#111" />
        </Pressable>

        <Text className="text-xl font-extrabold text-pink-600">Wishlist</Text>

        <Pressable>
          <Ionicons name="search" size={22} color="#111" />
        </Pressable>
      </View>

      {items.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-24 h-24 rounded-full bg-pink-50 items-center justify-center">
            <Ionicons name="heart-outline" size={48} color="#ec4899" />
          </View>
          <Text className="mt-4 text-lg font-semibold text-gray-700">No wishlist items</Text>
          <Text className="mt-1 text-sm text-gray-500 text-center">Add products you like from the store</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i._id}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={{
            justifyContent: "space-between",
            paddingHorizontal: 12,
          }}
          contentContainerStyle={{
            paddingTop: 10,
            paddingBottom: insets.bottom + 2,
          }}
          renderItem={({ item }) => {
            const qty = getQty(item._id);

            return (
              <View className="w-[48%] mb-4 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Image card */}
                <View className="relative rounded-t-2xl overflow-hidden bg-gray-100">
                  <Pressable
                    onPress={() => router.push(`/product/${item._id}`)}
                  >
                    <Image
                      source={{ uri: item.image }}
                      className="w-full h-40"
                      resizeMode="cover"
                    />
                  </Pressable>

                  {/* heart */}
                  <Pressable
                    onPress={() => toggleWishlist(item)}
                    style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
                    className="absolute top-2 right-2 bg-white/95 rounded-full p-1.5 shadow"
                  >
                    <Ionicons
                      name={isInWishlist(item._id) ? "heart" : "heart-outline"}
                      size={18}
                      color="#ec4899"
                    />
                  </Pressable>

                  {/* ADD / qty */}
                  {qty === 0 ? (
                    <Pressable
                      onPress={() => handleAddToCart(item)}
                      style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
                      className="absolute bottom-2 right-2 bg-white border border-pink-600 rounded-xl px-5 py-2 shadow-sm"
                    >
                      <Text className="text-pink-600 text-xs font-bold">ADD</Text>
                    </Pressable>
                  ) : (
                    <View className="absolute bottom-2 right-2 flex-row items-center bg-pink-600 rounded-xl overflow-hidden shadow-md">
                      <Pressable
                        onPress={() => handleDecrease(item)}
                        style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }, { paddingHorizontal: 10, paddingVertical: 6 }]}
                        hitSlop={8}
                      >
                        <Ionicons name="remove" size={16} color="#fff" />
                      </Pressable>

                      <TextInput
                        value={editingQtyId === item._id ? editingQtyVal : String(qty)}
                        onChangeText={(t) => {
                          const v = t.replace(/\D/g, "").slice(0, 4);
                          editingQtyValRef.current = v;
                          setEditingQtyVal(v);
                        }}
                        onFocus={() => handleQtyFocus(item)}
                        onBlur={() => handleQtyBlur(item)}
                        keyboardType="number-pad"
                        selectTextOnFocus
                        className="text-white text-sm font-bold text-center min-w-[36px] py-1 px-0"
                        maxLength={4}
                      />

                      <Pressable
                        onPress={() => handleIncrease(item)}
                        style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }, { paddingHorizontal: 10, paddingVertical: 6 }]}
                        hitSlop={8}
                      >
                        <Ionicons name="add" size={16} color="#fff" />
                      </Pressable>
                    </View>
                  )}
                </View>

                <View className="p-3">
                  <Text className="text-green-700 font-bold text-base">
                    ₹{item.price}
                  </Text>
                  <Text
                    numberOfLines={2}
                    className="text-sm font-semibold text-black mt-1"
                  >
                    {item.name}
                  </Text>
                </View>
              </View>
            );
          }}
        />       
      )}

      {/* Bottom cart bar */}
      {cartCount > 0 && (
        <View
          style={{ paddingBottom: 20 }}
          className="absolute left-0 right-0 bottom-0 px-4"
        >
          <Pressable
            onPress={() => router.push("/(tabs)/cart")}
            style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
            className="flex-row items-center justify-between bg-pink-600 rounded-2xl px-5 py-4 shadow-lg"
          >
            <View className="flex-row items-center">
              <Ionicons name="cart-outline" size={22} color="#fff" />
              <Text className="ml-2 text-white font-bold text-base">View Cart</Text>
            </View>
            <View className="flex-row items-center bg-white/20 rounded-full px-3 py-1">
              <Text className="text-white font-semibold">{cartCount} items</Text>
            </View>
          </Pressable>
        </View>
      )}
    </View>
  );
}
