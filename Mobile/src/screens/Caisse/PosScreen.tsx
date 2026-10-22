// src/screens/PosScreen.tsx
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
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Theme (matches Analytics + Inventory) ───────────────────────────────────
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
  gold: "#D4A055",
  shadow: "#3E2723",
};

const { width: SCREEN_W } = Dimensions.get("window");
const H_PADDING = 20;
const GRID_GAP = 12;

// ─── Types ───────────────────────────────────────────────────────────────────
export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  available: boolean;
  createdAt: string;
  updatedAt: string;
  categoryId: number;
  categoryName: string;
  minStock: number;
  stock: number;
}

type Category = { id: number; name: string };
type CartItem = { product: Product; qty: number };

// ─── API ─────────────────────────────────────────────────────────────────────
const API_BASE = "https://latch-viewing-crop.ngrok-free.dev/api";

async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(`${API_BASE}/categories`);
  if (!res.ok) throw new Error(`Categories ${res.status}`);
  return res.json();
}

async function fetchProducts(): Promise<Product[]> {
  const res = await fetch(`${API_BASE}/product/all`);
  if (!res.ok) throw new Error(`Products ${res.status}`);
  return res.json();
}

async function createOrder(payload: {
  status: string;
  items: { productId: number; quantity: number }[];
}) {
  const res = await fetch(`${API_BASE}/orders/add`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(t || `Order failed (${res.status})`);
  }
  return res.json().catch(() => null);
}

function formatPrice(n: number) {
  return new Intl.NumberFormat("fr-TN", {
    style: "currency",
    currency: "TND",
    minimumFractionDigits: 3,
  }).format(n);
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

/** Pulse animation for the cart badge when item count changes. */
function useBadgePulse(trigger: number) {
  const scale = useRef(new Animated.Value(1)).current;
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    Animated.sequence([
      Animated.spring(scale, {
        toValue: 1.3,
        useNativeDriver: true,
        speed: 40,
        bounciness: 12,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 30,
        bounciness: 8,
      }),
    ]).start();
  }, [trigger, scale]);
  return scale;
}

// ─── Screen ──────────────────────────────────────────────────────────────────
type PosScreenProps = {
  navigation?: { goBack?: () => void };
};

export default function PosScreen({ navigation }: PosScreenProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | "all">(
    "all",
  );
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const screenFade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(screenFade, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [screenFade]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cats, prods] = await Promise.all([
        fetchCategories(),
        fetchProducts(),
      ]);
      setCategories(Array.isArray(cats) ? cats : []);
      setProducts(Array.isArray(prods) ? prods : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visibleProducts = useMemo(() => {
    return products.filter((p) => {
      if (!p.available) return false;
      if (selectedCategoryId === "all") return true;
      return p.categoryId === selectedCategoryId;
    });
  }, [products, selectedCategoryId]);

  const cartCount = useMemo(() => cart.reduce((s, i) => s + i.qty, 0), [cart]);
  const cartTotal = useMemo(
    () => cart.reduce((s, i) => s + i.qty * i.product.price, 0),
    [cart],
  );

  const badgeScale = useBadgePulse(cartCount);

  // Bottom bar slide-in
  const bottomBarAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(bottomBarAnim, {
      toValue: cartCount > 0 ? 1 : 0,
      useNativeDriver: true,
      speed: 18,
      bounciness: 8,
    }).start();
  }, [cartCount, bottomBarAnim]);

  function qtyInCart(productId: number) {
    return cart.find((c) => c.product.id === productId)?.qty ?? 0;
  }

  function addToCart(product: Product) {
    if (product.stock <= 0) {
      Alert.alert("Rupture", "Ce produit est en rupture de stock.");
      return;
    }
    setCart((prev) => {
      const existing = prev.find((c) => c.product.id === product.id);
      if (existing) {
        if (existing.qty >= product.stock) {
          Alert.alert("Stock", `Stock max: ${product.stock}`);
          return prev;
        }
        return prev.map((c) =>
          c.product.id === product.id ? { ...c, qty: c.qty + 1 } : c,
        );
      }
      return [...prev, { product, qty: 1 }];
    });
  }

  function decFromCart(productId: number) {
    setCart((prev) =>
      prev
        .map((c) => (c.product.id === productId ? { ...c, qty: c.qty - 1 } : c))
        .filter((c) => c.qty > 0),
    );
  }

  function setQty(productId: number, qty: number) {
    setCart((prev) => {
      if (qty <= 0) return prev.filter((c) => c.product.id !== productId);
      return prev.map((c) => {
        if (c.product.id !== productId) return c;
        const max = c.product.stock;
        return { ...c, qty: Math.min(qty, max) };
      });
    });
  }

  function clearCart() {
    setCart([]);
  }

  async function checkout() {
    if (cart.length === 0) return;
    setCheckoutLoading(true);
    try {
      await createOrder({
        status: "COMPLETED",
        items: cart.map((c) => ({
          productId: c.product.id,
          quantity: c.qty,
        })),
      });
      clearCart();
      setCartOpen(false);
      Alert.alert("OK", "Commande enregistrée");
      await load();
    } catch (e) {
      Alert.alert(
        "Commande",
        e instanceof Error ? e.message : "Échec de la commande",
      );
    } finally {
      setCheckoutLoading(false);
    }
  }

  // ─── Product tile ────────────────────────────────────────────────────────
  function ProductTile({ item, index }: { item: Product; index: number }) {
    const qty = qtyInCart(item.id);
    const out = item.stock <= 0;
    const lowStock = !out && item.stock <= (item.minStock ?? 5);

    return (
      <FadeSlideIn delay={Math.min(index * 50, 400)} style={styles.tileWrap}>
        <View style={[styles.tile, out && styles.tileDisabled]}>
          {/* Image */}
          <View style={styles.tileImageWrap}>
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={styles.tileImage} />
            ) : (
              <View style={styles.tilePlaceholder}>
                <Text style={{ fontSize: 32 }}>☕</Text>
              </View>
            )}

            {/* Stock badge overlay */}
            <View
              style={[
                styles.stockBadge,
                out
                  ? styles.stockBadgeOut
                  : lowStock
                    ? styles.stockBadgeLow
                    : styles.stockBadgeOk,
              ]}
            >
              <Text
                style={[
                  styles.stockBadgeText,
                  out
                    ? { color: colors.danger }
                    : lowStock
                      ? { color: colors.warning }
                      : { color: colors.success },
                ]}
              >
                {out ? "Rupture" : `${item.stock} en stock`}
              </Text>
            </View>

            {/* Qty bubble when in cart */}
            {qty > 0 && (
              <View style={styles.qtyBubble}>
                <Text style={styles.qtyBubbleText}>{qty}</Text>
              </View>
            )}
          </View>

          {/* Info */}
          <View style={styles.tileInfo}>
            <Text style={styles.tileName} numberOfLines={2}>
              {item.name}
            </Text>
            <Text style={styles.tilePrice}>{formatPrice(item.price)}</Text>
          </View>

          {/* Action */}
          {qty === 0 ? (
            <ScalePressable
              style={[styles.addBtn, out && styles.addBtnDisabled]}
              onPress={() => addToCart(item)}
              disabled={out}
              activeScale={0.94}
            >
              <Text style={styles.addBtnText}>
                {out ? "Indisponible" : "＋ Ajouter"}
              </Text>
            </ScalePressable>
          ) : (
            <View style={styles.qtyRow}>
              <ScalePressable
                style={styles.qtyBtn}
                onPress={() => decFromCart(item.id)}
                activeScale={0.9}
              >
                <Text style={styles.qtyBtnText}>−</Text>
              </ScalePressable>
              <Text style={styles.qtyValue}>{qty}</Text>
              <ScalePressable
                style={[styles.qtyBtn, styles.qtyBtnPlus]}
                onPress={() => addToCart(item)}
                activeScale={0.9}
              >
                <Text style={[styles.qtyBtnText, { color: "#FFF" }]}>＋</Text>
              </ScalePressable>
            </View>
          )}
        </View>
      </FadeSlideIn>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <Animated.View style={{ flex: 1, opacity: screenFade }}>
        {/* Header */}
        <FadeSlideIn delay={0} translateY={-8}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>Point de vente</Text>
              <Text style={styles.title}>Caisse</Text>
            </View>

            <ScalePressable
              style={styles.cartBtn}
              onPress={() => setCartOpen(true)}
            >
              <Text style={styles.cartBtnEmoji}>🛒</Text>
              {cartCount > 0 && (
                <Animated.View
                  style={[styles.badge, { transform: [{ scale: badgeScale }] }]}
                >
                  <Text style={styles.badgeText}>{cartCount}</Text>
                </Animated.View>
              )}
            </ScalePressable>
          </View>
        </FadeSlideIn>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={styles.loadingText}>Chargement du menu…</Text>
          </View>
        ) : error ? (
          <View style={styles.center}>
            <View style={styles.errorBubble}>
              <Text style={styles.errorBubbleIcon}>⚠️</Text>
            </View>
            <Text style={styles.errorTitle}>Impossible de charger</Text>
            <Text style={styles.errorText}>{error}</Text>
            <ScalePressable style={styles.retry} onPress={load}>
              <Text style={styles.retryText}>Réessayer</Text>
            </ScalePressable>
          </View>
        ) : (
          <>
            {/* Categories */}
            <FadeSlideIn delay={80}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.catRow}
              >
                <ScalePressable
                  style={[
                    styles.catChip,
                    selectedCategoryId === "all" && styles.catChipActive,
                  ]}
                  onPress={() => setSelectedCategoryId("all")}
                  activeScale={0.94}
                >
                  <Text
                    style={[
                      styles.catChipText,
                      selectedCategoryId === "all" && styles.catChipTextActive,
                    ]}
                  >
                    Tous
                  </Text>
                </ScalePressable>
                {categories.map((c) => {
                  const active = selectedCategoryId === c.id;
                  return (
                    <ScalePressable
                      key={c.id}
                      style={[styles.catChip, active && styles.catChipActive]}
                      onPress={() => setSelectedCategoryId(c.id)}
                      activeScale={0.94}
                    >
                      <Text
                        style={[
                          styles.catChipText,
                          active && styles.catChipTextActive,
                        ]}
                      >
                        {c.name}
                      </Text>
                    </ScalePressable>
                  );
                })}
              </ScrollView>
            </FadeSlideIn>

            {/* Products grid */}
            <FlatList
              data={visibleProducts}
              keyExtractor={(p) => String(p.id)}
              numColumns={2}
              columnWrapperStyle={styles.gridRow}
              contentContainerStyle={styles.grid}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <FadeSlideIn delay={100}>
                  <View style={styles.empty}>
                    <Text style={styles.emptyEmoji}>📦</Text>
                    <Text style={styles.emptyTitle}>Aucun produit</Text>
                    <Text style={styles.emptyText}>
                      Pas d'article disponible dans cette catégorie.
                    </Text>
                  </View>
                </FadeSlideIn>
              }
              renderItem={({ item, index }) => (
                <ProductTile item={item} index={index} />
              )}
            />

            {/* Bottom bar total */}
            <Animated.View
              pointerEvents={cartCount > 0 ? "auto" : "none"}
              style={[
                styles.bottomBarWrap,
                {
                  opacity: bottomBarAnim,
                  transform: [
                    {
                      translateY: bottomBarAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [100, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <ScalePressable
                style={styles.bottomBar}
                onPress={() => setCartOpen(true)}
                activeScale={0.98}
              >
                <View style={styles.bottomLeft}>
                  <View style={styles.bottomIconWrap}>
                    <Text style={styles.bottomIcon}>🛒</Text>
                  </View>
                  <View>
                    <Text style={styles.bottomLabel}>
                      {cartCount} article{cartCount > 1 ? "s" : ""}
                    </Text>
                    <Text style={styles.bottomTotal}>
                      {formatPrice(cartTotal)}
                    </Text>
                  </View>
                </View>
                <View style={styles.bottomCta}>
                  <Text style={styles.bottomCtaText}>Voir le panier</Text>
                  <Text style={styles.bottomCtaArrow}>›</Text>
                </View>
              </ScalePressable>
            </Animated.View>
          </>
        )}
      </Animated.View>

      {/* ─── Panier modal ─────────────────────────────────────────────────── */}
      <Modal
        visible={cartOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setCartOpen(false)}
      >
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalEyebrow}>Commande en cours</Text>
              <Text style={styles.modalTitle}>Panier</Text>
            </View>
            <ScalePressable
              style={styles.modalCloseBtn}
              onPress={() => setCartOpen(false)}
            >
              <Text style={styles.modalClose}>Fermer</Text>
            </ScalePressable>
          </View>

          {cart.length === 0 ? (
            <View style={styles.center}>
              <View style={styles.emptyBubble}>
                <Text style={{ fontSize: 36 }}>🛒</Text>
              </View>
              <Text style={styles.emptyTitle}>Panier vide</Text>
              <Text style={styles.emptyText}>
                Ajoutez des produits depuis la caisse.
              </Text>
            </View>
          ) : (
            <>
              <FlatList
                data={cart}
                keyExtractor={(i) => String(i.product.id)}
                contentContainerStyle={{
                  padding: H_PADDING,
                  paddingBottom: 24,
                }}
                showsVerticalScrollIndicator={false}
                renderItem={({ item, index }) => (
                  <FadeSlideIn delay={Math.min(index * 40, 200)}>
                    <View style={styles.cartRow}>
                      <View style={styles.cartThumb}>
                        {item.product.imageUrl ? (
                          <Image
                            source={{ uri: item.product.imageUrl }}
                            style={styles.cartThumbImg}
                          />
                        ) : (
                          <Text style={{ fontSize: 20 }}>☕</Text>
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cartName} numberOfLines={1}>
                          {item.product.name}
                        </Text>
                        <Text style={styles.cartMeta}>
                          {formatPrice(item.product.price)} × {item.qty}
                        </Text>
                      </View>

                      <View style={styles.cartQtyRow}>
                        <ScalePressable
                          style={styles.cartQtyBtn}
                          onPress={() => decFromCart(item.product.id)}
                          activeScale={0.9}
                        >
                          <Text style={styles.cartQtyBtnText}>−</Text>
                        </ScalePressable>
                        <Text style={styles.cartQtyValue}>{item.qty}</Text>
                        <ScalePressable
                          style={[
                            styles.cartQtyBtn,
                            { backgroundColor: colors.primary },
                          ]}
                          onPress={() => addToCart(item.product)}
                          activeScale={0.9}
                        >
                          <Text
                            style={[styles.cartQtyBtnText, { color: "#FFF" }]}
                          >
                            ＋
                          </Text>
                        </ScalePressable>
                      </View>

                      <Text style={styles.cartLineTotal}>
                        {formatPrice(item.qty * item.product.price)}
                      </Text>
                    </View>
                  </FadeSlideIn>
                )}
              />

              <View style={styles.modalFooter}>
                <View style={styles.totalRow}>
                  <View>
                    <Text style={styles.totalLabel}>Total à payer</Text>
                    <Text style={styles.totalHint}>
                      {cartCount} article{cartCount > 1 ? "s" : ""}
                    </Text>
                  </View>
                  <Text style={styles.totalValue}>
                    {formatPrice(cartTotal)}
                  </Text>
                </View>

                <ScalePressable
                  style={styles.clearBtn}
                  onPress={() =>
                    Alert.alert("Vider", "Vider le panier ?", [
                      { text: "Annuler", style: "cancel" },
                      {
                        text: "Vider",
                        style: "destructive",
                        onPress: clearCart,
                      },
                    ])
                  }
                  activeScale={0.96}
                >
                  <Text style={styles.clearBtnText}>🗑 Vider le panier</Text>
                </ScalePressable>

                <ScalePressable
                  style={[styles.payBtn, checkoutLoading && { opacity: 0.7 }]}
                  onPress={checkout}
                  disabled={checkoutLoading}
                >
                  {checkoutLoading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <>
                      <Text style={styles.payBtnText}>Encaisser</Text>
                      <Text style={styles.payBtnTotal}>
                        {formatPrice(cartTotal)}
                      </Text>
                    </>
                  )}
                </ScalePressable>
              </View>
            </>
          )}
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

const STRONG_SHADOW = Platform.select({
  ios: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
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
  cartBtn: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    ...CARD_SHADOW,
  },
  cartBtnEmoji: { fontSize: 22 },
  badge: {
    position: "absolute",
    top: -6,
    right: -6,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: colors.background,
  },
  badgeText: { color: "#FFF", fontSize: 11, fontWeight: "800" },

  // Categories
  catRow: {
    paddingHorizontal: H_PADDING,
    paddingVertical: 14,
    gap: 8,
  },
  catChip: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  catChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    ...CARD_SHADOW,
  },
  catChipText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.muted,
    letterSpacing: -0.1,
  },
  catChipTextActive: { color: "#FFF" },

  // Grid
  grid: { paddingHorizontal: H_PADDING - 4, paddingBottom: 140 },
  gridRow: { gap: GRID_GAP, paddingHorizontal: 4 },
  tileWrap: { flex: 1, maxWidth: "50%" },
  tile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    marginBottom: GRID_GAP,
    ...CARD_SHADOW,
  },
  tileDisabled: { opacity: 0.55 },

  tileImageWrap: {
    height: 108,
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 10,
    backgroundColor: colors.surfaceAlt,
    position: "relative",
  },
  tileImage: { width: "100%", height: "100%" },
  tilePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  // Stock badge
  stockBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stockBadgeOk: { backgroundColor: colors.successBg },
  stockBadgeLow: { backgroundColor: colors.warningBg },
  stockBadgeOut: { backgroundColor: colors.dangerBg },
  stockBadgeText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.2 },

  // Qty bubble (top-right corner of image)
  qtyBubble: {
    position: "absolute",
    top: 8,
    right: 8,
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: colors.background,
  },
  qtyBubbleText: { color: "#FFF", fontSize: 12, fontWeight: "800" },

  // Tile info
  tileInfo: { paddingHorizontal: 4, minHeight: 52 },
  tileName: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.2,
    lineHeight: 18,
  },
  tilePrice: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: "800",
    color: colors.accent,
    letterSpacing: -0.2,
  },

  // Add button
  addBtn: {
    marginTop: 10,
    backgroundColor: colors.primary,
    borderRadius: 12,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnDisabled: { backgroundColor: colors.mutedLight },
  addBtnText: {
    color: "#FFF",
    fontWeight: "800",
    fontSize: 12,
    letterSpacing: 0.2,
  },

  // Qty row (on tile)
  qtyRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyBtnPlus: { backgroundColor: colors.primary },
  qtyBtnText: { fontSize: 18, fontWeight: "800", color: colors.primary },
  qtyValue: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
    minWidth: 24,
    textAlign: "center",
    letterSpacing: -0.2,
  },

  // Bottom bar
  bottomBarWrap: {
    position: "absolute",
    left: H_PADDING,
    right: H_PADDING,
    bottom: 20,
  },
  bottomBar: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    ...STRONG_SHADOW,
  },
  bottomLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  bottomIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  bottomIcon: { fontSize: 20 },
  bottomLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  bottomTotal: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "800",
    marginTop: 2,
    letterSpacing: -0.4,
  },
  bottomCta: {
    backgroundColor: colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  bottomCtaText: { color: "#FFF", fontWeight: "800", fontSize: 13 },
  bottomCtaArrow: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "400",
    marginTop: -2,
  },

  // Center / states
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
  },
  retry: {
    marginTop: 18,
    backgroundColor: colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 14,
    ...CARD_SHADOW,
  },
  retryText: { color: "#FFF", fontWeight: "700", fontSize: 14 },
  empty: { alignItems: "center", paddingTop: 56, paddingHorizontal: 32 },
  emptyBubble: {
    width: 84,
    height: 84,
    borderRadius: 26,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
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
    paddingHorizontal: H_PADDING,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  modalEyebrow: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.accent,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: -0.4,
  },
  modalCloseBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.surfaceAlt,
  },
  modalClose: { fontSize: 13, fontWeight: "800", color: colors.accent },

  // Cart rows
  cartRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 10,
    gap: 10,
    ...CARD_SHADOW,
  },
  cartThumb: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  cartThumbImg: { width: "100%", height: "100%" },
  cartName: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.2,
  },
  cartMeta: {
    marginTop: 3,
    fontSize: 12,
    color: colors.muted,
    fontWeight: "600",
  },
  cartQtyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cartQtyBtn: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  cartQtyBtnText: { fontSize: 16, fontWeight: "800", color: colors.primary },
  cartQtyValue: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.text,
    minWidth: 20,
    textAlign: "center",
  },
  cartLineTotal: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.primary,
    minWidth: 70,
    textAlign: "right",
    letterSpacing: -0.2,
  },

  // Modal footer
  modalFooter: {
    padding: H_PADDING,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 13,
    color: colors.muted,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  totalHint: {
    fontSize: 12,
    color: colors.mutedLight,
    fontWeight: "600",
    marginTop: 3,
  },
  totalValue: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: -0.6,
  },
  clearBtn: {
    alignItems: "center",
    paddingVertical: 12,
    marginBottom: 10,
    borderRadius: 12,
  },
  clearBtnText: { color: colors.danger, fontWeight: "700", fontSize: 13 },
  payBtn: {
    backgroundColor: colors.accent,
    height: 58,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 12,
    ...STRONG_SHADOW,
  },
  payBtnText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  payBtnTotal: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 15,
    fontWeight: "700",
  },
});
