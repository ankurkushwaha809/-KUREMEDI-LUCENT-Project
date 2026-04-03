import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getProducts } from "../../src/api";
import { useAuth } from "../../src/context/AuthContext";
import { useCart } from "../../src/context/CartContext";
import { normalizeProducts, type AppProduct } from "../../src/utils/product";
import { SkeletonProductGrid } from "../../src/components/Skeleton";
import { showToast } from "../../src/utils/toast";

export default function BrandScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const insets = useSafeAreaInsets();

  const { addItem, updateItemQty, items } = useCart();
  const { isAuthenticated } = useAuth();

  const handleAddToCart = (item: AppProduct) => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    const qty = item.minOrderQty ?? 1;
    addItem(
      { _id: item._id, name: item.name, price: item.price, image: item.image },
      qty
    );
    showToast("Added to cart");
  };

  const handleDecrease = (item: AppProduct) => {
    if (!isAuthenticated) return;
    const curr = items.find((i) => i._id === item._id)?.qty ?? 0;
    const minQty = item.minOrderQty ?? 1;
    const newQty = curr <= minQty ? 0 : curr - 1;
    updateItemQty(item._id, newQty);
  };

  const handleIncrease = (item: AppProduct) => {
    if (!isAuthenticated) return;
    const curr = items.find((i) => i._id === item._id)?.qty ?? 0;
    const step = item.minOrderQty ?? 1;
    const max = item.stockQuantity ?? 9999;
    updateItemQty(item._id, Math.min(max, curr + step));
  };

  const [products, setProducts] = useState<AppProduct[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!name) {
      setProducts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    getProducts({ brand: name })
      .then((data) => setProducts(normalizeProducts(data)))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [name]);

  const getQty = (id: string) => items.find((i) => i._id === id)?.qty ?? 0;

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;

    return products.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [products, search]);

  const brandName = name || "Brand";

  return (
    <View style={{ paddingTop: insets.top }} className="flex-1 bg-[#f8faf8]">
      {/* Nav */}
      <View className="flex-row items-center justify-between px-2 py-3 bg-white border-b border-gray-200">
        <Pressable onPress={() => router.back()} hitSlop={12} className="p-1">
          <Ionicons name="chevron-back" size={28} color="#111" />
        </Pressable>

        <Text className="text-lg font-semibold text-black">Pharmacy</Text>

        <View className="w-9" />
      </View>

      {/* Search */}
      <View className="px-4 py-3 bg-white">
        <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
          <TextInput
            placeholder="Search..."
            placeholderTextColor="#9ca3af"
            value={search}
            onChangeText={setSearch}
            className="flex-1 text-base p-0"
          />
          <Ionicons name="search" size={20} color="#6b7280" />
          <Ionicons
            name="options-outline"
            size={20}
            color="#6b7280"
            style={{ marginLeft: 8 }}
          />
        </View>
      </View>

      {/* Brand title */}
      <Text className="text-[22px] font-bold text-black px-4 py-4 bg-white">
        {brandName}
      </Text>

      {/* Grid */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 24,
        }}
      >
        {loading ? (
          <SkeletonProductGrid count={9} />
        ) : (
        <View className="flex-row flex-wrap justify-between">
          {filteredProducts.map((item) => {
            const qty = getQty(item._id);

            return (
              <View
                key={item._id}
                className="w-[32%] bg-white rounded-2xl border border-gray-200  mb-3"
              >
                {/* Image */}
                <View className="relative">
                  <Pressable
                    onPress={() => router.push(`/product/${item._id}`)}
                  >
                    <View className="w-full h-[100px] rounded-xl bg-white/30 overflow-hidden">
                      <Image
                        source={{ uri: item.image }}
                        resizeMode="cover"
                        className="w-full h-full"
                      />
                    </View>
                  </Pressable>

                  {/* ADD / qty pill */}
                  {(item.stockQuantity ?? 1) <= 0 ? (
                    <View className="absolute bottom-2 right-2 bg-gray-400 px-3 py-1 rounded-lg">
                      <Text className="text-white text-xs font-bold">Out</Text>
                    </View>
                  ) : qty === 0 ? (
                    <Pressable
                      onPress={() => handleAddToCart(item)}
                      className="absolute bottom-2 right-2 bg-white border border-amber-600 px-3 py-1 rounded-lg"
                    >
                      <Text className="text-amber-600 text-xs font-bold">ADD</Text>
                    </Pressable>
                  ) : (
                    <View className="absolute bottom-2 right-2 flex-row items-center bg-amber-600 rounded-lg overflow-hidden">
                      <Pressable onPress={() => handleDecrease(item)} className="px-2 py-1">
                        <Ionicons name="remove" size={14} color="#fff" />
                      </Pressable>

                      <Text className="text-white text-xs font-bold px-2">{qty}</Text>

                      <Pressable
                        onPress={() => handleIncrease(item)}
                        disabled={qty >= (item.stockQuantity ?? 9999)}
                        className={`px-2 py-1 ${qty >= (item.stockQuantity ?? 9999) ? "opacity-50" : ""}`}
                      >
                        <Ionicons name="add" size={14} color="#fff" />
                      </Pressable>
                    </View>
                  )}
                </View>

                <Text
                  numberOfLines={1}
                  className="mt-2 ml-2 text-sm font-semibold text-black"
                >
                  {item.name}
                </Text>

                <Text className="mt-1 ml-2 text-sm font-bold text-black">
                  ₹{item.price}
                  {item.packing ? (
                    <Text className="text-gray-500 font-normal text-xs"> / {item.packing}</Text>
                  ) : null}
                </Text>
              </View>
            );
          })}

          {filteredProducts.length === 0 && (
            <View className="w-full items-center py-10">
              <Text className="text-gray-500">No products found</Text>
            </View>
          )}
        </View>
        )}
        <View className="h-[100px]" />
      </ScrollView>

      {/* Footer */}
      <View
        style={{ paddingBottom: insets.bottom + 16 }}
        className="absolute left-0 right-0 bottom-0 px-4 pt-3 bg-white border-t border-gray-200"
      >
        <Pressable
          onPress={() => router.push("/(tabs)/cart")}
          className="flex-row items-center justify-between bg-amber-600 px-5 py-4 rounded-2xl"
        >
          <Text className="text-lg font-bold text-white">My Cart</Text>

          <Text className="text-sm text-white/90 tracking-widest">
            &gt;&gt;&gt;&gt;
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
