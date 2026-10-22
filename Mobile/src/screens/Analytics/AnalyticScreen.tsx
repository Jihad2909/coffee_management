// src/screens/AnalyticsScreen.tsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Theme (matches InventoryScreen) ─────────────────────────────────────────
const colors = {
  primary: "#2B1810",
  primarySoft: "#3E2723",
  accent: "#C67C4E",
  accentSoft: "#E8B98A",
  accentDeep: "#8B5A34",
  background: "#FAF6F1",
  surface: "#FFFFFF",
  surfaceAlt: "#F5EEE6",
  text: "#1A1208",
  muted: "#8A7B6B",
  mutedLight: "#B8A99A",
  border: "#EFE6DA",
  borderStrong: "#E2D5C4",
  success: "#2E7D32",
  successBg: "#E8F5E9",
  warning: "#E68A00",
  warningBg: "#FFF4E0",
  danger: "#C62828",
  dangerBg: "#FFEBEE",
  info: "#1565C0",
  infoBg: "#E3F2FD",
  gold: "#D4A055",
  shadow: "#3E2723",
};

const { width: SCREEN_W } = Dimensions.get("window");
const CARD_GAP = 12;
const H_PADDING = 20;

// ─── Types ───────────────────────────────────────────────────────────────────
export type SalesPeriodResponse = {
  revenue: number;
  coutDesProduitsVendus: number;
  grossProfit: number;
  marginPercent: number;
  ordersCount: number;
  unitsSold: number;
};

export type SalesSummaryResponse = SalesPeriodResponse & {
  // backend may include extra fields (e.g. previous period);
  // we only consume the same shape here.
};

type Period = "today" | "week" | "month" | "all";

// ─── API ─────────────────────────────────────────────────────────────────────
const API_BASE = "https://latch-viewing-crop.ngrok-free.dev/api";

const ENDPOINTS: Record<Period, string> = {
  today: `${API_BASE}/orders/summary/today`,
  week: `${API_BASE}/orders/summary/week`,
  month: `${API_BASE}/orders/summary/month`,
  all: `${API_BASE}/orders/summary`,
};

async function fetchSummary(period: Period): Promise<SalesPeriodResponse> {
  const res = await fetch(ENDPOINTS[period]);
  if (!res.ok) throw new Error(`Summary failed (${res.status})`);
  const data = await res.json();
  // Defensive: ensure numerics (backend may send null)
  return {
    revenue: Number(data?.revenue ?? 0),
    coutDesProduitsVendus: Number(data?.coutDesProduitsVendus ?? 0),
    grossProfit: Number(data?.grossProfit ?? 0),
    marginPercent: Number(data?.marginPercent ?? 0),
    ordersCount: Number(data?.ordersCount ?? 0),
    unitsSold: Number(data?.unitsSold ?? 0),
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmtCurrency = (n: number) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "TND",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);

const fmtNumber = (n: number) =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(
    Number.isFinite(n) ? n : 0,
  );

const fmtPercent = (n: number) =>
  `${(Number.isFinite(n) ? n : 0).toFixed(1)} %`;

// ─── Motion primitives ───────────────────────────────────────────────────────
function FadeSlideIn({
  children,
  delay = 0,
  translateY = 14,
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
      duration: 480,
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

function ScalePressable({
  children,
  style,
  onPress,
  activeScale = 0.96,
  disabled,
  ...rest
}: any) {
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn = () =>
    Animated.spring(scale, {
      toValue: activeScale,
      useNativeDriver: true,
      speed: 40,
      bounciness: 4,
    }).start();
  const onPressOut = () =>
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 6,
    }).start();
  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled}
        android_ripple={{ color: "rgba(0,0,0,0.05)" }}
        {...rest}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

/**
 * Counts from 0 (or previous value) up to `value` with a smooth ease.
 * Renders via a state number so the text updates each frame.
 */
function useCountUp(value: number, duration = 800) {
  const [display, setDisplay] = useState(0);
  const prevRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const start = prevRef.current;
    const end = Number.isFinite(value) ? value : 0;
    const startTs = Date.now();

    const tick = () => {
      const t = Math.min(1, (Date.now() - startTs) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      const current = start + (end - start) * eased;
      setDisplay(current);
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

// ─── Subcomponents ───────────────────────────────────────────────────────────
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

/** Big "hero" card with revenue + margin bar. */
function HeroCard({
  data,
  period,
}: {
  data: SalesPeriodResponse;
  period: Period;
}) {
  const periodLabel =
    period === "today"
      ? "Aujourd'hui"
      : period === "week"
        ? "Cette semaine"
        : period === "month"
          ? "Ce mois"
          : "Global";

  const barAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    barAnim.setValue(0);
    Animated.timing(barAnim, {
      toValue: Math.min(1, Math.max(0, (data.marginPercent || 0) / 100)),
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [data.marginPercent, barAnim]);

  return (
    <FadeSlideIn delay={40}>
      <View style={styles.hero}>
        {/* Decorative circles */}
        <View style={styles.heroDecor1} />
        <View style={styles.heroDecor2} />

        <Text style={styles.heroEyebrow}>{periodLabel}</Text>
        <Text style={styles.heroLabel}>Chiffre d'affaires</Text>
        <AnimatedNumber
          value={data.revenue}
          format={fmtCurrency}
          style={styles.heroValue}
        />

        <View style={styles.heroDivider} />

        <View style={styles.heroRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroSmallLabel}>Marge</Text>
            <AnimatedNumber
              value={data.marginPercent}
              format={fmtPercent}
              style={styles.heroSmallValue}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroSmallLabel}>Commandes</Text>
            <AnimatedNumber
              value={data.ordersCount}
              format={fmtNumber}
              style={styles.heroSmallValue}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroSmallLabel}>Unités</Text>
            <AnimatedNumber
              value={data.unitsSold}
              format={fmtNumber}
              style={styles.heroSmallValue}
            />
          </View>
        </View>

        {/* Margin bar */}
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
        <View style={styles.marginBarLegend}>
          <Text style={styles.marginBarLegendText}>0%</Text>
          <Text style={styles.marginBarLegendText}>Marge · 100%</Text>
        </View>
      </View>
    </FadeSlideIn>
  );
}

/** Small KPI tile. */
function KpiCard({
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
      <View style={styles.kpiCard}>
        <View style={[styles.kpiIcon, { backgroundColor: bg }]}>
          <Text style={[styles.kpiIconText, { color: accent }]}>{icon}</Text>
        </View>
        <Text style={styles.kpiLabel}>{label}</Text>
        <AnimatedNumber value={value} format={format} style={styles.kpiValue} />
      </View>
    </FadeSlideIn>
  );
}

/**
 * Simple bar chart of the 4 periods. Bars resize when data changes.
 */
function ComparisonChart({
  series,
  activePeriod,
  onSelect,
}: {
  series: { period: Period; label: string; value: number }[];
  activePeriod: Period;
  onSelect: (p: Period) => void;
}) {
  const max = Math.max(1, ...series.map((s) => s.value));
  const bars = series.map((s) => {
    const anim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
      Animated.timing(anim, {
        toValue: s.value / max,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    }, [s.value, max, anim]);
    return { ...s, anim };
  });

  return (
    <FadeSlideIn delay={120}>
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Comparaison des périodes</Text>
          <Text style={styles.chartSub}>Revenus</Text>
        </View>

        <View style={styles.chartBody}>
          {bars.map((b) => {
            const active = b.period === activePeriod;
            return (
              <TouchableOpacity
                key={b.period}
                style={styles.chartCol}
                onPress={() => onSelect(b.period)}
                activeOpacity={0.85}
              >
                <View style={styles.chartBarTrack}>
                  <Animated.View
                    style={[
                      styles.chartBar,
                      active && styles.chartBarActive,
                      {
                        height: b.anim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ["0%", "100%"],
                        }),
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.chartColLabel,
                    active && { color: colors.primary, fontWeight: "800" },
                  ]}
                >
                  {b.label}
                </Text>
                <Text
                  style={[
                    styles.chartColValue,
                    active && { color: colors.accent },
                  ]}
                  numberOfLines={1}
                >
                  {fmtCurrency(b.value).replace(/\s?€/, "€")}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </FadeSlideIn>
  );
}

/** Detail rows (COGS, gross profit, etc.). */
function DetailRow({
  label,
  value,
  format,
  accent,
  delay,
}: {
  label: string;
  value: number;
  format: (n: number) => string;
  accent?: string;
  delay: number;
}) {
  return (
    <FadeSlideIn delay={delay}>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>{label}</Text>
        <AnimatedNumber
          value={value}
          format={format}
          style={[styles.detailValue, accent ? { color: accent } : null]}
        />
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

function LoadingSkeleton() {
  return (
    <View style={{ paddingHorizontal: H_PADDING }}>
      <Skeleton style={{ height: 180, marginTop: 12 }} />
      <View style={{ flexDirection: "row", gap: CARD_GAP, marginTop: 12 }}>
        <Skeleton style={{ flex: 1, height: 110 }} />
        <Skeleton style={{ flex: 1, height: 110 }} />
      </View>
      <View style={{ flexDirection: "row", gap: CARD_GAP, marginTop: 12 }}>
        <Skeleton style={{ flex: 1, height: 110 }} />
        <Skeleton style={{ flex: 1, height: 110 }} />
      </View>
      <Skeleton style={{ height: 200, marginTop: 12 }} />
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────
export default function AnalyticsScreen() {
  const [period, setPeriod] = useState<Period>("today");
  const [current, setCurrent] = useState<SalesPeriodResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cache of all 4 periods so the chart can compare them
  const [allPeriods, setAllPeriods] = useState<
    Record<Period, SalesPeriodResponse | null>
  >({
    today: null,
    week: null,
    month: null,
    all: null,
  });

  const screenFade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(screenFade, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [screenFade]);

  const loadPeriod = useCallback(
    async (p: Period, isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else if (current == null) setLoading(true);
      setError(null);
      try {
        const data = await fetchSummary(p);
        setCurrent(data);
        setAllPeriods((prev) => ({ ...prev, [p]: data }));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur de chargement");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [current],
  );

  // Initial: fetch all 4 periods in parallel so the chart can render immediately
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [today, week, month, all] = await Promise.all([
          fetchSummary("today"),
          fetchSummary("week"),
          fetchSummary("month"),
          fetchSummary("all"),
        ]);
        if (cancelled) return;
        setAllPeriods({ today, week, month, all });
        setCurrent(today);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Erreur de chargement");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // When user picks a period, refetch just that one (cheap) unless cached
  useEffect(() => {
    if (allPeriods[period]) {
      setCurrent(allPeriods[period]!);
      return;
    }
    loadPeriod(period);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const onRefresh = useCallback(() => {
    loadPeriod(period, true);
  }, [period, loadPeriod]);

  const chartSeries = useMemo(
    () => [
      {
        period: "today" as Period,
        label: "Auj.",
        value: allPeriods.today?.revenue ?? 0,
      },
      {
        period: "week" as Period,
        label: "Sem.",
        value: allPeriods.week?.revenue ?? 0,
      },
      {
        period: "month" as Period,
        label: "Mois",
        value: allPeriods.month?.revenue ?? 0,
      },
      {
        period: "all" as Period,
        label: "Global",
        value: allPeriods.all?.revenue ?? 0,
      },
    ],
    [allPeriods],
  );

  const segments: { key: Period; label: string }[] = [
    { key: "today", label: "Aujourd'hui" },
    { key: "week", label: "Semaine" },
    { key: "month", label: "Mois" },
    { key: "all", label: "Global" },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <Animated.View style={{ flex: 1, opacity: screenFade }}>
        {/* Header */}
        <FadeSlideIn delay={0} translateY={-8}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>Analytique</Text>
              <Text style={styles.title}>Ventes</Text>
            </View>
            <View style={styles.liveDotWrap}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>Live</Text>
            </View>
          </View>
        </FadeSlideIn>

        {/* Period segmented control */}
        <FadeSlideIn delay={70}>
          <View style={styles.segmentWrap}>
            {segments.map((s) => {
              const active = period === s.key;
              return (
                <ScalePressable
                  key={s.key}
                  onPress={() => setPeriod(s.key)}
                  style={[styles.segment, active && styles.segmentActive]}
                  activeScale={0.95}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      active && styles.segmentTextActive,
                    ]}
                  >
                    {s.label}
                  </Text>
                </ScalePressable>
              );
            })}
          </View>
        </FadeSlideIn>

        {/* Content */}
        {loading ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            <LoadingSkeleton />
          </ScrollView>
        ) : error ? (
          <View style={styles.center}>
            <View style={styles.errorBubble}>
              <Text style={styles.errorBubbleIcon}>⚠️</Text>
            </View>
            <Text style={styles.errorTitle}>Impossible de charger</Text>
            <Text style={styles.errorText}>{error}</Text>
            <ScalePressable
              style={styles.retryBtn}
              onPress={() => loadPeriod(period)}
            >
              <Text style={styles.retryText}>Réessayer</Text>
            </ScalePressable>
          </View>
        ) : current ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.accent}
                colors={[colors.accent]}
              />
            }
          >
            <HeroCard data={current} period={period} />

            {/* KPI grid */}
            <View style={styles.kpiGrid}>
              <KpiCard
                delay={120}
                label="Coût des produits"
                value={current.coutDesProduitsVendus}
                format={fmtCurrency}
                icon="📦"
                accent={colors.warning}
                bg={colors.warningBg}
              />
              <KpiCard
                delay={160}
                label="Profit brut"
                value={current.grossProfit}
                format={fmtCurrency}
                icon="📈"
                accent={colors.success}
                bg={colors.successBg}
              />
            </View>
            <View style={styles.kpiGrid}>
              <KpiCard
                delay={200}
                label="Commandes"
                value={current.ordersCount}
                format={fmtNumber}
                icon="🧾"
                accent={colors.info}
                bg={colors.infoBg}
              />
              <KpiCard
                delay={240}
                label="Unités vendues"
                value={current.unitsSold}
                format={fmtNumber}
                icon="☕️"
                accent={colors.accentDeep}
                bg={colors.surfaceAlt}
              />
            </View>

            {/* Comparison chart */}
            <ComparisonChart
              series={chartSeries}
              activePeriod={period}
              onSelect={setPeriod}
            />

            {/* Details */}
            <View style={styles.detailCard}>
              <Text style={styles.detailTitle}>Détails financiers</Text>
              <DetailRow
                delay={320}
                label="Chiffre d'affaires"
                value={current.revenue}
                format={fmtCurrency}
              />
              <View style={styles.detailSep} />
              <DetailRow
                delay={340}
                label="Coût des produits vendus"
                value={current.coutDesProduitsVendus}
                format={fmtCurrency}
                accent={colors.warning}
              />
              <View style={styles.detailSep} />
              <DetailRow
                delay={360}
                label="Profit brut"
                value={current.grossProfit}
                format={fmtCurrency}
                accent={colors.success}
              />
              <View style={styles.detailSep} />
              <DetailRow
                delay={380}
                label="Marge"
                value={current.marginPercent}
                format={fmtPercent}
                accent={colors.accent}
              />
            </View>

            {/* Footer note */}
            <FadeSlideIn delay={420}>
              <Text style={styles.footerNote}>
                Données mises à jour à chaque rafraîchissement. Tirez vers le
                bas pour actualiser.
              </Text>
            </FadeSlideIn>
          </ScrollView>
        ) : null}
      </Animated.View>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const CARD_SHADOW = Platform.select({
  ios: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  android: { elevation: 2 },
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
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: -0.8,
  },
  liveDotWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
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
    letterSpacing: 0.3,
  },

  // Segmented control
  segmentWrap: {
    flexDirection: "row",
    marginHorizontal: H_PADDING,
    marginTop: 16,
    backgroundColor: colors.surface,
    padding: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    ...CARD_SHADOW,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentActive: {
    backgroundColor: colors.primary,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.muted,
    letterSpacing: -0.1,
  },
  segmentTextActive: { color: "#FFF" },

  // Hero
  hero: {
    marginHorizontal: H_PADDING,
    marginTop: 18,
    borderRadius: 24,
    padding: 22,
    backgroundColor: colors.primary,
    overflow: "hidden",
    ...CARD_SHADOW,
  },
  heroDecor1: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: colors.accent,
    opacity: 0.13,
    top: -60,
    right: -50,
  },
  heroDecor2: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.gold,
    opacity: 0.09,
    bottom: -40,
    left: -30,
  },
  heroEyebrow: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.accentSoft,
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  heroLabel: {
    fontSize: 13,
    color: "#D7C8B7",
    marginTop: 10,
    fontWeight: "600",
  },
  heroValue: {
    fontSize: 38,
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: -1,
    marginTop: 4,
  },
  heroDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
    marginVertical: 18,
  },
  heroRow: { flexDirection: "row", gap: 12 },
  heroSmallLabel: {
    fontSize: 10,
    color: "#B8A99A",
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  heroSmallValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: -0.3,
  },
  marginBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.12)",
    marginTop: 18,
    overflow: "hidden",
  },
  marginBarFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  marginBarLegend: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  marginBarLegendText: {
    fontSize: 10,
    color: "#B8A99A",
    fontWeight: "600",
  },

  // KPI grid
  kpiGrid: {
    flexDirection: "row",
    paddingHorizontal: H_PADDING,
    gap: CARD_GAP,
    marginTop: CARD_GAP,
  },
  kpiWrap: { flex: 1 },
  kpiCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    ...CARD_SHADOW,
  },
  kpiIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  kpiIconText: { fontSize: 18 },
  kpiLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.muted,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.primary,
    marginTop: 6,
    letterSpacing: -0.4,
  },

  // Chart
  chartCard: {
    marginHorizontal: H_PADDING,
    marginTop: 18,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    ...CARD_SHADOW,
  },
  chartHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: -0.3,
  },
  chartSub: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.muted,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  chartBody: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 10,
    height: 170,
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
    borderRadius: 10,
    overflow: "hidden",
  },
  chartBar: {
    width: "100%",
    backgroundColor: colors.accentSoft,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  chartBarActive: {
    backgroundColor: colors.accent,
  },
  chartColLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.muted,
    marginTop: 8,
  },
  chartColValue: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.mutedLight,
    marginTop: 2,
  },

  // Details
  detailCard: {
    marginHorizontal: H_PADDING,
    marginTop: 18,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    ...CARD_SHADOW,
  },
  detailTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.primary,
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.muted,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: -0.2,
  },
  detailSep: {
    height: 1,
    backgroundColor: colors.border,
  },

  footerNote: {
    marginTop: 22,
    paddingHorizontal: H_PADDING + 4,
    fontSize: 11,
    color: colors.mutedLight,
    textAlign: "center",
    lineHeight: 16,
    fontWeight: "500",
  },

  // Center / error
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  errorBubble: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.dangerBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  errorBubbleIcon: { fontSize: 28 },
  errorTitle: { fontSize: 16, fontWeight: "800", color: colors.text },
  errorText: {
    marginTop: 6,
    fontSize: 13,
    color: colors.muted,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  retryBtn: {
    marginTop: 18,
    backgroundColor: colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 14,
    ...CARD_SHADOW,
  },
  retryText: { color: "#FFF", fontWeight: "700", fontSize: 14 },
});
