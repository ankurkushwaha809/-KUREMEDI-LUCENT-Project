import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getProducts } from "../src/api";
import { normalizeProducts, type AppProduct } from "../src/utils/product";
import { SkeletonList } from "../src/components/Skeleton";

function getSuggestionFromName(name: string): string {
  if (!name || typeof name !== "string") return "";
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 2) return name.trim();
  return parts.slice(0, 2).join(" ");
}

function getPackSubtitle(p: AppProduct): string {
  const packing = p?.packing || "";
  const unit = p?.unit || "";
  if (packing) return packing;
  if (unit && unit !== "1 unit") return unit;
  return "";
}

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<AppProduct[]>([]);
  const [loading, setLoading] = useState(false);

  const searchProducts = useCallback(async (q: string) => {
    if (!q.trim()) {
      setProducts([]);
      return;
    }
    setLoading(true);
    try {
      const data = await getProducts({ search: q.trim() });
      setProducts(normalizeProducts(data));
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      searchProducts(query);
    }, 400);
    return () => clearTimeout(t);
  }, [query, searchProducts]);

  const suggestions = useMemo(() => {
    const seen = new Set<string>();
    const arr: string[] = [];
    for (const p of products) {
      const s = getSuggestionFromName(p.name);
      if (s && !seen.has(s.toLowerCase())) {
        seen.add(s.toLowerCase());
        arr.push(s);
        if (arr.length >= 5) break;
      }
    }
    return arr;
  }, [products]);

  const handleSuggestionPress = (s: string) => {
    setQuery(s);
  };

  const handleProductPress = (p: AppProduct) => {
    router.push(`/product/${p._id}`);
  };

  const handleViewAll = () => {
    // Already showing all results; could navigate to a full results screen or scroll
    // For now, no-op - we show all results inline
  };

  return (
    <View
      className="flex-1 bg-[#f8faf8]"
      style={{ paddingTop: insets.top }}
    >
      {/* Search bar */}
      <View className="px-4 py-3 bg-white border-b border-gray-100">
        <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
          <Pressable onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </Pressable>
          <TextInput
            placeholder="Search medicines, health products..."
            placeholderTextColor="#9ca3af"
            value={query}
            onChangeText={setQuery}
            className="flex-1 text-base p-0"
            autoFocus
          />
          {query.length > 0 ? (
            <Pressable onPress={() => setQuery("")} className="ml-2">
              <Ionicons name="close-circle" size={22} color="#9ca3af" />
            </Pressable>
          ) : (
            <Ionicons name="search" size={20} color="#6b7280" style={{ marginLeft: 8 }} />
          )}
        </View>
      </View>

      {loading && query.trim() ? (
        <SkeletonList count={6} hasImage />
      ) : !query.trim() ? (
        <View className="flex-1 items-center justify-center py-20 px-8">
          <Ionicons name="search" size={48} color="#d1d5db" />
          <Text className="mt-3 text-center text-gray-500">
            Type to search for medicines and health products
          </Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        >
          {/* Suggestions */}
          {suggestions.length > 0 && (
            <View className="px-4 pt-4 pb-2">
              <Text className="text-sm text-gray-500 mb-3">
                Showing suggestions for{" "}
                <Text className="font-medium text-gray-700">{query}</Text>
              </Text>
              {suggestions.map((s, i) => (
                <Pressable
                  key={i}
                  onPress={() => handleSuggestionPress(s)}
                  className="flex-row items-center justify-between py-3 px-4 bg-white rounded-xl border border-gray-100 mb-2 active:bg-teal-50/50"
                >
                  <Text className="font-medium text-gray-900">{s}</Text>
                  <Ionicons name="search" size={18} color="#9ca3af" />
                </Pressable>
              ))}
            </View>
          )}

          {/* Product results */}
          <View className="px-4 pt-4 pb-4">
            {products.map((p) => (
              <Pressable
                key={p._id}
                onPress={() => handleProductPress(p)}
                className="flex-row items-center bg-white rounded-2xl border border-gray-100 p-4 mb-2 active:bg-gray-50"
              >
                <View className="w-14 h-14 rounded-xl bg-gray-100 items-center justify-center overflow-hidden">
                  <Image
                    source={{ uri: p.image || "https://placehold.co/56?text=No+Image" }}
                    className="w-12 h-12"
                    resizeMode="contain"
                  />
                </View>
                <View className="flex-1 ml-4 min-w-0">
                  <Text
                    numberOfLines={2}
                    className="font-semibold text-gray-900 capitalize"
                  >
                    {p.name}
                  </Text>
                  <Text className="text-sm text-gray-500 mt-0.5">
                    {getPackSubtitle(p) || p.unit || "—"}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </Pressable>
            ))}
          </View>

          {products.length === 0 && query.trim().length > 0 && (
            <View className="py-16 items-center">
              <Ionicons name="search-outline" size={48} color="#d1d5db" />
              <Text className="mt-3 text-gray-500">
                No products found for &quot;{query}&quot;
              </Text>
            </View>
          )}

          {products.length > 0 && (
            <View className="px-4 pb-8">
              <Pressable
                onPress={handleViewAll}
                className="border-2 border-teal-600 rounded-2xl py-4 items-center active:opacity-80"
              >
                <Text className="font-bold text-teal-700">View all results</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}
