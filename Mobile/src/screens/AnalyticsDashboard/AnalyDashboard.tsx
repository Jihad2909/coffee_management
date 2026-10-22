// src/screens/DashboardScreen.tsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
  Platform,
  Animated,
  Easing,
  Pressable,
  Dimensions,
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
  success: "#16A34A",
  successSoft: "#DCFCE7",
  warning: "#F59E0B",
  warningSoft: "#FEF3C7",
  danger: "#DC2626",
  dangerSoft: "#FEE2E2",
  gold: "#D4A055",
  goldSoft: "#FDF6E3",
  shadow: "#1F1310",
};

const { width: SCREEN_W } = Dimensions.get("window");
const H_PADDING = 20;
const CARD_GAP = 12;

// ─── Types ───────────────────────────────────────────────────────────────────
type Sales = {
  revenue: number;
  coutDesProduitsVendus: number;
  grossProfit: number;
  marginPercent: number;
  ordersCount: number;
  unitsSold: number;
};

type Inventory = {
  stockValue: number;
  potentialRevenue: number;
  potentialProfit: number;
  totalProducts: number;
  outOfStock: number;
  lowStock: number;
};

type ProductSale = {
  productId: number;
  productName: string;
  unitsSold: number;
  revenue: number;
  cogs: number;
  grossProfit: number;
  marginPercent: number;
};

type HourlySale = {
  hour: number;
  ordersCount: number;
  unitsSold: number;
  revenue: number;
};

type WasteItem = {
  productId: number;
  productName: string;
  quantityWasted: number;
  wasteCost: number;
};

type DashboardResponse = {
  sales: Sales;
  inventory: Inventory;
  productSales: ProductSale[];
  profitability: ProductSale[];
  hourlySales: HourlySale[];
  waste: WasteItem[];
};

// ─── API ─────────────────────────────────────────────────────────────────────
const API_BASE = "https://latch-viewing-crop.ngrok-free.dev/api";

async function fetchDashboard(): Promise<DashboardResponse> {
  const res = await fetch(`${API_BASE}/analytics/dashboard`);
  if (!res.ok) throw new Error(`Dashboard ${res.status}`);
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

const fmtCompact = (n: number) => {
  if (!Number.isFinite(n)) return "0";
  if (Math.abs(n) >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return `${n.toFixed(0)}`;
};

const fmtNumber = (n: number) =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(
    Number.isFinite(n) ? n : 0,
  );

const fmtPercent = (n: number) => `${(Number.isFinite(n) ? n : 0).toFixed(1)}%`;

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

/** Count-up hook with easeOutCubic */
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

// ─── Subcomponents ───────────────────────────────────────────────────────────
function HeroCard({ sales }: { sales: Sales }) {
  const barAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    barAnim.setValue(0);
    Animated.timing(barAnim, {
      toValue: Math.min(1, Math.max(0, (sales.marginPercent || 0) / 100)),
      duration: 1000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [sales.marginPercent, barAnim]);

  return (
    <FadeSlideIn delay={40} translateY={-8}>
      <View style={styles.hero}>
        <View style={styles.heroDecor1} />
        <View style={styles.heroDecor2} />

        <Text style={styles.heroEyebrow}>Tableau de bord · Temps réel</Text>
        <Text style={styles.heroLabel}>Revenus totaux</Text>
        <AnimatedNumber
          value={sales.revenue}
          format={(n) => fmtCurrency(n)}
          style={styles.heroValue}
        />

        <View style={styles.heroDivider} />

        <View style={styles.heroStatsRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroMiniLabel}>Commandes</Text>
            <AnimatedNumber
              value={sales.ordersCount}
              format={fmtNumber}
              style={styles.heroMiniValue}
            />
          </View>
          <View style={styles.heroStatDivider} />
          <View style={{ flex: 1 }}>
            <Text style={styles.heroMiniLabel}>Unités</Text>
            <AnimatedNumber
              value={sales.unitsSold}
              format={fmtNumber}
              style={styles.heroMiniValue}
            />
          </View>
          <View style={styles.heroStatDivider} />
          <View style={{ flex: 1 }}>
            <Text style={styles.heroMiniLabel}>Profit</Text>
            <AnimatedNumber
              value={sales.grossProfit}
              format={(n) => fmtCurrency(n, 0)}
              style={[styles.heroMiniValue, { color: "#4ADE80" }]}
            />
          </View>
        </View>

        {/* Margin bar */}
        <View style={styles.marginBarHeader}>
          <Text style={styles.marginBarLabel}>Marge moyenne</Text>
          <Text style={styles.marginBarValue}>
            {fmtPercent(sales.marginPercent)}
          </Text>
        </View>
        <View style={styles.marginBarTrack}>
          <Animated.View
            style={[
              styles.marginBarFill,
              {
                width: barAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "100%"],
                }),
              },
            ]}
          />
        </View>
      </View>
    </FadeSlideIn>
  );
}

function KpiTile({
  label,
  value,
  format,
  icon,
  accent,
  bg,
  delay,
}: {
  label: string;
  value: number;
  format: (n: number) => string;
  icon: string;
  accent: string;
  bg: string;
  delay: number;
}) {
  return (
    <FadeSlideIn delay={delay} style={styles.kpiWrap}>
      <View style={styles.kpiTile}>
        <View style={[styles.kpiIconWrap, { backgroundColor: bg }]}>
          <Text style={[styles.kpiIconText, { color: accent }]}>{icon}</Text>
        </View>
        <Text style={styles.kpiLabel}>{label}</Text>
        <AnimatedNumber value={value} format={format} style={styles.kpiValue} />
      </View>
    </FadeSlideIn>
  );
}

function HourlyChart({ data }: { data: HourlySale[] }) {
  // Show only hours with data OR all hours 6-22 for context
  const visible = data.filter((h) => h.hour >= 6 && h.hour <= 22);
  const max = Math.max(1, ...visible.map((h) => h.revenue));

  return (
    <FadeSlideIn delay={240}>
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <View>
            <Text style={styles.chartTitle}>Ventes par heure</Text>
            <Text style={styles.chartSubtitle}>Aujourd'hui</Text>
          </View>
          <View style={styles.chartLegendBadge}>
            <View
              style={[styles.legendDot, { backgroundColor: colors.accent }]}
            />
            <Text style={styles.legendText}>Revenus</Text>
          </View>
        </View>

        <View style={styles.chartBody}>
          {visible.map((h) => {
            const ratio = h.revenue / max;
            const hasData = h.revenue > 0;
            return (
              <View key={h.hour} style={styles.chartCol}>
                <View style={styles.chartBarTrack}>
                  <AnimatedBar ratio={ratio} active={hasData} />
                </View>
                <Text
                  style={[
                    styles.chartHourLabel,
                    hasData && styles.chartHourLabelActive,
                  ]}
                >
                  {h.hour}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={styles.chartFooter}>
          <Text style={styles.chartFooterText}>
            Pic :{" "}
            <Text style={styles.chartFooterValue}>
              {visible.reduce(
                (best, h) => (h.revenue > best.revenue ? h : best),
                visible[0],
              )?.hour ?? 0}
              h
            </Text>
          </Text>
          <Text style={styles.chartFooterText}>
            Total :{" "}
            <Text style={styles.chartFooterValue}>
              {fmtCurrency(
                visible.reduce((s, h) => s + h.revenue, 0),
                0,
              )}
            </Text>
          </Text>
        </View>
      </View>
    </FadeSlideIn>
  );
}

function AnimatedBar({ ratio, active }: { ratio: number; active: boolean }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: ratio,
      duration: 700,
      delay: 100,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [ratio, anim]);

  return (
    <Animated.View
      style={[
        styles.chartBar,
        active && styles.chartBarActive,
        {
          height: anim.interpolate({
            inputRange: [0, 1],
            outputRange: ["4%", "100%"],
          }),
        },
      ]}
    />
  );
}

function TopProducts({ data }: { data: ProductSale[] }) {
  const top = data.slice(0, 5);
  const maxRevenue = Math.max(1, ...top.map((p) => p.revenue));

  const medal = (i: number) => {
    if (i === 0) return "🥇";
    if (i === 1) return "🥈";
    if (i === 2) return "🥉";
    return null;
  };

  return (
    <FadeSlideIn delay={300}>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Top produits</Text>
            <Text style={styles.sectionSubtitle}>Par revenus</Text>
          </View>
          <View style={styles.sectionBadge}>
            <Text style={styles.sectionBadgeText}>{data.length}</Text>
          </View>
        </View>

        {top.map((p, i) => {
          const ratio = p.revenue / maxRevenue;
          const m = medal(i);
          return (
            <FadeSlideIn key={p.productId} delay={320 + i * 60}>
              <View style={styles.topRow}>
                <View style={styles.topRank}>
                  {m ? (
                    <Text style={styles.topMedal}>{m}</Text>
                  ) : (
                    <Text style={styles.topRankNum}>{i + 1}</Text>
                  )}
                </View>
                <View style={styles.topBody}>
                  <View style={styles.topRowTop}>
                    <Text style={styles.topName} numberOfLines={1}>
                      {p.productName}
                    </Text>
                    <Text style={styles.topRevenue}>
                      {fmtCurrency(p.revenue, 2)}
                    </Text>
                  </View>
                  <View style={styles.topProgressTrack}>
                    <AnimatedProgressBar
                      ratio={ratio}
                      color={i === 0 ? colors.accent : colors.accentSoft}
                    />
                  </View>
                  <View style={styles.topMetaRow}>
                    <Text style={styles.topMeta}>{p.unitsSold} vendus</Text>
                    <Text style={styles.topMeta}>
                      Marge · {fmtPercent(p.marginPercent)}
                    </Text>
                  </View>
                </View>
              </View>
            </FadeSlideIn>
          );
        })}
      </View>
    </FadeSlideIn>
  );
}

function AnimatedProgressBar({
  ratio,
  color,
}: {
  ratio: number;
  color: string;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: ratio,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [ratio, anim]);

  return (
    <View style={styles.progressTrack}>
      <Animated.View
        style={[
          styles.progressFill,
          {
            backgroundColor: color,
            width: anim.interpolate({
              inputRange: [0, 1],
              outputRange: ["0%", "100%"],
            }),
          },
        ]}
      />
    </View>
  );
}

function Profitability({ data }: { data: ProductSale[] }) {
  const sorted = [...data].sort((a, b) => b.marginPercent - a.marginPercent);

  return (
    <FadeSlideIn delay={400}>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Rentabilité</Text>
            <Text style={styles.sectionSubtitle}>Classé par marge</Text>
          </View>
          <View
            style={[
              styles.sectionBadge,
              { backgroundColor: colors.successSoft },
            ]}
          >
            <Text style={[styles.sectionBadgeText, { color: colors.success }]}>
              %
            </Text>
          </View>
        </View>

        {sorted.map((p, i) => {
          const isHigh = p.marginPercent >= 60;
          const isMid = p.marginPercent >= 40 && p.marginPercent < 60;
          const barColor = isHigh
            ? colors.success
            : isMid
              ? colors.warning
              : colors.danger;
          const pct = Math.min(100, Math.max(0, p.marginPercent));
          return (
            <FadeSlideIn key={p.productId} delay={420 + i * 50}>
              <View style={styles.profitRow}>
                <View style={styles.profitLeft}>
                  <Text style={styles.profitName} numberOfLines={1}>
                    {p.productName}
                  </Text>
                  <Text style={styles.profitMeta}>
                    Profit · {fmtCurrency(p.grossProfit, 2)}
                  </Text>
                </View>
                <View style={styles.profitRight}>
                  <Text style={[styles.profitPct, { color: barColor }]}>
                    {fmtPercent(p.marginPercent)}
                  </Text>
                  <View style={styles.profitBarTrack}>
                    <AnimatedProgressBar ratio={pct / 100} color={barColor} />
                  </View>
                </View>
              </View>
            </FadeSlideIn>
          );
        })}
      </View>
    </FadeSlideIn>
  );
}

function InventorySnapshot({ inv }: { inv: Inventory }) {
  return (
    <FadeSlideIn delay={480}>
      <View style={styles.inventoryCard}>
        <View style={styles.inventoryDecor} />

        <View style={styles.inventoryHeader}>
          <View style={styles.inventoryIconWrap}>
            <Text style={{ fontSize: 18 }}>📦</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.inventoryEyebrow}>Inventaire</Text>
            <Text style={styles.inventoryTitle}>Valeur du stock</Text>
          </View>
        </View>

        <AnimatedNumber
          value={inv.stockValue}
          format={(n) => fmtCurrency(n)}
          style={styles.inventoryValue}
        />

        <View style={styles.inventoryGrid}>
          <View style={styles.inventoryGridItem}>
            <Text style={styles.inventoryGridLabel}>Revenu potentiel</Text>
            <AnimatedNumber
              value={inv.potentialRevenue}
              format={(n) => fmtCurrency(n, 0)}
              style={styles.inventoryGridValue}
            />
          </View>
          <View style={styles.inventoryGridItem}>
            <Text style={styles.inventoryGridLabel}>Profit potentiel</Text>
            <AnimatedNumber
              value={inv.potentialProfit}
              format={(n) => fmtCurrency(n, 0)}
              style={[styles.inventoryGridValue, { color: "#4ADE80" }]}
            />
          </View>
        </View>

        <View style={styles.inventoryFooter}>
          <View style={styles.inventoryFooterItem}>
            <Text style={styles.inventoryFooterValue}>{inv.totalProducts}</Text>
            <Text style={styles.inventoryFooterLabel}>Produits</Text>
          </View>
          <View style={styles.inventoryFooterDivider} />
          <View style={styles.inventoryFooterItem}>
            <Text style={[styles.inventoryFooterValue, { color: "#FBBF24" }]}>
              {inv.lowStock}
            </Text>
            <Text style={styles.inventoryFooterLabel}>Stock bas</Text>
          </View>
          <View style={styles.inventoryFooterDivider} />
          <View style={styles.inventoryFooterItem}>
            <Text style={[styles.inventoryFooterValue, { color: "#F87171" }]}>
              {inv.outOfStock}
            </Text>
            <Text style={styles.inventoryFooterLabel}>Rupture</Text>
          </View>
        </View>
      </View>
    </FadeSlideIn>
  );
}

function WasteAlert({ data }: { data: WasteItem[] }) {
  if (!data || data.length === 0) return null;
  const totalCost = data.reduce((s, w) => s + w.wasteCost, 0);

  return (
    <FadeSlideIn delay={540}>
      <View style={styles.wasteCard}>
        <View style={styles.wasteIconWrap}>
          <Text style={{ fontSize: 18 }}>🗑️</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.wasteTop}>
            <Text style={styles.wasteTitle}>Pertes & gaspillage</Text>
            <Text style={styles.wasteCost}>−{fmtCurrency(totalCost, 2)}</Text>
          </View>
          <Text style={styles.wasteSub}>
            {data.length} produit{data.length > 1 ? "s" : ""} gaspillé
            {data.length > 1 ? "s" : ""}
          </Text>
          <View style={styles.wasteList}>
            {data.map((w) => (
              <View key={w.productId} style={styles.wasteItem}>
                <Text style={styles.wasteItemName} numberOfLines={1}>
                  {w.productName}
                </Text>
                <Text style={styles.wasteItemQty}>×{w.quantityWasted}</Text>
                <Text style={styles.wasteItemCost}>
                  {fmtCurrency(w.wasteCost, 2)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </FadeSlideIn>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────
function Skeleton({ style }: { style?: any }) {
  const pulse = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  return (
    <Animated.View
      style={[
        {
          backgroundColor: colors.surfaceAlt,
          opacity: pulse,
          borderRadius: 14,
        },
        style,
      ]}
    />
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────
export default function AnalyticsDashboardScreen() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const res = await fetchDashboard();
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const hourlyTotal = useMemo(
    () => data?.hourlySales.reduce((s, h) => s + h.revenue, 0) ?? 0,
    [data],
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <Animated.View style={{ flex: 1, opacity: screenFade }}>
        {/* Header */}
        <FadeSlideIn delay={0} translateY={-8}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>Analytique</Text>
              <Text style={styles.title}>Tableau de bord</Text>
            </View>
            <View style={styles.liveWrap}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>En direct</Text>
            </View>
          </View>
        </FadeSlideIn>

        {loading ? (
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: H_PADDING,
              paddingBottom: 40,
            }}
            showsVerticalScrollIndicator={false}
          >
            <Skeleton style={{ height: 220, marginTop: 14 }} />
            <View
              style={{
                flexDirection: "row",
                gap: CARD_GAP,
                marginTop: CARD_GAP,
              }}
            >
              <Skeleton style={{ flex: 1, height: 120 }} />
              <Skeleton style={{ flex: 1, height: 120 }} />
            </View>
            <View
              style={{
                flexDirection: "row",
                gap: CARD_GAP,
                marginTop: CARD_GAP,
              }}
            >
              <Skeleton style={{ flex: 1, height: 120 }} />
              <Skeleton style={{ flex: 1, height: 120 }} />
            </View>
            <Skeleton style={{ height: 240, marginTop: CARD_GAP }} />
            <Skeleton style={{ height: 300, marginTop: CARD_GAP }} />
          </ScrollView>
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
        ) : data ? (
          <ScrollView
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => load(true)}
                tintColor={colors.accent}
                colors={[colors.accent]}
              />
            }
          >
            <View style={{ paddingHorizontal: H_PADDING }}>
              <HourlyChart data={data.hourlySales} />
            </View>

            <View style={{ paddingHorizontal: H_PADDING }}>
              <TopProducts data={data.productSales} />
            </View>

            <View style={{ paddingHorizontal: H_PADDING }}>
              <Profitability data={data.profitability} />
            </View>

            <View style={{ paddingHorizontal: H_PADDING }}>
              <InventorySnapshot inv={data.inventory} />
            </View>

            <View style={{ paddingHorizontal: H_PADDING }}>
              <WasteAlert data={data.waste} />
            </View>

            <FadeSlideIn delay={600}>
              <Text style={styles.footerNote}>
                Données mises à jour à chaque rafraîchissement · Tire vers le
                bas pour actualiser
              </Text>
            </FadeSlideIn>
          </ScrollView>
        ) : null}
      </Animated.View>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const SOFT_SHADOW = Platform.select({
  ios: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
  },
  android: { elevation: 2 },
  default: {},
});

const HEAVY_SHADOW = Platform.select({
  ios: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.24,
    shadowRadius: 24,
  },
  android: { elevation: 8 },
  default: {},
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  // Header
  header: {
    paddingHorizontal: H_PADDING,
    paddingTop: 10,
    paddingBottom: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.accent,
    letterSpacing: 1.3,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: -0.9,
  },
  liveWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
    ...SOFT_SHADOW,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  liveText: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: 0.4,
  },

  // ─── HERO ──────────────────────────────────────────────────────────────────
  hero: {
    marginTop: 14,
    backgroundColor: colors.primary,
    borderRadius: 28,
    padding: 24,
    overflow: "hidden",
    ...HEAVY_SHADOW,
  },
  heroDecor1: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: colors.accent,
    opacity: 0.15,
    top: -80,
    right: -70,
  },
  heroDecor2: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.gold,
    opacity: 0.08,
    bottom: -50,
    left: -40,
  },
  heroEyebrow: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.accentSoft,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  heroLabel: {
    fontSize: 13,
    color: "rgba(255,255,255,0.65)",
    fontWeight: "600",
  },
  heroValue: {
    fontSize: 42,
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: -1.4,
    marginTop: 6,
  },
  heroDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
    marginVertical: 20,
  },
  heroStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  heroStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  heroMiniLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  heroMiniValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: -0.3,
  },
  marginBarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 22,
    marginBottom: 8,
  },
  marginBarLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.65)",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  marginBarValue: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.accentSoft,
  },
  marginBarTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  marginBarFill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: colors.accent,
  },

  // ─── KPI ───────────────────────────────────────────────────────────────────
  kpiGrid: {
    flexDirection: "row",
    paddingHorizontal: H_PADDING,
    gap: CARD_GAP,
    marginTop: CARD_GAP,
  },
  kpiWrap: { flex: 1 },
  kpiTile: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    ...SOFT_SHADOW,
  },
  kpiIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  kpiIconText: { fontSize: 18 },
  kpiLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.muted,
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.primary,
    marginTop: 6,
    letterSpacing: -0.5,
  },

  // ─── CHART ─────────────────────────────────────────────────────────────────
  chartCard: {
    marginTop: 18,
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    ...SOFT_SHADOW,
  },
  chartHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: -0.3,
  },
  chartSubtitle: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.muted,
    marginTop: 3,
  },
  chartLegendBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: colors.surfaceAlt,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  legendText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.muted,
    letterSpacing: 0.3,
  },
  chartBody: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 3,
    height: 130,
  },
  chartCol: {
    flex: 1,
    alignItems: "center",
    height: "100%",
    justifyContent: "flex-end",
  },
  chartBarTrack: {
    width: "100%",
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: colors.surfaceAlt,
    borderRadius: 6,
    overflow: "hidden",
  },
  chartBar: {
    width: "100%",
    backgroundColor: colors.border,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  chartBarActive: {
    backgroundColor: colors.accent,
  },
  chartHourLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: colors.mutedLight,
    marginTop: 6,
  },
  chartHourLabelActive: {
    color: colors.primary,
    fontWeight: "800",
  },
  chartFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  chartFooterText: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: "600",
  },
  chartFooterValue: {
    color: colors.primary,
    fontWeight: "800",
  },

  // ─── SECTIONS ──────────────────────────────────────────────────────────────
  section: {
    marginTop: 18,
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    ...SOFT_SHADOW,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.muted,
    marginTop: 3,
  },
  sectionBadge: {
    minWidth: 32,
    height: 32,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionBadgeText: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.primary,
  },

  // ─── TOP PRODUCTS ──────────────────────────────────────────────────────────
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  topRank: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  topMedal: { fontSize: 18 },
  topRankNum: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.muted,
  },
  topBody: { flex: 1, gap: 6 },
  topRowTop: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 8,
  },
  topName: {
    flex: 1,
    fontSize: 13,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.2,
  },
  topRevenue: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.accent,
    letterSpacing: -0.2,
  },
  topProgressTrack: {
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.surfaceAlt,
    overflow: "hidden",
  },
  progressTrack: {
    height: "100%",
    backgroundColor: colors.surfaceAlt,
    borderRadius: 2.5,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2.5,
  },
  topMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  topMeta: {
    fontSize: 10,
    color: colors.muted,
    fontWeight: "600",
  },

  // ─── PROFITABILITY ─────────────────────────────────────────────────────────
  profitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  profitLeft: { flex: 1 },
  profitName: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.2,
  },
  profitMeta: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 3,
    fontWeight: "600",
  },
  profitRight: {
    alignItems: "flex-end",
    width: 110,
    gap: 4,
  },
  profitPct: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  profitBarTrack: {
    width: "100%",
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.surfaceAlt,
    overflow: "hidden",
  },

  // ─── INVENTORY ─────────────────────────────────────────────────────────────
  inventoryCard: {
    marginTop: 18,
    backgroundColor: colors.primary,
    borderRadius: 24,
    padding: 22,
    overflow: "hidden",
    ...HEAVY_SHADOW,
  },
  inventoryDecor: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: colors.accent,
    opacity: 0.12,
    top: -60,
    right: -50,
  },
  inventoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  inventoryIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  inventoryEyebrow: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.accentSoft,
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  inventoryTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFF",
    marginTop: 3,
  },
  inventoryValue: {
    fontSize: 34,
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: -1,
    marginBottom: 20,
  },
  inventoryGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
  },
  inventoryGridItem: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    padding: 12,
    borderRadius: 14,
  },
  inventoryGridLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.6)",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  inventoryGridValue: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFF",
    marginTop: 5,
    letterSpacing: -0.3,
  },
  inventoryFooter: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    paddingVertical: 12,
  },
  inventoryFooterItem: {
    flex: 1,
    alignItems: "center",
  },
  inventoryFooterDivider: {
    width: 1,
    height: 26,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  inventoryFooterValue: {
    fontSize: 17,
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: -0.3,
  },
  inventoryFooterLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.6)",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginTop: 3,
  },

  // ─── WASTE ─────────────────────────────────────────────────────────────────
  wasteCard: {
    marginTop: 18,
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.dangerSoft,
    flexDirection: "row",
    gap: 14,
    ...SOFT_SHADOW,
  },
  wasteIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.dangerSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  wasteTop: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 10,
  },
  wasteTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.2,
  },
  wasteCost: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.danger,
    letterSpacing: -0.2,
  },
  wasteSub: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 3,
    fontWeight: "600",
  },
  wasteList: {
    marginTop: 12,
    gap: 6,
  },
  wasteItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  wasteItemName: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
  },
  wasteItemQty: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.muted,
    minWidth: 28,
    textAlign: "center",
  },
  wasteItemCost: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.danger,
    minWidth: 60,
    textAlign: "right",
  },

  // ─── CENTER / ERROR ────────────────────────────────────────────────────────
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
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

  footerNote: {
    marginTop: 22,
    paddingHorizontal: H_PADDING,
    fontSize: 11,
    color: colors.mutedLight,
    textAlign: "center",
    lineHeight: 16,
    fontWeight: "500",
  },
});
