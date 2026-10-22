// src/screens/OrdersScreen.tsx
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
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
  LayoutAnimation,
  Platform,
  Pressable,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  UIManager,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Theme (matches Analytics / Inventory / POS) ─────────────────────────────
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
  chipBg: "#F3EDE6",
  info: "#1565C0",
  infoBg: "#E3F2FD",
  gold: "#D4A055",
  shadow: "#3E2723",
};

const { width: SCREEN_W } = Dimensions.get("window");
const H_PADDING = 20;

// ─── Types (from your Postman response) ──────────────────────────────────────
export type OrderItem = {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

export type Order = {
  id: number;
  total: number;
  status: string | null;
  createdAt: string;
  items: OrderItem[];
};

type StatusFilter = "all" | "completed" | "pending" | "other";
type DateFilter = "today" | "yesterday" | "week" | "month";

// ─── API ─────────────────────────────────────────────────────────────────────
const API_BASE = "https://latch-viewing-crop.ngrok-free.dev/api";

async function fetchOrders(): Promise<Order[]> {
  const res = await fetch(`${API_BASE}/orders`);
  if (!res.ok) throw new Error(`Failed to load orders (${res.status})`);
  return res.json();
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatPrice(n: number) {
  return new Intl.NumberFormat("fr-TN", {
    style: "currency",
    currency: "TND",
    minimumFractionDigits: 3,
  }).format(n);
}

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

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfWeek(d = new Date()) {
  const x = new Date(d);
  const day = x.getDay();
  const diff = day === 0 ? 6 : day - 1;
  x.setDate(x.getDate() - diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

function matchesDateFilter(iso: string, filter: DateFilter) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  if (filter === "today") return isSameDay(d, now);
  if (filter === "yesterday") {
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    return isSameDay(d, y);
  }
  if (filter === "week") {
    const from = startOfWeek(now);
    return d >= from && d <= now;
  }
  if (filter === "month") {
    const from = startOfMonth(now);
    return d >= from && d <= now;
  }
  return true;
}

// Print receipt
function buildReceiptHtml(order: Order) {
  const rows = (order.items ?? [])
    .map(
      (i) => `
      <tr>
        <td style="padding:6px 0;">${i.productName}</td>
        <td style="text-align:center;">${i.quantity}</td>
        <td style="text-align:right;">${formatPrice(i.unitPrice)}</td>
        <td style="text-align:right;">${formatPrice(i.subtotal)}</td>
      </tr>`,
    )
    .join("");

  const status = order.status ?? "PENDING";

  return `
  <html>
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: -apple-system, Helvetica, Arial, sans-serif; padding: 24px; color: #1a1a1a; }
        h1 { font-size: 20px; margin: 0 0 4px; }
        .meta { color: #666; font-size: 12px; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th { text-align: left; border-bottom: 1px solid #ddd; padding-bottom: 8px; color: #666; }
        td { border-bottom: 1px solid #f0f0f0; }
        .total { margin-top: 16px; font-size: 18px; font-weight: 700; text-align: right; }
        .badge { display:inline-block; padding:4px 10px; border-radius:999px; background:#f3ede6; font-size:11px; }
      </style>
    </head>
    <body>
      <h1>Commande #${order.id}</h1>
      <div class="meta">
        ${formatDate(order.createdAt)} · <span class="badge">${status}</span>
      </div>
      <table>
        <thead>
          <tr>
            <th>Article</th>
            <th style="text-align:center;">Qté</th>
            <th style="text-align:right;">P.U.</th>
            <th style="text-align:right;">Total</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="total">Total : ${formatPrice(order.total)}</div>
    </body>
  </html>`;
}

async function printOrder(order: Order) {
  const html = buildReceiptHtml(order);
  await Print.printAsync({ html });
}

async function shareOrderPdf(order: Order) {
  const html = buildReceiptHtml(order);
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: "application/pdf",
      UTI: "com.adobe.pdf",
    });
  }
}

function normalizeStatus(status: string | null): string {
  if (!status) return "PENDING";
  return status.toUpperCase();
}

function statusMeta(status: string | null) {
  const s = normalizeStatus(status);
  switch (s) {
    case "COMPLETED":
    case "DONE":
    case "PAID":
      return {
        label: "Payée",
        fg: colors.success,
        bg: colors.successBg,
        dot: colors.success,
      };
    case "CANCELLED":
    case "CANCELED":
      return {
        label: "Annulée",
        fg: colors.danger,
        bg: colors.dangerBg,
        dot: colors.danger,
      };
    case "PENDING":
    case "OPEN":
    case "NEW":
      return {
        label: "En attente",
        fg: colors.warning,
        bg: colors.warningBg,
        dot: colors.warning,
      };
    default:
      return { label: s, fg: colors.info, bg: colors.infoBg, dot: colors.info };
  }
}

function itemsCount(order: Order) {
  return order.items?.reduce((s, i) => s + i.quantity, 0) ?? 0;
}

// ─── Motion primitives ───────────────────────────────────────────────────────
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
      duration: 440,
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

// ─── Order card ──────────────────────────────────────────────────────────────
type OrderCardProps = {
  order: Order;
  expanded: boolean;
  onToggle: () => void;
  onPrint: (order: Order) => void;
  index: number;
};

function OrderCard({
  order,
  expanded,
  onToggle,
  onPrint,
  index,
}: OrderCardProps) {
  const meta = statusMeta(order.status);
  const count = itemsCount(order);

  // Animated chevron rotation
  const chevron = useRef(new Animated.Value(expanded ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(chevron, {
      toValue: expanded ? 1 : 0,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [expanded, chevron]);

  const rotate = chevron.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  return (
    <FadeSlideIn delay={Math.min(index * 50, 400)}>
      <View style={styles.card}>
        {/* Top strip */}
        <ScalePressable
          onPress={onToggle}
          activeScale={0.99}
          style={styles.cardPressable}
        >
          <View style={styles.cardTop}>
            <View style={styles.cardTopLeft}>
              <View style={styles.orderIdRow}>
                <View style={styles.orderIdBadge}>
                  <Text style={styles.orderIdText}>#{order.id}</Text>
                </View>
                <View
                  style={[styles.statusBadge, { backgroundColor: meta.bg }]}
                >
                  <View
                    style={[styles.statusDot, { backgroundColor: meta.dot }]}
                  />
                  <Text style={[styles.statusBadgeText, { color: meta.fg }]}>
                    {meta.label}
                  </Text>
                </View>
              </View>
              <Text style={styles.orderDate}>
                {formatDate(order.createdAt)}
              </Text>
            </View>
          </View>

          {/* Mid row */}
          <View style={styles.cardMid}>
            <View style={styles.midLeft}>
              <Text style={styles.itemCountValue}>{count}</Text>
              <Text style={styles.itemCountLabel}>
                article{count > 1 ? "s" : ""}
              </Text>
              <Text style={styles.itemLineCount}>
                · {order.items?.length ?? 0} ligne
                {(order.items?.length ?? 0) > 1 ? "s" : ""}
              </Text>
            </View>
            <View style={styles.midRight}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatPrice(order.total)}</Text>
            </View>
          </View>

          {/* Preview collapsed */}
          {!expanded && order.items?.length > 0 && (
            <View style={styles.previewWrap}>
              <Text style={styles.preview} numberOfLines={1}>
                {order.items.map((i) => i.productName).join(" · ")}
              </Text>
            </View>
          )}

          {/* Expand hint with rotating chevron */}
          <View style={styles.expandHintRow}>
            <Text style={styles.expandHint}>
              {expanded ? "Masquer les détails" : "Voir les détails"}
            </Text>
            <Animated.Text
              style={[styles.expandChevron, { transform: [{ rotate }] }]}
            >
              ▼
            </Animated.Text>
          </View>
        </ScalePressable>

        {/* Expanded items */}
        {expanded && (
          <View style={styles.itemsBox}>
            {order.items?.map((item, idx) => (
              <View
                key={`${item.productId}-${idx}`}
                style={[
                  styles.itemRow,
                  idx < order.items.length - 1 && styles.itemRowBorder,
                ]}
              >
                <View style={styles.itemIndex}>
                  <Text style={styles.itemIndexText}>{idx + 1}</Text>
                </View>
                <View style={styles.itemLeft}>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {item.productName}
                  </Text>
                  <Text style={styles.itemMeta}>
                    {item.quantity} × {formatPrice(item.unitPrice)}
                  </Text>
                </View>
                <Text style={styles.itemSubtotal}>
                  {formatPrice(item.subtotal)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Print button (always visible) */}
        <ScalePressable
          style={styles.printBtn}
          onPress={() => onPrint(order)}
          activeScale={0.97}
        >
          <Text style={styles.printBtnIcon}>🖨️</Text>
          <Text style={styles.printBtnText}>Imprimer le reçu</Text>
        </ScalePressable>
      </View>
    </FadeSlideIn>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────
type OrdersScreenProps = {
  navigation?: { navigate: (s: string, p?: object) => void };
};

export default function OrdersScreen({ navigation }: OrdersScreenProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilter>("today");

  const screenFade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(screenFade, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [screenFade]);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await fetchOrders();
      const list = Array.isArray(data) ? data : [];
      list.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      setOrders(list);
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
    return orders.filter((o) => {
      const s = normalizeStatus(o.status);
      if (filter === "completed") {
        if (!(s === "COMPLETED" || s === "DONE" || s === "PAID")) return false;
      } else if (filter === "pending") {
        if (!(s === "PENDING" || s === "OPEN" || s === "NEW" || !o.status))
          return false;
      }
      if (!matchesDateFilter(o.createdAt, dateFilter)) return false;
      return true;
    });
  }, [orders, filter, dateFilter]);

  const stats = useMemo(() => {
    const totalSales = orders.reduce((s, o) => s + (o.total || 0), 0);
    return { count: orders.length, sales: totalSales };
  }, [orders]);

  const filteredStats = useMemo(() => {
    const total = filtered.reduce((s, o) => s + (o.total || 0), 0);
    return { count: filtered.length, sales: total };
  }, [filtered]);

  function toggleExpand(id: number) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId((prev) => (prev === id ? null : id));
  }

  const dateFilters: { key: DateFilter; label: string }[] = [
    { key: "today", label: "Aujourd'hui" },
    { key: "yesterday", label: "Hier" },
    { key: "week", label: "Cette semaine" },
    { key: "month", label: "Ce mois" },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <Animated.View style={{ flex: 1, opacity: screenFade }}>
        {/* Header */}
        <FadeSlideIn delay={0} translateY={-8}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>Historique</Text>
              <Text style={styles.title}>Commandes</Text>
            </View>
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeCount}>{filteredStats.count}</Text>
              <Text style={styles.headerBadgeLabel}>
                {filteredStats.count === 1 ? "commande" : "commandes"}
              </Text>
            </View>
          </View>
        </FadeSlideIn>

        {/* Stat pill */}
        <FadeSlideIn delay={60}>
          <View style={styles.statPill}>
            <View style={styles.statPillIcon}>
              <Text style={{ fontSize: 16 }}>💰</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.statPillLabel}>Revenus sur la période</Text>
              <Text style={styles.statPillValue}>
                {formatPrice(filteredStats.sales)}
              </Text>
            </View>
          </View>
        </FadeSlideIn>

        {/* Date filters */}
        <FadeSlideIn delay={120}>
          <View style={styles.filtersWrap}>
            <FlatList
              data={dateFilters}
              keyExtractor={(f) => f.key}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filters}
              renderItem={({ item: f }) => {
                const active = dateFilter === f.key;
                return (
                  <ScalePressable
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setDateFilter(f.key)}
                    activeScale={0.94}
                  >
                    <Text
                      style={[styles.chipText, active && styles.chipTextActive]}
                    >
                      {f.label}
                    </Text>
                  </ScalePressable>
                );
              }}
            />
          </View>
        </FadeSlideIn>

        {/* List */}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={styles.loadingText}>Chargement des commandes…</Text>
          </View>
        ) : error ? (
          <View style={styles.center}>
            <View style={styles.errorBubble}>
              <Text style={styles.errorBubbleIcon}>⚠️</Text>
            </View>
            <Text style={styles.errorTitle}>Problème de chargement</Text>
            <Text style={styles.errorText}>{error}</Text>
            <ScalePressable style={styles.retryBtn} onPress={() => load()}>
              <Text style={styles.retryText}>Réessayer</Text>
            </ScalePressable>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.list}
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
                    <Text style={{ fontSize: 36 }}>🧾</Text>
                  </View>
                  <Text style={styles.emptyTitle}>Aucune commande</Text>
                  <Text style={styles.emptyText}>
                    Vous n'avez pas encore de commandes sur cette période.
                  </Text>
                </View>
              </FadeSlideIn>
            }
            renderItem={({ item, index }) => (
              <OrderCard
                order={item}
                index={index}
                expanded={expandedId === item.id}
                onToggle={() => toggleExpand(item.id)}
                onPrint={(order) => {
                  printOrder(order).catch(() => {
                    shareOrderPdf(order).catch(() => {});
                  });
                }}
              />
            )}
          />
        )}
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

const STRONG_SHADOW = Platform.select({
  ios: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 18,
  },
  android: { elevation: 6 },
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
  headerBadge: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    minWidth: 84,
    ...CARD_SHADOW,
  },
  headerBadgeCount: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.primary,
    lineHeight: 22,
  },
  headerBadgeLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.muted,
    marginTop: 2,
  },

  // Stat pill
  statPill: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: H_PADDING,
    marginTop: 14,
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    overflow: "hidden",
    ...STRONG_SHADOW,
  },
  statPillIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  statPillLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.accentSoft,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  statPillValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFF",
    marginTop: 3,
    letterSpacing: -0.4,
  },

  // Filters
  filtersWrap: { marginTop: 14 },
  filters: {
    paddingHorizontal: H_PADDING,
    gap: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 6,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    ...CARD_SHADOW,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.muted,
    letterSpacing: -0.1,
  },
  chipTextActive: { color: "#FFF" },

  // List
  list: {
    paddingHorizontal: H_PADDING,
    paddingTop: 16,
    paddingBottom: 32,
  },

  // Card
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 12,
    ...CARD_SHADOW,
  },
  cardPressable: {},

  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  cardTopLeft: { flex: 1 },
  orderIdRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  orderIdBadge: {
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  orderIdText: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: -0.3,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  orderDate: {
    marginTop: 8,
    fontSize: 12,
    color: colors.muted,
    fontWeight: "600",
  },

  cardMid: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
  },
  midLeft: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 5,
  },
  itemCountValue: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: -0.5,
  },
  itemCountLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
  },
  itemLineCount: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: "500",
  },
  midRight: { alignItems: "flex-end" },
  totalLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.muted,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.accent,
    letterSpacing: -0.4,
    marginTop: 2,
  },

  // Preview
  previewWrap: {
    marginTop: 12,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
  },
  preview: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: "600",
  },

  // Expand hint
  expandHintRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  expandHint: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.accent,
    letterSpacing: 0.2,
  },
  expandChevron: {
    fontSize: 10,
    color: colors.accent,
    fontWeight: "800",
  },

  // Items box
  itemsBox: {
    marginTop: 14,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 11,
    gap: 10,
  },
  itemRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  itemIndex: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemIndexText: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.muted,
  },
  itemLeft: { flex: 1 },
  itemName: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.2,
  },
  itemMeta: {
    marginTop: 3,
    fontSize: 12,
    color: colors.muted,
    fontWeight: "600",
  },
  itemSubtotal: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: -0.2,
  },

  // Print button
  printBtn: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.chipBg,
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  printBtnIcon: { fontSize: 14 },
  printBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: 0.2,
  },

  // Center / states
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
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.dangerBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  errorBubbleIcon: { fontSize: 28 },
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
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 14,
    ...CARD_SHADOW,
  },
  retryText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 14,
  },

  empty: {
    alignItems: "center",
    paddingTop: 56,
    paddingHorizontal: 32,
  },
  emptyBubble: {
    width: 84,
    height: 84,
    borderRadius: 26,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.text,
  },
  emptyText: {
    marginTop: 6,
    fontSize: 13,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 18,
  },
});
