// src/screens/InventoryScreen.tsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
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
  // Coffee-shop palette
  primary: "#2B1810", // deep espresso
  primarySoft: "#3E2723",
  accent: "#C67C4E", // caramel
  accentSoft: "#E8B98A",
  background: "#FAF6F1", // warm cream
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
  chipBg: "#F3EDE6",

  shadow: "#3E2723",
};

const { width: SCREEN_W } = Dimensions.get("window");

// ─── Types (match backend) ───────────────────────────────────────────────────
export type InventoryMovementType =
  | "PURCHASE"
  | "SALE"
  | "WASTE"
  | "ADJUSTMENT"
  | "RETURN";

export type InventoryMovement = {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  type: InventoryMovementType;
  reason: string | null;
  createdAt: string;
};

export type StockMovementRequest = {
  productId: number;
  quantity: number;
  type: InventoryMovementType;
  reason: string;
};

export type Product = {
  id: number;
  name: string;
  stock: number;
  minStock?: number;
  categoryName?: string;
};

type ActionMode = "add" | "remove" | "adjust";
type TypeFilter = "all" | InventoryMovementType;

// ─── API ─────────────────────────────────────────────────────────────────────
const API_BASE = "https://latch-viewing-crop.ngrok-free.dev/api";

async function fetchMovements(): Promise<InventoryMovement[]> {
  const res = await fetch(`${API_BASE}/inventory/movements`);
  if (!res.ok) throw new Error(`Movements failed (${res.status})`);
  return res.json();
}

async function fetchProducts(): Promise<Product[]> {
  const res = await fetch(`${API_BASE}/product/all`);
  if (!res.ok) throw new Error(`Products failed (${res.status})`);
  return res.json();
}

async function postStock(
  path: "add" | "remove" | "adjust",
  body: StockMovementRequest,
) {
  const res = await fetch(`${API_BASE}/inventory/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(t || `Request failed (${res.status})`);
  }
  return res.text().catch(() => "OK");
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function typeMeta(type: InventoryMovementType | string) {
  const t = String(type || "").toUpperCase();
  switch (t) {
    case "PURCHASE":
      return {
        label: "Achat",
        fg: colors.success,
        bg: colors.successBg,
        sign: "+",
        icon: "↓",
      };
    case "RETURN":
      return {
        label: "Retour",
        fg: colors.success,
        bg: colors.successBg,
        sign: "+",
        icon: "↺",
      };
    case "SALE":
      return {
        label: "Vente",
        fg: colors.danger,
        bg: colors.dangerBg,
        sign: "−",
        icon: "↑",
      };
    case "WASTE":
      return {
        label: "Perte",
        fg: colors.warning,
        bg: colors.warningBg,
        sign: "−",
        icon: "✕",
      };
    case "ADJUSTMENT":
      return {
        label: "Ajustement",
        fg: colors.info,
        bg: colors.infoBg,
        sign: "±",
        icon: "±",
      };
    default:
      return {
        label: t || "—",
        fg: colors.muted,
        bg: colors.chipBg,
        sign: "·",
        icon: "·",
      };
  }
}

// ─── Motion primitives ───────────────────────────────────────────────────────
/**
 * A pressable wrapper with a spring "press" scale feedback.
 */
function ScalePressable({
  children,
  style,
  onPress,
  activeScale = 0.96,
  disabled,
  ...rest
}: any) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: activeScale,
      useNativeDriver: true,
      speed: 40,
      bounciness: 4,
    }).start();
  };
  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 6,
    }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled}
        android_ripple={{ color: "rgba(0,0,0,0.05)", borderless: false }}
        {...rest}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

/**
 * Fades + slides its children in on mount. `delay` staggers list items.
 */
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
      duration: 420,
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

// ─── Movement row ────────────────────────────────────────────────────────────
function MovementRow({
  item,
  index,
}: {
  item: InventoryMovement;
  index: number;
}) {
  const meta = typeMeta(item.type);

  return (
    <FadeSlideIn delay={Math.min(index * 40, 320)}>
      <View style={styles.row}>
        <View style={[styles.typeBubble, { backgroundColor: meta.bg }]}>
          <Text style={[styles.typeBubbleIcon, { color: meta.fg }]}>
            {meta.icon}
          </Text>
        </View>
        <View style={styles.rowBody}>
          <Text style={styles.rowTitle} numberOfLines={1}>
            {item.productName}
          </Text>
          <View style={styles.rowMetaLine}>
            <View style={[styles.typeTag, { backgroundColor: meta.bg }]}>
              <Text style={[styles.typeTagText, { color: meta.fg }]}>
                {meta.label}
              </Text>
            </View>
            {item.reason ? (
              <Text style={styles.rowMeta} numberOfLines={1}>
                {item.reason}
              </Text>
            ) : null}
          </View>
          <Text style={styles.rowDate}>{formatDate(item.createdAt)}</Text>
        </View>
        <View style={styles.rowQtyWrap}>
          <Text style={[styles.rowQty, { color: meta.fg }]}>
            {meta.sign}
            {item.quantity}
          </Text>
        </View>
      </View>
    </FadeSlideIn>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────
export default function InventoryScreen() {
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [query, setQuery] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<ActionMode>("add");
  const [moveType, setMoveType] = useState<InventoryMovementType>("PURCHASE");
  const [productId, setProductId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [productPickerOpen, setProductPickerOpen] = useState(false);

  // Fade-in of the whole screen content on first mount
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
      const [movs, prods] = await Promise.all([
        fetchMovements(),
        fetchProducts(),
      ]);
      const list = Array.isArray(movs) ? [...movs] : [];
      list.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      setMovements(list);
      setProducts(Array.isArray(prods) ? prods : []);
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return movements.filter((m) => {
      if (typeFilter !== "all" && String(m.type).toUpperCase() !== typeFilter) {
        return false;
      }
      if (!q) return true;
      return (
        m.productName?.toLowerCase().includes(q) ||
        (m.reason?.toLowerCase().includes(q) ?? false) ||
        String(m.productId).includes(q)
      );
    });
  }, [movements, typeFilter, query]);

  const selectedProduct = products.find((p) => p.id === productId) ?? null;

  function openAction(next: ActionMode) {
    setMode(next);
    if (next === "add") {
      setMoveType("PURCHASE");
      setReason("Réapprovisionnement");
    } else if (next === "remove") {
      setMoveType("WASTE");
      setReason("Perte / casse");
    } else {
      setMoveType("ADJUSTMENT");
      setReason("Inventaire physique");
    }
    setQuantity("");
    setProductId(products[0]?.id ?? null);
    setModalOpen(true);
  }

  async function submit() {
    if (productId == null) {
      Alert.alert("Produit", "Sélectionnez un produit");
      return;
    }
    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty <= 0 || !Number.isInteger(qty)) {
      Alert.alert("Quantité", "Entrez un entier > 0");
      return;
    }
    if (!reason.trim()) {
      Alert.alert("Motif", "Le motif est obligatoire");
      return;
    }

    const path: "add" | "remove" | "adjust" =
      mode === "add" ? "add" : mode === "remove" ? "remove" : "adjust";

    const body: StockMovementRequest = {
      productId,
      quantity: qty,
      type: moveType,
      reason: reason.trim(),
    };

    setSubmitting(true);
    try {
      await postStock(path, body);
      setModalOpen(false);
      Alert.alert("OK", "Mouvement enregistré");
      await load(true);
    } catch (e) {
      Alert.alert("Erreur", e instanceof Error ? e.message : "Échec");
    } finally {
      setSubmitting(false);
    }
  }

  const modeTitle =
    mode === "add"
      ? "Entrée de stock"
      : mode === "remove"
        ? "Sortie de stock"
        : "Ajustement de stock";

  const modeSubtitle =
    mode === "add"
      ? "Réception d’un nouvel arrivage"
      : mode === "remove"
        ? "Consommation, vente ou perte"
        : "Correction manuelle de l’inventaire";

  const typeChoices: InventoryMovementType[] =
    mode === "add"
      ? ["PURCHASE", "RETURN"]
      : mode === "remove"
        ? ["SALE", "WASTE"]
        : ["ADJUSTMENT"];

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <Animated.View style={{ flex: 1, opacity: screenFade }}>
        {/* Header */}
        <FadeSlideIn delay={0} translateY={-8}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>Tableau de bord</Text>
              <Text style={styles.title}>Inventaire</Text>
            </View>
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeCount}>{filtered.length}</Text>
              <Text style={styles.headerBadgeLabel}>
                {filtered.length === 1 ? "mouvement" : "mouvements"}
              </Text>
            </View>
          </View>
        </FadeSlideIn>

        {/* Quick actions */}
        <FadeSlideIn delay={80}>
          <View style={styles.actions}>
            <ScalePressable
              style={[styles.actionCard, styles.actionIn]}
              onPress={() => openAction("add")}
            >
              <View
                style={[styles.actionIconWrap, { backgroundColor: "#FFFFFF" }]}
              >
                <Text style={[styles.actionIcon, { color: colors.success }]}>
                  ＋
                </Text>
              </View>
              <Text style={styles.actionLabel}>Entrée</Text>
              <Text style={styles.actionHint}>Achat / retour</Text>
            </ScalePressable>

            <ScalePressable
              style={[styles.actionCard, styles.actionOut]}
              onPress={() => openAction("remove")}
            >
              <View
                style={[styles.actionIconWrap, { backgroundColor: "#FFFFFF" }]}
              >
                <Text style={[styles.actionIcon, { color: colors.danger }]}>
                  −
                </Text>
              </View>
              <Text style={styles.actionLabel}>Sortie</Text>
              <Text style={styles.actionHint}>Vente / perte</Text>
            </ScalePressable>

            <ScalePressable
              style={[styles.actionCard, styles.actionAdj]}
              onPress={() => openAction("adjust")}
            >
              <View
                style={[styles.actionIconWrap, { backgroundColor: "#FFFFFF" }]}
              >
                <Text style={[styles.actionIcon, { color: colors.info }]}>
                  ±
                </Text>
              </View>
              <Text style={styles.actionLabel}>Ajuster</Text>
              <Text style={styles.actionHint}>Inventaire</Text>
            </ScalePressable>
          </View>
        </FadeSlideIn>

        {/* Search */}
        <FadeSlideIn delay={140}>
          <View style={styles.searchWrap}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un produit ou motif…"
              placeholderTextColor={colors.mutedLight}
              value={query}
              onChangeText={setQuery}
              autoCorrect={false}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery("")} hitSlop={10}>
                <Text style={styles.searchClear}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </FadeSlideIn>

        {/* Type filters */}
        <FadeSlideIn delay={180}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filters}
          >
            {(
              [
                { key: "all", label: "Tous" },
                { key: "PURCHASE", label: "Achats" },
                { key: "SALE", label: "Ventes" },
                { key: "WASTE", label: "Pertes" },
                { key: "ADJUSTMENT", label: "Ajust." },
                { key: "RETURN", label: "Retours" },
              ] as { key: TypeFilter; label: string }[]
            ).map((f) => {
              const active = typeFilter === f.key;
              return (
                <ScalePressable
                  key={f.key}
                  onPress={() => setTypeFilter(f.key)}
                  style={[styles.chip, active && styles.chipActive]}
                  activeScale={0.94}
                >
                  <Text
                    style={[styles.chipText, active && styles.chipTextActive]}
                  >
                    {f.label}
                  </Text>
                </ScalePressable>
              );
            })}
          </ScrollView>
        </FadeSlideIn>

        {/* List */}
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
                  <Text style={styles.emptyEmoji}>☕️</Text>
                  <Text style={styles.emptyTitle}>Aucun mouvement</Text>
                  <Text style={styles.emptyText}>
                    Les entrées et sorties de stock apparaîtront ici.
                  </Text>
                </View>
              </FadeSlideIn>
            }
            renderItem={({ item, index }) => (
              <MovementRow item={item} index={index} />
            )}
          />
        )}
      </Animated.View>

      {/* ─── Action modal ──────────────────────────────────────────────────── */}
      <Modal
        visible={modalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalOpen(false)}
      >
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>{modeTitle}</Text>
              <Text style={styles.modalSubtitle}>{modeSubtitle}</Text>
            </View>
            <ScalePressable
              onPress={() => setModalOpen(false)}
              style={styles.modalCloseBtn}
            >
              <Text style={styles.modalClose}>Fermer</Text>
            </ScalePressable>
          </View>

          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <ScrollView
              contentContainerStyle={styles.modalBody}
              keyboardShouldPersistTaps="handled"
            >
              {/* Movement type */}
              <Text style={styles.label}>Type de mouvement</Text>
              <View style={styles.typeRow}>
                {typeChoices.map((t) => {
                  const active = moveType === t;
                  const meta = typeMeta(t);
                  return (
                    <ScalePressable
                      key={t}
                      style={[styles.typeCard, active && styles.typeCardActive]}
                      onPress={() => setMoveType(t)}
                      activeScale={0.95}
                    >
                      <View
                        style={[
                          styles.typeCardIconWrap,
                          { backgroundColor: active ? "#FFFFFF" : meta.bg },
                        ]}
                      >
                        <Text style={[styles.typeCardIcon, { color: meta.fg }]}>
                          {meta.icon}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.typeCardLabel,
                          active && { color: "#FFF" },
                        ]}
                      >
                        {meta.label}
                      </Text>
                    </ScalePressable>
                  );
                })}
              </View>

              <Text style={styles.label}>Produit</Text>
              <ScalePressable
                style={styles.picker}
                onPress={() => setProductPickerOpen(true)}
                activeScale={0.98}
              >
                {selectedProduct ? (
                  <>
                    <View style={styles.productAvatar}>
                      <Text style={styles.productAvatarText}>
                        {selectedProduct.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.pickerText} numberOfLines={1}>
                        {selectedProduct.name}
                      </Text>
                      <Text style={styles.pickerSub}>
                        Stock actuel · {selectedProduct.stock}
                      </Text>
                    </View>
                  </>
                ) : (
                  <Text style={[styles.pickerText, { color: colors.muted }]}>
                    Choisir un produit
                  </Text>
                )}
                <Text style={styles.pickerChevron}>›</Text>
              </ScalePressable>

              <Text style={styles.label}>Quantité</Text>
              <TextInput
                style={styles.input}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="number-pad"
                placeholder="Ex: 10"
                placeholderTextColor={colors.mutedLight}
              />
              {mode === "adjust" && (
                <Text style={styles.hint}>
                  Vérifiez côté backend si la quantité est un stock cible ou un
                  delta.
                </Text>
              )}

              <Text style={styles.label}>Motif</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                value={reason}
                onChangeText={setReason}
                placeholder="Raison du mouvement"
                placeholderTextColor={colors.mutedLight}
                multiline
              />

              <ScalePressable
                style={[styles.submit, submitting && { opacity: 0.7 }]}
                onPress={submit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.submitText}>Valider le mouvement</Text>
                )}
              </ScalePressable>
            </ScrollView>
          </KeyboardAvoidingView>

          {/* Product picker */}
          <Modal
            visible={productPickerOpen}
            animationType="fade"
            transparent
            onRequestClose={() => setProductPickerOpen(false)}
          >
            <Pressable
              style={styles.pickerOverlay}
              onPress={() => setProductPickerOpen(false)}
            >
              <Pressable style={styles.pickerSheet} onPress={() => {}}>
                <View style={styles.pickerHandle} />
                <Text style={styles.pickerSheetTitle}>Choisir un produit</Text>
                <FlatList
                  data={products}
                  keyExtractor={(p) => String(p.id)}
                  style={{ maxHeight: 420 }}
                  showsVerticalScrollIndicator={false}
                  ItemSeparatorComponent={() => (
                    <View style={styles.pickerSeparator} />
                  )}
                  renderItem={({ item }) => {
                    const active = item.id === productId;
                    return (
                      <ScalePressable
                        style={[
                          styles.pickerItem,
                          active && styles.pickerItemActive,
                        ]}
                        onPress={() => {
                          setProductId(item.id);
                          setProductPickerOpen(false);
                        }}
                        activeScale={0.98}
                      >
                        <View style={styles.productAvatar}>
                          <Text style={styles.productAvatarText}>
                            {item.name.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <Text style={styles.pickerItemName} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text style={styles.pickerItemStock}>
                          Stock {item.stock}
                        </Text>
                      </ScalePressable>
                    );
                  }}
                />
              </Pressable>
            </Pressable>
          </Modal>
        </SafeAreaView>
      </Modal>
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 8,
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
    minWidth: 74,
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

  // Quick actions
  actions: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 10,
    marginTop: 16,
  },
  actionCard: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: "flex-start",
    borderWidth: 1,
    ...CARD_SHADOW,
  },
  actionIn: { backgroundColor: colors.successBg, borderColor: "#D5EDD7" },
  actionOut: { backgroundColor: colors.dangerBg, borderColor: "#FAD3D6" },
  actionAdj: { backgroundColor: colors.infoBg, borderColor: "#D2E5F7" },
  actionIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  actionIcon: { fontSize: 18, fontWeight: "800" },
  actionLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: -0.2,
  },
  actionHint: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
    fontWeight: "500",
  },

  // Search
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 18,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    height: 52,
    ...CARD_SHADOW,
  },
  searchIcon: { fontSize: 15, marginRight: 10, opacity: 0.7 },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    paddingVertical: 0,
    fontWeight: "500",
  },
  searchClear: {
    fontSize: 14,
    color: colors.muted,
    fontWeight: "700",
    paddingHorizontal: 4,
  },

  // Filters
  filters: {
    paddingHorizontal: 20,
    paddingVertical: 16,
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
    marginRight: 4,
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
  list: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 4 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 10,
    gap: 12,
    ...CARD_SHADOW,
  },
  typeBubble: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  typeBubbleIcon: { fontSize: 20, fontWeight: "800" },
  rowBody: { flex: 1 },
  rowTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.2,
  },
  rowMetaLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  typeTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeTagText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.2 },
  rowMeta: {
    flex: 1,
    fontSize: 12,
    color: colors.muted,
    fontWeight: "500",
  },
  rowDate: {
    marginTop: 4,
    fontSize: 11,
    color: colors.mutedLight,
    fontWeight: "500",
  },
  rowQtyWrap: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: colors.surfaceAlt,
    minWidth: 54,
    alignItems: "center",
  },
  rowQty: { fontSize: 15, fontWeight: "800", letterSpacing: -0.3 },

  // Loader / error / empty
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

  empty: { alignItems: "center", paddingTop: 56, paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 44, marginBottom: 10 },
  emptyTitle: { fontSize: 17, fontWeight: "800", color: colors.text },
  emptyText: {
    marginTop: 6,
    fontSize: 13,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 18,
  },

  // Modal
  modalSafe: { flex: 1, backgroundColor: colors.background },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: -0.4,
  },
  modalSubtitle: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 3,
    fontWeight: "500",
  },
  modalCloseBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.surfaceAlt,
  },
  modalClose: { fontSize: 13, fontWeight: "700", color: colors.accent },
  modalBody: { padding: 20, paddingBottom: 40 },
  label: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.muted,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 10,
    marginTop: 18,
  },

  // Type card (modal)
  typeRow: { flexDirection: "row", gap: 10 },
  typeCard: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "flex-start",
    gap: 10,
  },
  typeCardActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    ...CARD_SHADOW,
  },
  typeCardIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  typeCardIcon: { fontSize: 16, fontWeight: "800" },
  typeCardLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.2,
  },

  // Inputs
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === "ios" ? 16 : 12,
    fontSize: 15,
    color: colors.text,
    fontWeight: "600",
  },
  inputMultiline: {
    minHeight: 92,
    textAlignVertical: "top",
    fontWeight: "500",
  },
  hint: {
    marginTop: 8,
    fontSize: 12,
    color: colors.muted,
    fontWeight: "500",
    fontStyle: "italic",
  },

  // Picker (row trigger)
  picker: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  pickerText: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  pickerSub: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
    fontWeight: "500",
  },
  pickerChevron: {
    color: colors.muted,
    fontSize: 22,
    fontWeight: "400",
    marginTop: -2,
  },

  // Submit
  submit: {
    marginTop: 32,
    backgroundColor: colors.accent,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    ...CARD_SHADOW,
  },
  submitText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.2,
  },

  // Product picker sheet
  pickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(20,10,5,0.45)",
    justifyContent: "flex-end",
  },
  pickerSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 10,
    paddingHorizontal: 16,
    paddingBottom: 28,
    maxHeight: "80%",
  },
  pickerHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    marginBottom: 14,
  },
  pickerSheetTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.primary,
    marginBottom: 14,
    letterSpacing: -0.3,
    paddingHorizontal: 4,
  },
  pickerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 14,
    gap: 12,
  },
  pickerItemActive: {
    backgroundColor: colors.surfaceAlt,
  },
  pickerSeparator: { height: 4 },
  pickerItemName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.2,
  },
  pickerItemStock: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: "600",
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    overflow: "hidden",
  },

  // Product avatar
  productAvatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  productAvatarText: {
    color: colors.accentSoft,
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: -0.3,
  },
});
