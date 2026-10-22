// src/screens/ProductsScreen.tsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Theme ───────────────────────────────────────────────────────────────────
const colors = {
  primary: "#1F1310",
  primarySoft: "#2B1810",
  accent: "#C67C4E",
  accentSoft: "#E8B98A",
  accentDeep: "#8B5A34",
  background: "#FBF8F4",
  surface: "#FFFFFF",
  surfaceAlt: "#F6F1EB",
  text: "#1A1208",
  muted: "#8A7B6B",
  mutedLight: "#B8A99A",
  border: "#EFE6DA",
  borderStrong: "#E2D5C4",
  success: "#16A34A",
  successSoft: "#DCFCE7",
  warning: "#F59E0B",
  warningSoft: "#FEF3C7",
  danger: "#DC2626",
  dangerSoft: "#FEE2E2",
  shadow: "#1F1310",
};

const { width: SCREEN_W } = Dimensions.get("window");
const H_PADDING = 20;
const CARD_GAP = 14;
const CARD_WIDTH = (SCREEN_W - H_PADDING * 2 - CARD_GAP) / 2;

// ─── Types ───────────────────────────────────────────────────────────────────
import { Product } from "@/models/Product";

type StockStatus = "ok" | "low" | "out";
type FilterKey = "all" | "low" | "out" | "available";

// ─── API ─────────────────────────────────────────────────────────────────────
import { getProducts } from "@/services/product";
import { router } from "expo-router";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getStockStatus(p: Product): StockStatus {
  if (p.stock <= 0) return "out";
  if (p.stock <= p.minStock) return "low";
  return "ok";
}

function statusMeta(status: StockStatus) {
  switch (status) {
    case "out":
      return {
        label: "Rupture",
        fg: colors.danger,
        bg: colors.dangerSoft,
        dot: colors.danger,
      };
    case "low":
      return {
        label: "Stock bas",
        fg: colors.warning,
        bg: colors.warningSoft,
        dot: colors.warning,
      };
    default:
      return {
        label: "Disponible",
        fg: colors.success,
        bg: colors.successSoft,
        dot: colors.success,
      };
  }
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("fr-TN", {
    style: "currency",
    currency: "TND",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
}

// ─── Motion primitives ───────────────────────────────────────────────────────
function FadeSlideIn({
  children,
  delay = 0,
  translateY = 20,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  translateY?: number;
  style?: any;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 520,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [anim, delay]);
  return (
    <Animated.View
      style={[
        style,
        {
          opacity: anim,
          transform: [
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [translateY, 0],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

function PressableScale({
  children,
  style,
  onPress,
  activeScale = 0.94,
  disabled,
  ...rest
}: any) {
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn = () =>
    Animated.spring(scale, {
      toValue: activeScale,
      useNativeDriver: true,
      speed: 30,
      bounciness: 6,
    }).start();
  const onPressOut = () =>
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 22,
      bounciness: 8,
    }).start();
  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled}
        android_ripple={{ color: "rgba(0,0,0,0.04)" }}
        {...rest}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

// ─── Product Card (Grid) ─────────────────────────────────────────────────────
function ProductCard({
  item,
  onPress,
  index,
}: {
  item: Product;
  onPress: (id: number) => void;
  index: number;
}) {
  const status = getStockStatus(item);
  const meta = statusMeta(status);

  // Stagger: alternate columns for organic cascade
  const col = index % 2;
  const delay = Math.min(Math.floor(index / 2) * 70 + col * 35, 500);

  return (
    <FadeSlideIn delay={delay} translateY={24}>
      <PressableScale
        style={styles.card}
        onPress={() => onPress(item.id)}
        activeScale={0.96}
      >
        {/* Image with overlay */}
        <View style={styles.cardImageWrap}>
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.cardImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.cardImagePlaceholder}>
              <Text style={styles.cardImageEmoji}>☕</Text>
            </View>
          )}

          {/* Gradient-ish dark overlay bottom */}
          <View style={styles.cardImageOverlay} />

          {/* Status pill (top left, glass) */}
          <View style={styles.glassPill}>
            <View
              style={[styles.glassPillDot, { backgroundColor: meta.dot }]}
            />
            <Text style={styles.glassPillText}>{meta.label}</Text>
          </View>

          {/* Price pill (bottom right, dark glass) */}
          <View style={styles.pricePill}>
            <Text style={styles.pricePillText}>{formatPrice(item.price)}</Text>
          </View>

          {/* Unavailable overlay */}
          {!item.available && (
            <View style={styles.unavailableOverlay}>
              <Text style={styles.unavailableText}>Masqué</Text>
            </View>
          )}
        </View>

        {/* Body */}
        <View style={styles.cardBody}>
          <Text style={styles.cardName} numberOfLines={1}>
            {item.name}
          </Text>

          <View style={styles.cardMetaRow}>
            <Text style={styles.cardCategory} numberOfLines={1}>
              {item.categoryName || "Sans catégorie"}
            </Text>
          </View>

          <View style={styles.cardStockRow}>
            <Text style={styles.cardStockLabel}>Stock</Text>
            <Text style={styles.cardStockValue}>
              {item.stock}
              <Text style={styles.cardStockUnit}>{item.unit}</Text>
            </Text>
          </View>
        </View>
      </PressableScale>
    </FadeSlideIn>
  );
}

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Tous" },
  { key: "low", label: "Bas" },
  { key: "out", label: "Rupture" },
  { key: "available", label: "Dispo" },
];

// ─── Screen ──────────────────────────────────────────────────────────────────
type ProductsScreenProps = {
  navigation?: { navigate: (screen: string, params?: object) => void };
  route?: { params?: { filter?: FilterKey | "attention" } };
};

export default function ProductsScreen({
  navigation,
  route,
}: ProductsScreenProps) {
  const initialFilter =
    route?.params?.filter === "attention"
      ? "low"
      : (route?.params?.filter ?? "all");

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>(
    initialFilter === "low" ||
      initialFilter === "out" ||
      initialFilter === "available"
      ? initialFilter
      : "all",
  );

  const screenFade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(screenFade, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [screenFade]);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await getProducts();
      setProducts(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const status = getStockStatus(p);
      if (filter === "low" && status !== "low") return false;
      if (filter === "out" && status !== "out") return false;
      if (filter === "available" && !p.available) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.categoryName?.toLowerCase().includes(q) ||
        (p.description?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [products, query, filter]);

  const stats = useMemo(() => {
    let ok = 0,
      low = 0,
      out = 0;
    products.forEach((p) => {
      const s = getStockStatus(p);
      if (s === "ok") ok++;
      else if (s === "low") low++;
      else out++;
    });
    return { ok, low, out, total: products.length };
  }, [products]);

  const onPressProduct = (id: number) => {
    router.push(`/product/${id}`);
  };

  const renderItem = ({ item, index }: { item: Product; index: number }) => (
    <ProductCard item={item} onPress={onPressProduct} index={index} />
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      <Animated.View style={{ flex: 1, opacity: screenFade }}>
        {/* HERO HEADER */}
        <FadeSlideIn delay={0} translateY={-12}>
          <View style={styles.hero}>
            {/* Decorative circles */}
            <View style={styles.heroDecor1} />
            <View style={styles.heroDecor2} />

            <View style={styles.heroTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroEyebrow}>Catalogue</Text>
                <Text style={styles.heroTitle}>Produits</Text>
              </View>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeCount}>{stats.total}</Text>
                <Text style={styles.heroBadgeLabel}>articles</Text>
              </View>
            </View>

            {/* Stat chips inside hero */}
            <View style={styles.heroStats}>
              <View style={styles.heroStatChip}>
                <View
                  style={[styles.heroStatDot, { backgroundColor: "#4ADE80" }]}
                />
                <Text style={styles.heroStatValue}>{stats.ok}</Text>
                <Text style={styles.heroStatLabel}>Dispo</Text>
              </View>
              <View style={styles.heroStatChip}>
                <View
                  style={[styles.heroStatDot, { backgroundColor: "#FBBF24" }]}
                />
                <Text style={styles.heroStatValue}>{stats.low}</Text>
                <Text style={styles.heroStatLabel}>Bas</Text>
              </View>
              <View style={styles.heroStatChip}>
                <View
                  style={[styles.heroStatDot, { backgroundColor: "#F87171" }]}
                />
                <Text style={styles.heroStatValue}>{stats.out}</Text>
                <Text style={styles.heroStatLabel}>Rupture</Text>
              </View>
            </View>
          </View>
        </FadeSlideIn>

        {/* FLOATING SEARCH */}
        <FadeSlideIn delay={100} translateY={-8}>
          <View style={styles.searchFloat}>
            <View style={styles.searchWrap}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher…"
                placeholderTextColor={colors.mutedLight}
                value={query}
                onChangeText={setQuery}
                autoCorrect={false}
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => setQuery("")} hitSlop={10}>
                  <View style={styles.searchClearWrap}>
                    <Text style={styles.searchClear}>✕</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </FadeSlideIn>

        {/* SEGMENTED FILTER */}
        <FadeSlideIn delay={160}>
          <View style={styles.segmentWrap}>
            {FILTERS.map((f) => {
              const active = filter === f.key;
              return (
                <PressableScale
                  key={f.key}
                  style={[styles.segment, active && styles.segmentActive]}
                  onPress={() => setFilter(f.key)}
                  activeScale={0.96}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      active && styles.segmentTextActive,
                    ]}
                  >
                    {f.label}
                  </Text>
                </PressableScale>
              );
            })}
          </View>
        </FadeSlideIn>

        {/* CONTENT */}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={styles.loadingText}>Chargement…</Text>
          </View>
        ) : error ? (
          <View style={styles.center}>
            <View style={styles.errorBubble}>
              <Text style={styles.errorBubbleIcon}>⚠️</Text>
            </View>
            <Text style={styles.errorTitle}>Impossible de charger</Text>
            <Text style={styles.errorText}>{error}</Text>
            <PressableScale style={styles.retryBtn} onPress={() => load()}>
              <Text style={styles.retryText}>Réessayer</Text>
            </PressableScale>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            numColumns={2}
            columnWrapperStyle={styles.gridRow}
            contentContainerStyle={styles.grid}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => load(true)}
                tintColor={colors.accent}
                colors={[colors.accent]}
              />
            }
            ListEmptyComponent={
              <FadeSlideIn delay={100}>
                <View style={styles.empty}>
                  <View style={styles.emptyBubble}>
                    <Text style={{ fontSize: 40 }}>☕</Text>
                  </View>
                  <Text style={styles.emptyTitle}>Aucun produit</Text>
                  <Text style={styles.emptyText}>
                    {query || filter !== "all"
                      ? "Essayez une autre recherche ou un filtre."
                      : "Ajoutez votre premier produit pour commencer."}
                  </Text>
                </View>
              </FadeSlideIn>
            }
          />
        )}

        {/* FAB */}
        <FadeSlideIn delay={400} translateY={40} style={styles.fabWrap}>
          <PressableScale
            style={styles.fab}
            onPress={() => router.push("/AddProducts")}
            activeScale={0.9}
          >
            <Text style={styles.fabText}>＋</Text>
          </PressableScale>
        </FadeSlideIn>
      </Animated.View>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const SOFT_SHADOW = Platform.select({
  ios: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
  android: { elevation: 3 },
  default: {},
});

const HEAVY_SHADOW = Platform.select({
  ios: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.22,
    shadowRadius: 22,
  },
  android: { elevation: 10 },
  default: {},
});

const HERO_SHADOW = Platform.select({
  ios: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
  },
  android: { elevation: 8 },
  default: {},
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  // ─── HERO ──────────────────────────────────────────────────────────────────
  hero: {
    marginHorizontal: H_PADDING,
    marginTop: 8,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 20,
    backgroundColor: colors.primary,
    borderRadius: 28,
    overflow: "hidden",
    ...HERO_SHADOW,
  },
  heroDecor1: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.accent,
    opacity: 0.15,
    top: -80,
    right: -60,
  },
  heroDecor2: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.accentSoft,
    opacity: 0.08,
    bottom: -50,
    left: -40,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  heroEyebrow: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.accentSoft,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: -0.9,
  },
  heroBadge: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
    minWidth: 78,
  },
  heroBadgeCount: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFF",
    lineHeight: 24,
  },
  heroBadgeLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.accentSoft,
    marginTop: 2,
    letterSpacing: 0.4,
  },
  heroStats: {
    flexDirection: "row",
    gap: 8,
    marginTop: 20,
  },
  heroStatChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  heroStatDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  heroStatValue: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFF",
  },
  heroStatLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.6)",
    flexShrink: 1,
  },

  // ─── FLOATING SEARCH ───────────────────────────────────────────────────────
  searchFloat: {
    marginHorizontal: H_PADDING,
    marginTop: -22,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 18,
    paddingHorizontal: 16,
    height: 56,
    gap: 10,
    ...SOFT_SHADOW,
  },
  searchIcon: { fontSize: 16, opacity: 0.5 },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    paddingVertical: 0,
    fontWeight: "500",
  },
  searchClearWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  searchClear: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: "800",
  },

  // ─── SEGMENTED FILTER ──────────────────────────────────────────────────────
  segmentWrap: {
    flexDirection: "row",
    marginHorizontal: H_PADDING,
    marginTop: 18,
    backgroundColor: colors.surfaceAlt,
    padding: 4,
    borderRadius: 16,
    gap: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentActive: {
    backgroundColor: colors.surface,
    ...SOFT_SHADOW,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.muted,
    letterSpacing: -0.1,
  },
  segmentTextActive: {
    color: colors.primary,
    fontWeight: "800",
  },

  // ─── GRID ──────────────────────────────────────────────────────────────────
  grid: {
    paddingHorizontal: H_PADDING,
    paddingTop: 20,
    paddingBottom: 120,
  },
  gridRow: {
    gap: CARD_GAP,
    marginBottom: CARD_GAP,
  },

  // ─── CARD ──────────────────────────────────────────────────────────────────
  card: {
    width: CARD_WIDTH,
    backgroundColor: colors.surface,
    borderRadius: 22,
    overflow: "hidden",
    ...SOFT_SHADOW,
  },
  cardImageWrap: {
    width: "100%",
    height: CARD_WIDTH * 0.95,
    backgroundColor: colors.surfaceAlt,
    position: "relative",
  },
  cardImage: { width: "100%", height: "100%" },
  cardImagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cardImageEmoji: { fontSize: 40 },
  cardImageOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 60,
    backgroundColor: "rgba(0,0,0,0.08)",
  },

  // Glass pill (status)
  glassPill: {
    position: "absolute",
    top: 10,
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.92)",
    gap: 5,
  },
  glassPillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  glassPillText: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: 0.1,
  },

  // Price pill
  pricePill: {
    position: "absolute",
    bottom: 10,
    right: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "rgba(31,19,16,0.9)",
  },
  pricePillText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: -0.2,
  },

  unavailableOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(31,19,16,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  unavailableText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  // Card body
  cardBody: {
    padding: 12,
    gap: 6,
  },
  cardName: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.3,
  },
  cardMetaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardCategory: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.muted,
  },
  cardStockRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
    marginTop: 2,
  },
  cardStockLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.mutedLight,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  cardStockValue: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: -0.2,
  },
  cardStockUnit: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.muted,
  },

  // ─── STATES ────────────────────────────────────────────────────────────────
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: colors.muted,
    fontWeight: "500",
  },
  errorBubble: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: colors.dangerSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  errorBubbleIcon: { fontSize: 30 },
  errorTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.text,
  },
  errorText: {
    marginTop: 6,
    fontSize: 13,
    color: colors.muted,
    textAlign: "center",
  },
  retryBtn: {
    marginTop: 18,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    ...SOFT_SHADOW,
  },
  retryText: {
    color: "#FFF",
    fontWeight: "800",
    fontSize: 14,
    letterSpacing: 0.2,
  },

  empty: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyBubble: {
    width: 96,
    height: 96,
    borderRadius: 30,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.2,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 13,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 19,
    fontWeight: "500",
  },

  // ─── FAB ───────────────────────────────────────────────────────────────────
  fabWrap: {
    position: "absolute",
    right: H_PADDING,
    bottom: 24,
  },
  fab: {
    width: 62,
    height: 62,
    borderRadius: 22,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    ...HEAVY_SHADOW,
  },
  fabText: {
    fontSize: 30,
    color: "#FFF",
    fontWeight: "700",
    marginTop: -3,
  },
});
