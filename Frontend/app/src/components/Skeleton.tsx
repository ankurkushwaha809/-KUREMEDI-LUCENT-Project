import React, { useEffect, useRef } from "react";
import { Animated, View, StyleSheet, Dimensions } from "react-native";

const { width } = Dimensions.get("window");
const BANNER_WIDTH = width - 32;
const CARD_WIDTH = width / 2.5;

function usePulse(duration = 1200) {
  const anim = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 0.7,
          duration: duration / 2,
          useNativeDriver: false,
        }),
        Animated.timing(anim, {
          toValue: 0.4,
          duration: duration / 2,
          useNativeDriver: false,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim, duration]);
  return anim;
}

export function SkeletonBox({
  width: w,
  height: h = 16,
  style,
  borderRadius = 8,
}: {
  width?: number | string;
  height?: number;
  style?: object;
  borderRadius?: number;
}) {
  const opacity = usePulse();
  return (
    <Animated.View
      style={[
        styles.box,
        {
          width: w ?? "100%",
          height: h,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function SkeletonCircle({ size = 64 }: { size?: number }) {
  const opacity = usePulse();
  return (
    <Animated.View
      style={[
        styles.box,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          opacity,
        },
      ]}
    />
  );
}

export function SkeletonBanner({ height = 120, width: w = BANNER_WIDTH }: { height?: number; width?: number }) {
  const opacity = usePulse();
  return (
    <Animated.View
      style={[
        styles.box,
        {
          width: w,
          height,
          borderRadius: 16,
          opacity,
        },
      ]}
    />
  );
}

export function SkeletonProductCard() {
  const opacity = usePulse();
  return (
    <Animated.View
      style={[
        styles.card,
        {
          width: CARD_WIDTH,
          opacity,
        },
      ]}
    >
      <View style={[styles.box, { height: 110, borderRadius: 16, marginBottom: 8 }]} />
      <View style={[styles.box, { height: 14, width: "40%", marginBottom: 4 }]} />
      <View style={[styles.box, { height: 12, width: "80%" }]} />
    </Animated.View>
  );
}

export function SkeletonProductRow({ count = 4 }: { count?: number }) {
  return (
    <View style={styles.row}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={{ marginRight: 12 }}>
          <SkeletonProductCard />
        </View>
      ))}
    </View>
  );
}

export function SkeletonCategoryGrid({ count = 8 }: { count?: number }) {
  return (
    <View style={styles.categoryWrap}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.categoryItem}>
          <SkeletonCircle size={64} />
          <SkeletonBox width={48} height={10} style={{ marginTop: 8 }} />
        </View>
      ))}
    </View>
  );
}

export function SkeletonBrandGrid({ count = 8 }: { count?: number }) {
  return (
    <View style={styles.categoryWrap}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.categoryItem}>
          <SkeletonCircle size={64} />
          <SkeletonBox width={56} height={10} style={{ marginTop: 8 }} />
        </View>
      ))}
    </View>
  );
}

export function SkeletonListCard({ hasImage = true }: { hasImage?: boolean }) {
  const opacity = usePulse();
  return (
    <Animated.View style={[styles.listCard, { opacity }]}>
      {hasImage && <View style={[styles.box, { width: 64, height: 64, borderRadius: 12, marginRight: 12 }]} />}
      <View style={{ flex: 1 }}>
        <View style={[styles.box, { height: 14, width: "70%", marginBottom: 6 }]} />
        <View style={[styles.box, { height: 12, width: "50%" }]} />
      </View>
    </Animated.View>
  );
}

export function SkeletonList({ count = 6, hasImage = true }: { count?: number; hasImage?: boolean }) {
  return (
    <View style={{ padding: 16 }}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={{ marginBottom: 12 }}>
          <SkeletonListCard hasImage={hasImage} />
        </View>
      ))}
    </View>
  );
}

export function SkeletonProductDetail() {
  const opacity = usePulse();
  const imgW = width;
  return (
    <Animated.View style={{ flex: 1, opacity }}>
      <View style={[styles.box, { width: imgW, height: imgW * 0.8, borderRadius: 0 }]} />
      <View style={{ padding: 16 }}>
        <View style={[styles.box, { height: 22, width: "80%", marginBottom: 8 }]} />
        <View style={[styles.box, { height: 18, width: "40%", marginBottom: 16 }]} />
        <View style={[styles.box, { height: 14, width: "100%", marginBottom: 6 }]} />
        <View style={[styles.box, { height: 14, width: "90%", marginBottom: 6 }]} />
        <View style={[styles.box, { height: 14, width: "70%" }]} />
      </View>
    </Animated.View>
  );
}

export function SkeletonProductGrid({ count = 6 }: { count?: number }) {
  return (
    <View style={styles.grid}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.gridItem}>
          <View style={[styles.box, { height: 100, borderRadius: 12, marginBottom: 8 }]} />
          <View style={[styles.box, { height: 12, width: "50%", marginBottom: 4 }]} />
          <View style={[styles.box, { height: 10, width: "80%" }]} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: "#e5e7eb",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  row: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  categoryWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  categoryItem: {
    width: "22%",
    alignItems: "center",
    marginBottom: 16,
  },
  listCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 16,
    justifyContent: "space-between",
  },
  gridItem: {
    width: "48%",
    marginBottom: 12,
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
});
