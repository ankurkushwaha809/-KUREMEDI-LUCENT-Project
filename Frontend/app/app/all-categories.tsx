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
import { getCategories } from "@/src/api";
import { normalizeCategories, type AppCategory } from "@/src/utils/category";
import { SkeletonCategoryGrid } from "@/src/components/Skeleton";

const CARD_BGS = [
  "bg-pink-50",
  "bg-amber-50",
  "bg-yellow-50",
  "bg-emerald-50",
  "bg-sky-50",
  "bg-violet-50",
  "bg-gray-50",
];

export default function AllCategories() {
  const insets = useSafeAreaInsets();
  const [categories, setCategories] = useState<AppCategory[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getCategories()
      .then((data: unknown) => setCategories(normalizeCategories(data)))
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = search.trim()
    ? categories.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase())
      )
    : categories;

  return (
    <View style={{ paddingTop: insets.top }} className="flex-1 bg-[#f8faf8]">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <Pressable onPress={() => router.back()} hitSlop={12} className="p-1">
          <Ionicons name="chevron-back" size={28} color="#111" />
        </Pressable>
        <Text className="text-xl font-bold text-black">All Categories</Text>
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
      <View className="px-4 py-3 bg-white">
        <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-2.5">
          <Ionicons name="search" size={20} color="#6b7280" />
          <TextInput
            placeholder="Search categories..."
            placeholderTextColor="#9ca3af"
            value={search}
            onChangeText={setSearch}
            className="flex-1 text-base p-0 ml-3"
          />
        </View>
      </View>

      {/* Category list */}
      {loading ? (
        <View style={{ padding: 16, paddingBottom: insets.bottom + 24 }}>
          <SkeletonCategoryGrid count={12} />
        </View>
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
                  pathname: "/category/[name]",
                  params: { name: item.name },
                })
              }
              className={`flex-row items-center rounded-2xl p-4 mb-3 ${bg} border border-gray-100 shadow-sm`}
              style={{ elevation: 2 }}
            >
              {/* Image - wider area like reference */}
              <View className="w-20 h-20 rounded-xl bg-white overflow-hidden mr-4">
                {item.image ? (
                  <Image
                    source={{ uri: item.image }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="w-full h-full items-center justify-center">
                    <Ionicons name={item.icon} size={32} color="#0d9488" />
                  </View>
                )}
              </View>

              {/* Title + description */}
              <View className="flex-1">
                <Text className="text-lg font-bold text-black">
                  {item.name}
                </Text>
                <Text
                  numberOfLines={1}
                  className="text-sm text-gray-500 mt-1"
                >
                  {item.description || "Browse products"}
                </Text>
              </View>

              {/* View button - circular green chevron */}
              <View className="w-10 h-10 rounded-full bg-teal-600 items-center justify-center">
                <Ionicons name="chevron-forward" size={20} color="#fff" />
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View className="py-16 items-center">
            <Ionicons name="folder-open-outline" size={48} color="#d1d5db" />
            <Text className="mt-3 text-gray-500">No categories found</Text>
          </View>
        }
      />
      )}
    </View>
  );
}
