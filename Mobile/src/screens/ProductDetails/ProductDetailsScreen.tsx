// src/screens/ProductDetailScreen.tsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  Image,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
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
  info: "#3B82F6",
  infoSoft: "#DBEAFE",
  gold: "#D4A055",
  shadow: "#1F1310",
};

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const H_PADDING = 20;
const HERO_HEIGHT = 320;

// ─── Types (from API) ────────────────────────────────────────────────────────
type ProductDetailResponse = {
  product: {
    id: number;
    name: string;
    description: string;
    categoryName: string;
    salePrice: number;
    costPrice: number;
    unitProfit: number;
    marginPercent: number;
    available: boolean;
  };
  stock: {
    currentStock: number;
    minStock: number;
    stockStatus: string;
    stockValue: number;
    potentialRevenue: number;
    potentialProfit: number;
  };
  sales: {
    ordersCount: number;
    unitsSold: number;
    revenue: number;
    cogs: number;
    grossProfit: number;
    marginPercent: number;
    averageUnitsPerOrder: number;
  };
  profitability: {
    unitProfit: number;
    marginPercent: number;
    totalGrossProfit: number;
    profitabilityLevel: string;
  };
  waste: {
    quantityWasted: number;
    wasteCost: number;
    wastePercent: number;
  };
  performance: {
    salesRank: number;
    profitabilityRank: number;
    revenueSharePercent: number;
    performanceLevel: string;
  };
  stockMovements: any[];
  recommendations: { type: string; level: string; message: string }[];
};

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

// ─── API ─────────────────────────────────────────────────────────────────────
const API_BASE = "https://latch-viewing-crop.ngrok-free.dev/api";

async function fetchProductDetail(id: number): Promise<ProductDetailResponse> {
  const res = await fetch(`${API_BASE}/analytics/product/${id}`);
  if (!res.ok) throw new Error(`Product ${res.status}`);
  return res.json();
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmtCurrency = (n: number, decimals = 2) =>
  new Intl.NumberFormat("fr-TN", {
    style: "currency",
    currency: "TND",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Number.isFinite(n) ? n : 0);

const fmtNumber = (n: number) =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(
    Number.isFinite(n) ? n : 0,
  );

const fmtPercent = (n: number, decimals = 1) =>
  `${(Number.isFinite(n) ? n : 0).toFixed(decimals)}%`;

function levelMeta(level: string) {
  const l = String(level || "").toUpperCase();
  switch (l) {
    case "HIGH":
      return { label: "Élevé", color: colors.success, bg: colors.successSoft };
    case "MEDIUM":
      return { label: "Moyen", color: colors.warning, bg: colors.warningSoft };
    case "LOW":
      return { label: "Faible", color: colors.danger, bg: colors.dangerSoft };
    default:
      return { label: l, color: colors.muted, bg: colors.surfaceAlt };
  }
}

function stockStatusMeta(status: string) {
  const s = String(status || "").toUpperCase();
  switch (s) {
    case "OK":
      return {
        label: "En stock",
        color: colors.success,
        bg: colors.successSoft,
        icon: "✓",
      };
    case "LOW":
      return {
        label: "Stock bas",
        color: colors.warning,
        bg: colors.warningSoft,
        icon: "⚠",
      };
    case "OUT":
    case "OUT_OF_STOCK":
      return {
        label: "Rupture",
        color: colors.danger,
        bg: colors.dangerSoft,
        icon: "✕",
      };
    default:
      return {
        label: s,
        color: colors.muted,
        bg: colors.surfaceAlt,
        icon: "·",
      };
  }
}

function recommendationMeta(level: string) {
  const l = String(level || "").toUpperCase();
  switch (l) {
    case "GOOD":
      return {
        icon: "💡",
        color: colors.success,
        bg: colors.successSoft,
        accent: colors.success,
      };
    case "WARNING":
      return {
        icon: "⚠️",
        color: colors.warning,
        bg: colors.warningSoft,
        accent: colors.warning,
      };
    case "BAD":
    case "CRITICAL":
      return {
        icon: "🚨",
        color: colors.danger,
        bg: colors.dangerSoft,
        accent: colors.danger,
      };
    default:
      return {
        icon: "ℹ️",
        color: colors.info,
        bg: colors.infoSoft,
        accent: colors.info,
      };
  }
}

// ─── Motion ──────────────────────────────────────────────────────────────────
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
      duration: 560,
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
  activeScale = 0.96,
  ...rest
}: any) {
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn = () =>
    Animated.spring(scale, {
      toValue: activeScale,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start();
  const onPressOut = () =>
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 8,
    }).start();
  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        {...rest}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

function useCountUp(value: number, duration = 900) {
  const [display, setDisplay] = useState(0);
  const prevRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    const start = prevRef.current;
    const end = Number.isFinite(value) ? value : 0;
    const startTs = Date.now();
    const tick = () => {
      const t = Math.min(1, (Date.now() - startTs) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(start + (end - start) * eased);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else prevRef.current = end;
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);
  return display;
}

function AnimatedNumber({
  value,
  format,
  style,
}: {
  value: number;
  format: (n: number) => string;
  style?: any;
}) {
  const v = useCountUp(value);
  return <Text style={style}>{format(v)}</Text>;
}

// ─── Ring Chart (pure View, no deps) ─────────────────────────────────────────
/**
 * Circular progress ring using two overlapping Views.
 * Uses border trick: a square with borderWidth = thickness and borderTopColor
 * for the filled portion, rotated to show progress.
 */
function RingChart({
  percent,
  size = 120,
  thickness = 12,
  color = colors.accent,
  bgColor = colors.surfaceAlt,
  children,
}: {
  percent: number;
  size?: number;
  thickness?: number;
  color?: string;
  bgColor?: string;
  children?: React.ReactNode;
}) {
  const p = Math.max(0, Math.min(100, percent));
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: p,
      duration: 1100,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [p, anim]);

  // For a full circle with border trick: we rotate and clip
  // Simpler approach: outer ring with bgColor, inner ring covering gap with
  // a "pie" made by a half-circle masked rotation. Since View rotation with
  // useNativeDriver is fine, we build two half-moons.
  const rotate1 = anim.interpolate({
    inputRange: [0, 50, 100],
    outputRange: ["0deg", "180deg", "180deg"],
  });
  const rotate2 = anim.interpolate({
    inputRange: [0, 50, 100],
    outputRange: ["0deg", "0deg", "180deg"],
  });
  const opacity2 = anim.interpolate({
    inputRange: [0, 49.9, 50, 100],
    outputRange: [0, 0, 1, 1],
  });

  const radius = size / 2;
  const innerSize = size - thickness * 2;

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Background ring */}
      <View
        style={{
          position: "absolute",
          width: size,
          height: size,
          borderRadius: radius,
          borderWidth: thickness,
          borderColor: bgColor,
        }}
      />
      {/* Right half clip */}
      <View
        style={{
          position: "absolute",
          width: radius,
          height: size,
          right: 0,
          overflow: "hidden",
        }}
      >
        <Animated.View
          style={{
            width: size,
            height: size,
            borderRadius: radius,
            borderWidth: thickness,
            borderColor: "transparent",
            borderTopColor: color,
            borderRightColor: color,
            position: "absolute",
            right: 0,
            transform: [{ rotate: rotate1 }],
          }}
        />
      </View>
      {/* Left half clip */}
      <Animated.View
        style={{
          position: "absolute",
          width: radius,
          height: size,
          left: 0,
          overflow: "hidden",
          opacity: opacity2,
        }}
      >
        <Animated.View
          style={{
            width: size,
            height: size,
            borderRadius: radius,
            borderWidth: thickness,
            borderColor: "transparent",
            borderBottomColor: color,
            borderLeftColor: color,
            position: "absolute",
            left: 0,
            transform: [{ rotate: rotate2 }],
          }}
        />
      </Animated.View>
      {/* Center hole */}
      <View
        style={{
          width: innerSize,
          height: innerSize,
          borderRadius: innerSize / 2,
          backgroundColor: colors.surface,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {children}
      </View>
    </View>
  );
}

// ─── Tab Bar ─────────────────────────────────────────────────────────────────
type TabKey = "overview" | "sales" | "stock" | "insights";

function TabBar({
  active,
  onChange,
}: {
  active: TabKey;
  onChange: (k: TabKey) => void;
}) {
  const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: "overview", label: "Vue", icon: "◆" },
    { key: "sales", label: "Ventes", icon: "↑" },
    { key: "stock", label: "Stock", icon: "▦" },
    { key: "insights", label: "Analyse", icon: "✦" },
  ];

  const [containerWidth, setContainerWidth] = useState(0);
  const indicatorAnim = useRef(new Animated.Value(0)).current;
  const activeIndex = tabs.findIndex((t) => t.key === active);
  const tabWidth = containerWidth / tabs.length;

  useEffect(() => {
    Animated.spring(indicatorAnim, {
      toValue: activeIndex,
      useNativeDriver: true,
      speed: 22,
      bounciness: 10,
    }).start();
  }, [activeIndex, indicatorAnim]);

  const translateX = indicatorAnim.interpolate({
    inputRange: [0, 1, 2, 3],
    outputRange: [0, tabWidth, tabWidth * 2, tabWidth * 3],
  });

  return (
    <View
      style={styles.tabBar}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      {containerWidth > 0 && (
        <Animated.View
          style={[
            styles.tabIndicator,
            {
              width: tabWidth - 8,
              transform: [{ translateX }],
            },
          ]}
        />
      )}
      {tabs.map((t) => {
        const isActive = t.key === active;
        return (
          <TouchableOpacity
            key={t.key}
            style={styles.tabItem}
            onPress={() => onChange(t.key)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabIcon, isActive && styles.tabIconActive]}>
              {t.icon}
            </Text>
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Stat Row ────────────────────────────────────────────────────────────────
function StatRow({
  label,
  value,
  format,
  accent,
}: {
  label: string;
  value: number;
  format: (n: number) => string;
  accent?: string;
}) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statRowLabel}>{label}</Text>
      <AnimatedNumber
        value={value}
        format={format}
        style={[styles.statRowValue, accent ? { color: accent } : null]}
      />
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────
type ProductDetailScreenProps = {
  navigation?: { goBack: () => void; navigate: (s: string, p?: any) => void };
  route?: { params?: { id?: number } };
};

export default function ProductDetailScreen({
  navigation,
  route,
}: ProductDetailScreenProps) {
  const productId = route?.params?.id ?? 10003;

  const [data, setData] = useState<ProductDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("overview");

  const scrollY = useRef(new Animated.Value(0)).current;

  // Parallax: hero image moves slower than scroll
  const heroTranslateY = scrollY.interpolate({
    inputRange: [-HERO_HEIGHT, 0, HERO_HEIGHT],
    outputRange: [HERO_HEIGHT / 2, 0, -HERO_HEIGHT / 3],
    extrapolate: "clamp",
  });
  const heroScale = scrollY.interpolate({
    inputRange: [-HERO_HEIGHT, 0],
    outputRange: [2, 1],
    extrapolate: "clamp",
  });
  const heroOpacity = scrollY.interpolate({
    inputRange: [0, HERO_HEIGHT * 0.6, HERO_HEIGHT],
    outputRange: [1, 0.6, 0],
    extrapolate: "clamp",
  });

  const screenFade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(screenFade, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [screenFade]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchProductDetail(productId);
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    load();
  }, [load]);

  // For demo purposes, use a placeholder image if the API doesn't return one
  const imageUrl = (data as any)?.product?.imageUrl as string | undefined;

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      {loading ? (
        <SafeAreaView style={styles.safe} edges={["top"]}>
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={styles.loadingText}>Chargement…</Text>
          </View>
        </SafeAreaView>
      ) : error || !data ? (
        <SafeAreaView style={styles.safe} edges={["top"]}>
          <View style={styles.center}>
            <View style={styles.errorBubble}>
              <Text style={styles.errorBubbleIcon}>⚠️</Text>
            </View>
            <Text style={styles.errorTitle}>Impossible de charger</Text>
            <Text style={styles.errorText}>{error ?? "Erreur"}</Text>
            <PressableScale style={styles.retryBtn} onPress={load}>
              <Text style={styles.retryText}>Réessayer</Text>
            </PressableScale>
          </View>
        </SafeAreaView>
      ) : (
        <Animated.View style={{ flex: 1, opacity: screenFade }}>
          <Animated.ScrollView
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: true },
            )}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 60 }}
          >
            {/* ─── HERO ──────────────────────────────────────────────────────── */}
            <View style={styles.heroWrap}>
              <Animated.View
                style={[
                  styles.heroImageWrap,
                  {
                    transform: [
                      { translateY: heroTranslateY },
                      { scale: heroScale },
                    ],
                  },
                ]}
              >
                {imageUrl ? (
                  <Image source={{ uri: imageUrl }} style={styles.heroImage} />
                ) : (
                  <View style={styles.heroPlaceholder}>
                    <Text style={styles.heroPlaceholderEmoji}>☕</Text>
                  </View>
                )}
                {/* Dark gradient overlay (approximated with layered views) */}
                <View style={styles.heroOverlayTop} />
                <View style={styles.heroOverlayBottom} />
              </Animated.View>

              {/* Back button */}
              <SafeAreaView
                style={styles.heroTopBar}
                edges={["top"]}
                pointerEvents="box-none"
              >
                <PressableScale
                  style={styles.heroBackBtn}
                  onPress={() => navigation?.goBack?.()}
                  activeScale={0.9}
                >
                  <Text style={styles.heroBackIcon}>‹</Text>
                </PressableScale>

                <View style={styles.heroTopRight}>
                  <View
                    style={[
                      styles.heroStatusPill,
                      {
                        backgroundColor: stockStatusMeta(data.stock.stockStatus)
                          .bg,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.heroStatusIcon,
                        {
                          color: stockStatusMeta(data.stock.stockStatus).color,
                        },
                      ]}
                    >
                      {stockStatusMeta(data.stock.stockStatus).icon}
                    </Text>
                    <Text
                      style={[
                        styles.heroStatusText,
                        {
                          color: stockStatusMeta(data.stock.stockStatus).color,
                        },
                      ]}
                    >
                      {stockStatusMeta(data.stock.stockStatus).label}
                    </Text>
                  </View>
                </View>
              </SafeAreaView>

              {/* Hero content over image */}
              <Animated.View
                style={[styles.heroContent, { opacity: heroOpacity }]}
                pointerEvents="none"
              >
                <View style={styles.heroCategoryPill}>
                  <Text style={styles.heroCategoryText}>
                    {data.product.categoryName}
                  </Text>
                </View>
                <Text style={styles.heroTitle}>{data.product.name}</Text>
                {data.product.description ? (
                  <Text style={styles.heroSubtitle} numberOfLines={2}>
                    {data.product.description}
                  </Text>
                ) : null}
              </Animated.View>
            </View>

            {/* ─── PRICE CARD (floating over hero) ─────────────────────────── */}
            <View style={styles.priceCardWrap}>
              <FadeSlideIn delay={100} translateY={-20}>
                <View style={styles.priceCard}>
                  <View style={styles.priceCardLeft}>
                    <Text style={styles.priceCardLabel}>Prix de vente</Text>
                    <AnimatedNumber
                      value={data.product.salePrice}
                      format={(n) => fmtCurrency(n)}
                      style={styles.priceCardValue}
                    />
                    <Text style={styles.priceCardCost}>
                      Coût · {fmtCurrency(data.product.costPrice)}
                    </Text>
                  </View>

                  <View style={styles.priceCardDivider} />

                  <View style={styles.priceCardRight}>
                    <RingChart
                      percent={data.product.marginPercent}
                      size={92}
                      thickness={10}
                      color={colors.accent}
                      bgColor={colors.surfaceAlt}
                    >
                      <AnimatedNumber
                        value={data.product.marginPercent}
                        format={(n) => `${n.toFixed(0)}%`}
                        style={styles.ringValue}
                      />
                      <Text style={styles.ringLabel}>marge</Text>
                    </RingChart>
                  </View>
                </View>
              </FadeSlideIn>
            </View>

            {/* ─── TABS ──────────────────────────────────────────────────────── */}
            <FadeSlideIn delay={180}>
              <View style={styles.tabWrap}>
                <TabBar active={tab} onChange={setTab} />
              </View>
            </FadeSlideIn>

            {/* ─── TAB CONTENT ───────────────────────────────────────────────── */}
            <View style={styles.tabContent}>
              {tab === "overview" && <OverviewTab data={data} />}
              {tab === "sales" && <SalesTab data={data} />}
              {tab === "stock" && <StockTab data={data} />}
              {tab === "insights" && <InsightsTab data={data} />}
            </View>

            {/* ─── RECOMMENDATIONS (always visible) ─────────────────────────── */}
            {data.recommendations && data.recommendations.length > 0 && (
              <View style={styles.recWrap}>
                <FadeSlideIn delay={200}>
                  <View style={styles.recHeader}>
                    <Text style={styles.recTitle}>Recommandations</Text>
                    <View style={styles.recBadge}>
                      <Text style={styles.recBadgeText}>
                        {data.recommendations.length}
                      </Text>
                    </View>
                  </View>
                </FadeSlideIn>
                {data.recommendations.map((r, i) => {
                  const m = recommendationMeta(r.level);
                  return (
                    <FadeSlideIn key={i} delay={240 + i * 60}>
                      <View style={[styles.recCard, { backgroundColor: m.bg }]}>
                        <View
                          style={[
                            styles.recAccent,
                            { backgroundColor: m.accent },
                          ]}
                        />
                        <Text style={styles.recIcon}>{m.icon}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.recType, { color: m.color }]}>
                            {r.type}
                          </Text>
                          <Text style={styles.recMessage}>{r.message}</Text>
                        </View>
                      </View>
                    </FadeSlideIn>
                  );
                })}
              </View>
            )}
          </Animated.ScrollView>
        </Animated.View>
      )}
    </View>
  );
}

// ─── Tab: Overview ───────────────────────────────────────────────────────────
function OverviewTab({ data }: { data: ProductDetailResponse }) {
  const perf = levelMeta(data.performance.performanceLevel);
  const profitLevel = levelMeta(data.profitability.profitabilityLevel);

  return (
    <View>
      {/* Performance ranks */}
      <FadeSlideIn delay={220}>
        <View style={styles.rankRow}>
          <View style={styles.rankCard}>
            <Text style={styles.rankLabel}>Rang ventes</Text>
            <View style={styles.rankValueRow}>
              <Text style={styles.rankHash}>#</Text>
              <Text style={styles.rankValue}>{data.performance.salesRank}</Text>
            </View>
          </View>
          <View style={styles.rankCard}>
            <Text style={styles.rankLabel}>Rang profit</Text>
            <View style={styles.rankValueRow}>
              <Text style={styles.rankHash}>#</Text>
              <Text style={styles.rankValue}>
                {data.performance.profitabilityRank}
              </Text>
            </View>
          </View>
        </View>
      </FadeSlideIn>

      {/* Profitability level */}
      <FadeSlideIn delay={280}>
        <View style={styles.levelCard}>
          <View style={styles.levelHeader}>
            <Text style={styles.levelTitle}>Niveau de rentabilité</Text>
            <View
              style={[styles.levelBadge, { backgroundColor: profitLevel.bg }]}
            >
              <Text
                style={[styles.levelBadgeText, { color: profitLevel.color }]}
              >
                {profitLevel.label}
              </Text>
            </View>
          </View>
          <View style={styles.levelBarTrack}>
            <SegmentedBar
              percent={data.profitability.marginPercent}
              color={profitLevel.color}
            />
          </View>
          <Text style={styles.levelHint}>
            Marge de {fmtPercent(data.profitability.marginPercent)} — profit
            unitaire {fmtCurrency(data.profitability.unitProfit)}
          </Text>
        </View>
      </FadeSlideIn>

      {/* Key figures */}
      <FadeSlideIn delay={340}>
        <View style={styles.keyCard}>
          <Text style={styles.keyTitle}>Chiffres clés</Text>
          <StatRow
            label="Profit unitaire"
            value={data.product.unitProfit}
            format={(n) => fmtCurrency(n)}
            accent={colors.success}
          />
          <View style={styles.keySep} />
          <StatRow
            label="Profit total"
            value={data.profitability.totalGrossProfit}
            format={(n) => fmtCurrency(n)}
            accent={colors.success}
          />
          <View style={styles.keySep} />
          <StatRow
            label="Part des revenus"
            value={data.performance.revenueSharePercent}
            format={(n) => fmtPercent(n, 1)}
            accent={colors.accent}
          />
        </View>
      </FadeSlideIn>
    </View>
  );
}

function SegmentedBar({ percent, color }: { percent: number; color: string }) {
  // 10 segments
  const segments = 10;
  const activeSegments = Math.round(
    (Math.max(0, Math.min(100, percent)) / 100) * segments,
  );
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: activeSegments,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [activeSegments, anim]);

  return (
    <View style={styles.segBar}>
      {Array.from({ length: segments }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.segCell,
            {
              backgroundColor: i < activeSegments ? color : colors.surfaceAlt,
            },
          ]}
        />
      ))}
    </View>
  );
}

// ─── Tab: Sales ──────────────────────────────────────────────────────────────
function SalesTab({ data }: { data: ProductDetailResponse }) {
  const s = data.sales;
  return (
    <View>
      <FadeSlideIn delay={200}>
        <View style={styles.bigStatCard}>
          <Text style={styles.bigStatLabel}>Revenus générés</Text>
          <AnimatedNumber
            value={s.revenue}
            format={(n) => fmtCurrency(n)}
            style={styles.bigStatValue}
          />
          <View style={styles.bigStatMetaRow}>
            <View style={styles.bigStatMetaPill}>
              <Text style={styles.bigStatMetaIcon}>🧾</Text>
              <Text style={styles.bigStatMetaText}>
                {s.ordersCount} commande{s.ordersCount > 1 ? "s" : ""}
              </Text>
            </View>
            <View style={styles.bigStatMetaPill}>
              <Text style={styles.bigStatMetaIcon}>☕</Text>
              <Text style={styles.bigStatMetaText}>
                {s.unitsSold} vendu{s.unitsSold > 1 ? "s" : ""}
              </Text>
            </View>
          </View>
        </View>
      </FadeSlideIn>

      <FadeSlideIn delay={260}>
        <View style={styles.keyCard}>
          <Text style={styles.keyTitle}>Détails des ventes</Text>
          <StatRow
            label="Coût des produits vendus"
            value={s.cogs}
            format={(n) => fmtCurrency(n)}
            accent={colors.warning}
          />
          <View style={styles.keySep} />
          <StatRow
            label="Profit brut"
            value={s.grossProfit}
            format={(n) => fmtCurrency(n)}
            accent={colors.success}
          />
          <View style={styles.keySep} />
          <StatRow
            label="Marge moyenne"
            value={s.marginPercent}
            format={(n) => fmtPercent(n)}
            accent={colors.accent}
          />
          <View style={styles.keySep} />
          <StatRow
            label="Unités / commande"
            value={s.averageUnitsPerOrder}
            format={(n) => n.toFixed(1)}
          />
        </View>
      </FadeSlideIn>
    </View>
  );
}

// ─── Tab: Stock ──────────────────────────────────────────────────────────────
function StockTab({ data }: { data: ProductDetailResponse }) {
  const st = data.stock;
  const status = stockStatusMeta(st.stockStatus);

  return (
    <View>
      <FadeSlideIn delay={200}>
        <View style={styles.stockHeroCard}>
          <View style={styles.stockHeroTop}>
            <View
              style={[styles.stockHeroIcon, { backgroundColor: status.bg }]}
            >
              <Text style={[styles.stockHeroIconText, { color: status.color }]}>
                {status.icon}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stockHeroLabel}>Stock actuel</Text>
              <AnimatedNumber
                value={st.currentStock}
                format={fmtNumber}
                style={styles.stockHeroValue}
              />
            </View>
            <View style={styles.stockHeroMin}>
              <Text style={styles.stockHeroMinLabel}>min</Text>
              <Text style={styles.stockHeroMinValue}>{st.minStock}</Text>
            </View>
          </View>
        </View>
      </FadeSlideIn>

      <FadeSlideIn delay={260}>
        <View style={styles.keyCard}>
          <Text style={styles.keyTitle}>Valeur du stock</Text>
          <StatRow
            label="Valeur immobilisée"
            value={st.stockValue}
            format={(n) => fmtCurrency(n)}
            accent={colors.primary}
          />
          <View style={styles.keySep} />
          <StatRow
            label="Revenu potentiel"
            value={st.potentialRevenue}
            format={(n) => fmtCurrency(n)}
            accent={colors.accent}
          />
          <View style={styles.keySep} />
          <StatRow
            label="Profit potentiel"
            value={st.potentialProfit}
            format={(n) => fmtCurrency(n)}
            accent={colors.success}
          />
        </View>
      </FadeSlideIn>

      {/* Waste */}
      <FadeSlideIn delay={320}>
        <View
          style={[
            styles.wasteCard,
            data.waste.quantityWasted > 0
              ? styles.wasteCardAlert
              : styles.wasteCardOk,
          ]}
        >
          <View style={styles.wasteHeader}>
            <Text style={styles.wasteIcon}>
              {data.waste.quantityWasted > 0 ? "🗑️" : "✓"}
            </Text>
            <Text style={styles.wasteTitle}>
              {data.waste.quantityWasted > 0
                ? "Pertes enregistrées"
                : "Aucune perte"}
            </Text>
          </View>
          <View style={styles.wasteRow}>
            <View style={styles.wasteItem}>
              <Text style={styles.wasteItemLabel}>Quantité</Text>
              <Text style={styles.wasteItemValue}>
                {data.waste.quantityWasted}
              </Text>
            </View>
            <View style={styles.wasteDivider} />
            <View style={styles.wasteItem}>
              <Text style={styles.wasteItemLabel}>Coût</Text>
              <Text style={styles.wasteItemValue}>
                {fmtCurrency(data.waste.wasteCost)}
              </Text>
            </View>
            <View style={styles.wasteDivider} />
            <View style={styles.wasteItem}>
              <Text style={styles.wasteItemLabel}>%</Text>
              <Text style={styles.wasteItemValue}>
                {fmtPercent(data.waste.wastePercent, 1)}
              </Text>
            </View>
          </View>
        </View>
      </FadeSlideIn>

      {/* Movements timeline */}
      <FadeSlideIn delay={380}>
        <View style={styles.movementsCard}>
          <Text style={styles.keyTitle}>Mouvements de stock</Text>
          {data.stockMovements && data.stockMovements.length > 0 ? (
            data.stockMovements.map((m: any, i: number) => (
              <View key={i} style={styles.movementRow}>
                <View style={styles.movementDot} />
                <Text style={styles.movementText}>
                  {m.type} · {m.quantity}
                </Text>
                <Text style={styles.movementDate}>
                  . {formatDate(m.createdAt)}
                </Text>
              </View>
            ))
          ) : (
            <View style={styles.movementsEmpty}>
              <Text style={styles.movementsEmptyEmoji}>📭</Text>
              <Text style={styles.movementsEmptyText}>
                Aucun mouvement enregistré
              </Text>
            </View>
          )}
        </View>
      </FadeSlideIn>
    </View>
  );
}

// ─── Tab: Insights ───────────────────────────────────────────────────────────
function InsightsTab({ data }: { data: ProductDetailResponse }) {
  const perf = levelMeta(data.performance.performanceLevel);
  const profit = levelMeta(data.profitability.profitabilityLevel);

  return (
    <View>
      <FadeSlideIn delay={200}>
        <View style={styles.insightHero}>
          <View style={styles.insightHeroDecor} />
          <Text style={styles.insightHeroEyebrow}>Score global</Text>
          <View style={styles.insightHeroScoreRow}>
            <AnimatedNumber
              value={data.performance.revenueSharePercent}
              format={(n) => `${n.toFixed(0)}`}
              style={styles.insightHeroScore}
            />
            <Text style={styles.insightHeroScoreUnit}>%</Text>
          </View>
          <Text style={styles.insightHeroLabel}>Part des revenus totaux</Text>
        </View>
      </FadeSlideIn>

      <FadeSlideIn delay={260}>
        <View style={styles.insightGrid}>
          <View style={styles.insightTile}>
            <Text style={styles.insightTileIcon}>📈</Text>
            <Text style={styles.insightTileLabel}>Performance</Text>
            <Text style={[styles.insightTileValue, { color: perf.color }]}>
              {perf.label}
            </Text>
          </View>
          <View style={styles.insightTile}>
            <Text style={styles.insightTileIcon}>💰</Text>
            <Text style={styles.insightTileLabel}>Rentabilité</Text>
            <Text style={[styles.insightTileValue, { color: profit.color }]}>
              {profit.label}
            </Text>
          </View>
        </View>
      </FadeSlideIn>

      <FadeSlideIn delay={320}>
        <View style={styles.keyCard}>
          <Text style={styles.keyTitle}>Positionnement</Text>
          <StatRow
            label="Rang ventes"
            value={data.performance.salesRank}
            format={(n) => `#${fmtNumber(n)}`}
          />
          <View style={styles.keySep} />
          <StatRow
            label="Rang rentabilité"
            value={data.performance.profitabilityRank}
            format={(n) => `#${fmtNumber(n)}`}
          />
        </View>
      </FadeSlideIn>
    </View>
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
    shadowRadius: 24,
  },
  android: { elevation: 8 },
  default: {},
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  safe: { flex: 1, backgroundColor: colors.background },

  // ─── HERO ──────────────────────────────────────────────────────────────────
  heroWrap: {
    height: HERO_HEIGHT,
    overflow: "hidden",
    backgroundColor: colors.primary,
  },
  heroImageWrap: {
    ...StyleSheet.absoluteFill,
  },
  heroImage: { width: "100%", height: "100%", resizeMode: "cover" },
  heroPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySoft,
  },
  heroPlaceholderEmoji: { fontSize: 80, opacity: 0.4 },
  heroOverlayTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "50%",
    backgroundColor: "rgba(31,19,16,0.35)",
  },
  heroOverlayBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "70%",
    backgroundColor: "rgba(31,19,16,0.75)",
  },

  heroTopBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: H_PADDING,
    paddingTop: 8,
  },
  heroBackBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  heroBackIcon: {
    fontSize: 28,
    color: "#FFF",
    fontWeight: "400",
    marginTop: -3,
    marginLeft: -2,
  },
  heroTopRight: { flexDirection: "row", gap: 8 },
  heroStatusPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.95)",
  },
  heroStatusIcon: { fontSize: 12, fontWeight: "800" },
  heroStatusText: { fontSize: 11, fontWeight: "800", letterSpacing: 0.2 },

  heroContent: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: H_PADDING,
    paddingBottom: 24,
  },
  heroCategoryPill: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  heroCategoryText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: -0.9,
    lineHeight: 40,
  },
  heroSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    marginTop: 8,
    fontWeight: "500",
    lineHeight: 18,
  },

  // ─── PRICE CARD ────────────────────────────────────────────────────────────
  priceCardWrap: {
    marginTop: -40,
    paddingHorizontal: H_PADDING,
    zIndex: 10,
  },
  priceCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    ...HEAVY_SHADOW,
  },
  priceCardLeft: { flex: 1 },
  priceCardLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.muted,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  priceCardValue: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: -0.9,
    marginTop: 6,
  },
  priceCardCost: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: "600",
    marginTop: 4,
  },
  priceCardDivider: {
    width: 1,
    height: 60,
    backgroundColor: colors.border,
  },
  priceCardRight: { alignItems: "center", justifyContent: "center" },
  ringValue: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: -0.6,
  },
  ringLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: colors.muted,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: 2,
  },

  // ─── TABS ──────────────────────────────────────────────────────────────────
  tabWrap: {
    marginHorizontal: H_PADDING,
    marginTop: 20,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: colors.surfaceAlt,
    borderRadius: 16,
    padding: 4,
    position: "relative",
  },
  tabIndicator: {
    position: "absolute",
    top: 4,
    left: 4,
    bottom: 4,
    backgroundColor: colors.surface,
    borderRadius: 12,
    ...SOFT_SHADOW,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    gap: 3,
  },
  tabIcon: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: "800",
  },
  tabIconActive: { color: colors.accent },
  tabLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.muted,
    letterSpacing: -0.1,
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: "800",
  },

  tabContent: {
    paddingHorizontal: H_PADDING,
    paddingTop: 18,
  },

  // ─── OVERVIEW ──────────────────────────────────────────────────────────────
  rankRow: {
    flexDirection: "row",
    gap: 12,
  },
  rankCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...SOFT_SHADOW,
  },
  rankLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.muted,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  rankValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
  },
  rankHash: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.accent,
  },
  rankValue: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: -1,
  },

  levelCard: {
    marginTop: 14,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...SOFT_SHADOW,
  },
  levelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  levelTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: -0.2,
  },
  levelBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  levelBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  levelBarTrack: {
    marginBottom: 10,
  },
  levelHint: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: "600",
  },
  segBar: {
    flexDirection: "row",
    gap: 3,
  },
  segCell: {
    flex: 1,
    height: 8,
    borderRadius: 4,
  },

  keyCard: {
    marginTop: 14,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    ...SOFT_SHADOW,
  },
  keyTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: -0.2,
    marginBottom: 14,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  statRowLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.muted,
  },
  statRowValue: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: -0.2,
  },
  keySep: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 6,
  },

  // ─── SALES ─────────────────────────────────────────────────────────────────
  bigStatCard: {
    backgroundColor: colors.primary,
    borderRadius: 24,
    padding: 22,
    overflow: "hidden",
    ...HEAVY_SHADOW,
  },
  bigStatLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.accentSoft,
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  bigStatValue: {
    fontSize: 38,
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: -1.2,
    marginTop: 8,
  },
  bigStatMetaRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 18,
  },
  bigStatMetaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  bigStatMetaIcon: { fontSize: 12 },
  bigStatMetaText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFF",
  },

  // ─── STOCK ─────────────────────────────────────────────────────────────────
  stockHeroCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    ...SOFT_SHADOW,
  },
  stockHeroTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  stockHeroIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  stockHeroIconText: { fontSize: 22, fontWeight: "800" },
  stockHeroLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.muted,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  stockHeroValue: {
    fontSize: 30,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: -1,
    marginTop: 4,
  },
  stockHeroMin: {
    alignItems: "flex-end",
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  stockHeroMinLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.muted,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  stockHeroMinValue: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.primary,
    marginTop: 2,
  },

  wasteCard: {
    marginTop: 14,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
  },
  wasteCardAlert: {
    backgroundColor: colors.dangerSoft,
    borderColor: "#FCA5A5",
  },
  wasteCardOk: {
    backgroundColor: colors.successSoft,
    borderColor: "#86EFAC",
  },
  wasteHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  wasteIcon: { fontSize: 18 },
  wasteTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: -0.2,
  },
  wasteRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  wasteItem: {
    flex: 1,
    alignItems: "center",
  },
  wasteItemLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.muted,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  wasteItemValue: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: -0.3,
  },
  wasteDivider: {
    width: 1,
    height: 26,
    backgroundColor: "rgba(0,0,0,0.08)",
  },

  movementsCard: {
    marginTop: 14,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    ...SOFT_SHADOW,
  },
  movementRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  movementDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  movementText: {
    fontSize: 13,
    color: colors.text,
    fontWeight: "600",
  },
  movementDate: {
    fontSize: 10,
    color: colors.muted,
    fontWeight: "600",
  },
  movementsEmpty: {
    alignItems: "center",
    paddingVertical: 20,
  },
  movementsEmptyEmoji: { fontSize: 32, marginBottom: 8, opacity: 0.6 },
  movementsEmptyText: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: "600",
  },

  // ─── INSIGHTS ──────────────────────────────────────────────────────────────
  insightHero: {
    backgroundColor: colors.primary,
    borderRadius: 24,
    padding: 24,
    overflow: "hidden",
    alignItems: "center",
    ...HEAVY_SHADOW,
  },
  insightHeroDecor: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: colors.accent,
    opacity: 0.15,
    top: -60,
    right: -50,
  },
  insightHeroEyebrow: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.accentSoft,
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  insightHeroScoreRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 10,
  },
  insightHeroScore: {
    fontSize: 64,
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: -3,
    lineHeight: 68,
  },
  insightHeroScoreUnit: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.accent,
    marginLeft: 4,
  },
  insightHeroLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.65)",
    fontWeight: "600",
    marginTop: 4,
  },

  insightGrid: {
    flexDirection: "row",
    gap: 12,
    marginTop: 14,
  },
  insightTile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...SOFT_SHADOW,
  },
  insightTileIcon: { fontSize: 20, marginBottom: 10 },
  insightTileLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.muted,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  insightTileValue: {
    fontSize: 18,
    fontWeight: "800",
    marginTop: 6,
    letterSpacing: -0.3,
  },

  // ─── RECOMMENDATIONS ───────────────────────────────────────────────────────
  recWrap: {
    paddingHorizontal: H_PADDING,
    marginTop: 24,
  },
  recHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  recTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: -0.3,
  },
  recBadge: {
    minWidth: 28,
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  recBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.primary,
  },
  recCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    gap: 12,
    position: "relative",
    overflow: "hidden",
  },
  recAccent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  recIcon: { fontSize: 18, marginLeft: 4 },
  recType: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  recMessage: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
    lineHeight: 18,
  },

  // ─── CENTER / ERROR ────────────────────────────────────────────────────────
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
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
    marginBottom: 12,
  },
  errorBubbleIcon: { fontSize: 30 },
  errorTitle: { fontSize: 17, fontWeight: "800", color: colors.text },
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
  retryText: { color: "#FFF", fontWeight: "800", fontSize: 14 },
});
