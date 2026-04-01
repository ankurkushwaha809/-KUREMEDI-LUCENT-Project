import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getBrands } from "@/src/api";
import { normalizeBrands, type AppBrand } from "@/src/utils/brand";
import { SkeletonList } from "@/src/components/Skeleton";

const CARD_BGS = [
  "bg-pink-100/60",
  "bg-amber-100/60",
  "bg-yellow-100/60",
  "bg-emerald-100/60",
  "bg-sky-100/60",
  "bg-violet-100/60",
  "bg-rose-100/60",
];

export default function AllBrands() {
  const insets = useSafeAreaInsets();
  const [brands, setBrands] = useState<AppBrand[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getBrands()
      .then((data: unknown) => setBrands(normalizeBrands(data)))
      .catch(() => setBrands([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = search.trim()
    ? brands.filter((b) => b.name.toLowerCase().includes(search.toLowerCase()))
    : brands.filter((b) => b.isActive);

  return (
    <View style={{ paddingTop: insets.top }} className="flex-1 bg-[#f8faf8]">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <Pressable onPress={() => router.back()} hitSlop={12} className="p-1">
          <Ionicons name="chevron-back" size={28} color="#111" />
        </Pressable>
        <Text className="text-xl font-bold text-black">All Brands</Text>
        <View className="flex-row items-center gap-3">
          <Pressable onPress={() => {}}>
            <Ionicons name="search-outline" size={22} color="#111" />
          </Pressable>
          <Pressable onPress={() => router.push("/(tabs)/cart")}>
            <Ionicons name="cart-outline" size={22} color="#111" />
          </Pressable>
        </View>
      </View>

      {/* Search */}
      <View className="px-4 py-3 bg-white border-b border-gray-100">
        <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-2.5">
          <Ionicons name="search" size={20} color="#6b7280" />
          <TextInput
            placeholder="Search brands..."
            placeholderTextColor="#9ca3af"
            value={search}
            onChangeText={setSearch}
            className="flex-1 text-base p-0 ml-3"
          />
        </View>
      </View>

      {/* Brand list */}
      {loading ? (
        <SkeletonList count={8} hasImage />
      ) : (
      <FlatList
        data={filtered}
        keyExtractor={(i) => i._id}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 24,
        }}
        renderItem={({ item, index }) => {
          const bg = CARD_BGS[index % CARD_BGS.length];
          return (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/brand/[name]",
                  params: { name: item.name },
                })
              }
              className={`flex-row items-center rounded-2xl p-4 mb-3 ${bg} border border-gray-100`}
            >
              {/* Logo */}
              <View className="w-16 h-16 rounded-xl bg-white overflow-hidden mr-4">
                {item.logo ? (
                  <Image
                    source={{ uri: item.logo }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="w-full h-full items-center justify-center">
                    <Ionicons
                      name="pricetag-outline"
                      size={28}
                      color="#d97706"
                    />
                  </View>
                )}
              </View>

              {/* Name + description */}
              <View className="flex-1">
                <Text className="text-base font-bold text-black">
                  {item.name}
                </Text>
                <Text
                  numberOfLines={1}
                  className="text-sm text-gray-500 mt-0.5"
                >
                  {item.description || "View products"}
                </Text>
              </View>

              {/* View button */}
              <View className="w-10 h-10 rounded-full bg-teal-600 items-center justify-center">
                <Ionicons name="chevron-forward" size={20} color="#fff" />
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View className="py-16 items-center">
            <Ionicons name="pricetag-outline" size={48} color="#d1d5db" />
            <Text className="mt-3 text-gray-500">No brands found</Text>
          </View>
        }
      />
      )}
    </View>
  );
}
