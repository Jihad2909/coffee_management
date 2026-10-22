// src/screens/ProductFormScreen.tsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Theme (matches all other redesigned screens) ────────────────────────────
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

// ─── Types ───────────────────────────────────────────────────────────────────
type Category = {
  id: number;
  name: string;
};

export type CreateProductPayload = {
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  available: boolean;
  minstock: number;
  stock: number;
  unit: string;
  category: { id: number };
};

// ─── API ─────────────────────────────────────────────────────────────────────
import { getCategories } from "@/services/product";

async function createProduct(payload: CreateProductPayload): Promise<void> {
  const res = await fetch(
    `https://latch-viewing-crop.ngrok-free.dev/api/product/add`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Failed to create product (${res.status})`);
  }
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

// ─── Field helpers ───────────────────────────────────────────────────────────
type FieldProps = {
  label: string;
  icon?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
};

function Field({ label, icon, required, error, hint, children }: FieldProps) {
  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        {icon ? <Text style={styles.labelIcon}>{icon}</Text> : null}
        <Text style={styles.label}>
          {label}
          {required ? <Text style={styles.required}> *</Text> : null}
        </Text>
      </View>
      {children}
      {!!error ? (
        <View style={styles.errorRow}>
          <Text style={styles.errorIcon}>⚠</Text>
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

type InputProps = {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "decimal-pad" | "numeric" | "url";
  multiline?: boolean;
  autoCapitalize?: "none" | "sentences" | "words";
  prefix?: string;
  suffix?: string;
};

function Input({
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  multiline,
  autoCapitalize = "sentences",
  prefix,
  suffix,
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(borderAnim, {
      toValue: focused ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [focused, borderAnim]);

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border, colors.accent],
  });

  return (
    <Animated.View
      style={[
        styles.inputWrap,
        { borderColor },
        focused && styles.inputWrapFocused,
        multiline && styles.inputWrapMultiline,
      ]}
    >
      {prefix ? <Text style={styles.inputAffix}>{prefix}</Text> : null}
      <TextInput
        style={[
          styles.input,
          multiline && styles.inputMultiline,
          prefix && { paddingLeft: 4 },
          suffix && { paddingRight: 4 },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedLight}
        keyboardType={keyboardType}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {suffix ? <Text style={styles.inputAffix}>{suffix}</Text> : null}
    </Animated.View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────
type ProductFormScreenProps = {
  navigation?: {
    goBack: () => void;
    navigate: (screen: string, params?: object) => void;
  };
};

export default function ProductFormScreen({
  navigation,
}: ProductFormScreenProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [available, setAvailable] = useState(true);
  const [minStock, setMinStock] = useState("10");
  const [stock, setStock] = useState("0");
  const [unit, setUnit] = useState("pièce");
  const [categoryId, setCategoryId] = useState<number | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const screenFade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(screenFade, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [screenFade]);

  const loadCategories = useCallback(async () => {
    setLoadingCategories(true);
    try {
      const data = await getCategories();
      setCategories(Array.isArray(data) ? data : []);
      if (data?.length && categoryId == null) {
        setCategoryId(data[0].id);
      }
    } catch {
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  }, [categoryId]);

  useEffect(() => {
    loadCategories();
  }, []);

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Le nom est requis";
    const priceNum = Number(price.replace(",", "."));
    if (price === "" || Number.isNaN(priceNum) || priceNum < 0) {
      next.price = "Entrez un prix valide";
    }
    const stockNum = Number(stock);
    if (
      stock === "" ||
      Number.isNaN(stockNum) ||
      stockNum < 0 ||
      !Number.isInteger(stockNum)
    ) {
      next.stock = "Entrez un entier ≥ 0";
    }
    const minNum = Number(minStock);
    if (
      minStock === "" ||
      Number.isNaN(minNum) ||
      minNum < 0 ||
      !Number.isInteger(minNum)
    ) {
      next.minStock = "Entrez un entier ≥ 0";
    }
    if (!unit.trim()) next.unit = "L'unité est requise";
    if (categoryId == null) next.category = "Sélectionnez une catégorie";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit() {
    if (!validate() || categoryId == null) return;

    const payload: CreateProductPayload = {
      name: name.trim(),
      description: description.trim(),
      price: Number(price.replace(",", ".")),
      imageUrl: imageUrl.trim(),
      available,
      minstock: Number(minStock),
      stock: Number(stock),
      unit: unit.trim(),
      category: { id: categoryId },
    };

    setSubmitting(true);
    try {
      await createProduct(payload);
      Alert.alert("Succès", "Produit créé avec succès", [
        { text: "OK", onPress: () => navigation?.goBack() },
      ]);
    } catch (e) {
      Alert.alert(
        "Erreur",
        e instanceof Error ? e.message : "Impossible de créer le produit",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const selectedCategory = categories.find((c) => c.id === categoryId) ?? null;
  const priceNum = Number(price.replace(",", "."));
  const stockNum = Number(stock);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <Animated.View style={{ flex: 1, opacity: screenFade }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={8}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <FadeSlideIn delay={0} translateY={-8}>
              <View style={styles.header}>
                {navigation?.goBack ? (
                  <ScalePressable
                    style={styles.backBtn}
                    onPress={() => navigation.goBack()}
                  >
                    <Text style={styles.backIcon}>‹</Text>
                    <Text style={styles.backText}>Retour</Text>
                  </ScalePressable>
                ) : null}
                <Text style={styles.eyebrow}>Nouveau</Text>
                <Text style={styles.title}>Ajouter un produit</Text>
                <Text style={styles.subtitle}>
                  Remplissez les informations pour créer un article.
                </Text>
              </View>
            </FadeSlideIn>

            {/* Live preview card */}
            <FadeSlideIn delay={60}>
              <View style={styles.previewCard}>
                <View style={styles.previewImageWrap}>
                  {imageUrl.trim() ? (
                    <Image
                      source={{ uri: imageUrl.trim() }}
                      style={styles.previewImage}
                    />
                  ) : (
                    <View style={styles.previewPlaceholder}>
                      <Text style={{ fontSize: 32 }}>☕</Text>
                    </View>
                  )}
                </View>
                <View style={styles.previewInfo}>
                  <Text style={styles.previewLabel}>Aperçu</Text>
                  <Text style={styles.previewName} numberOfLines={1}>
                    {name.trim() || "Nom du produit"}
                  </Text>
                  <View style={styles.previewMetaRow}>
                    <Text style={styles.previewPrice}>
                      {Number.isFinite(priceNum) && price !== ""
                        ? `${priceNum.toFixed(3)} TND`
                        : "— TND"}
                    </Text>
                    <View
                      style={[
                        styles.previewStockBadge,
                        !Number.isFinite(stockNum) || stockNum <= 0
                          ? styles.previewStockBadgeOut
                          : stockNum <= Number(minStock || 0)
                            ? styles.previewStockBadgeLow
                            : styles.previewStockBadgeOk,
                      ]}
                    >
                      <Text
                        style={[
                          styles.previewStockText,
                          !Number.isFinite(stockNum) || stockNum <= 0
                            ? { color: colors.danger }
                            : stockNum <= Number(minStock || 0)
                              ? { color: colors.warning }
                              : { color: colors.success },
                        ]}
                      >
                        {Number.isFinite(stockNum) && stock !== ""
                          ? `${stockNum} en stock`
                          : "Stock —"}
                      </Text>
                    </View>
                  </View>
                  {selectedCategory ? (
                    <Text style={styles.previewCategory}>
                      {selectedCategory.name}
                    </Text>
                  ) : null}
                </View>
              </View>
            </FadeSlideIn>

            {/* Section: Informations de base */}
            <FadeSlideIn delay={120}>
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIconWrap}>
                    <Text style={{ fontSize: 14 }}>📝</Text>
                  </View>
                  <Text style={styles.sectionTitle}>Informations de base</Text>
                </View>

                <Field
                  label="Nom du produit"
                  icon="☕"
                  required
                  error={errors.name}
                >
                  <Input
                    value={name}
                    onChangeText={setName}
                    placeholder="Ex: Jus d'orange"
                  />
                </Field>

                <Field label="Description" icon="✏️">
                  <Input
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Courte description"
                    multiline
                  />
                </Field>

                <Field
                  label="Image URL"
                  icon="🖼️"
                  hint="Collez un lien d'image (https://…)"
                >
                  <Input
                    value={imageUrl}
                    onChangeText={setImageUrl}
                    placeholder="https://…"
                    keyboardType="url"
                    autoCapitalize="none"
                  />
                </Field>
              </View>
            </FadeSlideIn>

            {/* Section: Prix & unité */}
            <FadeSlideIn delay={180}>
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIconWrap}>
                    <Text style={{ fontSize: 14 }}>💵</Text>
                  </View>
                  <Text style={styles.sectionTitle}>Prix & unité</Text>
                </View>

                <View style={styles.row}>
                  <View style={styles.half}>
                    <Field label="Prix" icon="💰" required error={errors.price}>
                      <Input
                        value={price}
                        onChangeText={setPrice}
                        placeholder="2.000"
                        keyboardType="decimal-pad"
                        suffix="TND"
                      />
                    </Field>
                  </View>
                  <View style={styles.half}>
                    <Field label="Unité" icon="📏" required error={errors.unit}>
                      <Input
                        value={unit}
                        onChangeText={setUnit}
                        placeholder="pièce"
                        autoCapitalize="none"
                      />
                    </Field>
                  </View>
                </View>
              </View>
            </FadeSlideIn>

            {/* Section: Stock */}
            <FadeSlideIn delay={240}>
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIconWrap}>
                    <Text style={{ fontSize: 14 }}>📦</Text>
                  </View>
                  <Text style={styles.sectionTitle}>Gestion du stock</Text>
                </View>

                <View style={styles.row}>
                  <View style={styles.half}>
                    <Field
                      label="Stock"
                      icon="📦"
                      required
                      error={errors.stock}
                    >
                      <Input
                        value={stock}
                        onChangeText={setStock}
                        placeholder="30"
                        keyboardType="numeric"
                      />
                    </Field>
                  </View>
                  <View style={styles.half}>
                    <Field
                      label="Stock min."
                      icon="⚠️"
                      required
                      error={errors.minStock}
                    >
                      <Input
                        value={minStock}
                        onChangeText={setMinStock}
                        placeholder="10"
                        keyboardType="numeric"
                      />
                    </Field>
                  </View>
                </View>
              </View>
            </FadeSlideIn>

            {/* Section: Catégorie */}
            <FadeSlideIn delay={300}>
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIconWrap}>
                    <Text style={{ fontSize: 14 }}>🏷️</Text>
                  </View>
                  <Text style={styles.sectionTitle}>Catégorie</Text>
                </View>

                <Field
                  label="Choisir une catégorie"
                  required
                  error={errors.category}
                >
                  {loadingCategories ? (
                    <View style={styles.loadingCats}>
                      <ActivityIndicator color={colors.accent} />
                      <Text style={styles.loadingCatsText}>
                        Chargement des catégories…
                      </Text>
                    </View>
                  ) : categories.length === 0 ? (
                    <View style={styles.noCatsBox}>
                      <Text style={styles.hint}>Aucune catégorie trouvée.</Text>
                      <ScalePressable
                        style={styles.reloadBtn}
                        onPress={loadCategories}
                      >
                        <Text style={styles.reloadBtnText}>
                          Recharger les catégories
                        </Text>
                      </ScalePressable>
                    </View>
                  ) : (
                    <View style={styles.chips}>
                      {categories.map((c) => {
                        const active = categoryId === c.id;
                        return (
                          <ScalePressable
                            key={c.id}
                            style={[styles.chip, active && styles.chipActive]}
                            onPress={() => setCategoryId(c.id)}
                            activeScale={0.94}
                          >
                            <Text
                              style={[
                                styles.chipText,
                                active && styles.chipTextActive,
                              ]}
                            >
                              {c.name}
                            </Text>
                          </ScalePressable>
                        );
                      })}
                    </View>
                  )}
                </Field>
              </View>
            </FadeSlideIn>

            {/* Section: Disponibilité */}
            <FadeSlideIn delay={360}>
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIconWrap}>
                    <Text style={{ fontSize: 14 }}>🎛️</Text>
                  </View>
                  <Text style={styles.sectionTitle}>Disponibilité</Text>
                </View>

                <View
                  style={[
                    styles.switchRow,
                    available && styles.switchRowActive,
                  ]}
                >
                  <View style={styles.switchLeft}>
                    <View
                      style={[
                        styles.switchDot,
                        {
                          backgroundColor: available
                            ? colors.success
                            : colors.mutedLight,
                        },
                      ]}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.switchLabel}>
                        {available ? "Produit disponible" : "Produit masqué"}
                      </Text>
                      <Text style={styles.switchHint}>
                        {available
                          ? "Visible et vendable en caisse"
                          : "Masqué du point de vente"}
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={available}
                    onValueChange={setAvailable}
                    trackColor={{
                      false: colors.borderStrong,
                      true: colors.accent,
                    }}
                    thumbColor={
                      Platform.OS === "android" ? colors.surface : undefined
                    }
                    ios_backgroundColor={colors.borderStrong}
                  />
                </View>
              </View>
            </FadeSlideIn>

            {/* Submit */}
            <FadeSlideIn delay={420}>
              <ScalePressable
                style={[styles.submit, submitting && styles.submitDisabled]}
                onPress={onSubmit}
                disabled={submitting}
                activeScale={0.97}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Text style={styles.submitIcon}>＋</Text>
                    <Text style={styles.submitText}>Créer le produit</Text>
                  </>
                )}
              </ScalePressable>
            </FadeSlideIn>

            <FadeSlideIn delay={460}>
              <Text style={styles.footerNote}>
                Les champs marqués d'un{" "}
                <Text style={{ color: colors.danger, fontWeight: "800" }}>
                  *
                </Text>{" "}
                sont obligatoires.
              </Text>
            </FadeSlideIn>
          </ScrollView>
        </KeyboardAvoidingView>
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
    shadowOpacity: 0.18,
    shadowRadius: 18,
  },
  android: { elevation: 6 },
  default: {},
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  scroll: {
    paddingHorizontal: H_PADDING,
    paddingBottom: 40,
  },

  // Header
  header: {
    paddingTop: 8,
    paddingBottom: 4,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingRight: 12,
    marginBottom: 6,
  },
  backIcon: {
    fontSize: 24,
    color: colors.accent,
    fontWeight: "400",
    marginTop: -3,
    marginRight: 2,
  },
  backText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.accent,
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
    fontSize: 30,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: -0.7,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    color: colors.muted,
    fontWeight: "500",
    lineHeight: 18,
  },

  // Preview card
  previewCard: {
    marginTop: 18,
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: 14,
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
    overflow: "hidden",
    ...STRONG_SHADOW,
  },
  previewImageWrap: {
    width: 78,
    height: 78,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  previewImage: { width: "100%", height: "100%" },
  previewPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  previewInfo: { flex: 1, justifyContent: "center", gap: 4 },
  previewLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.accentSoft,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  previewName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: -0.3,
  },
  previewMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  previewPrice: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.accentSoft,
    letterSpacing: -0.2,
  },
  previewStockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  previewStockBadgeOk: { backgroundColor: "rgba(46,125,50,0.2)" },
  previewStockBadgeLow: { backgroundColor: "rgba(230,138,0,0.2)" },
  previewStockBadgeOut: { backgroundColor: "rgba(198,40,40,0.2)" },
  previewStockText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.2 },
  previewCategory: {
    fontSize: 11,
    color: colors.mutedLight,
    fontWeight: "600",
    marginTop: 2,
  },

  // Section
  section: {
    marginTop: 18,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...CARD_SHADOW,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  sectionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: -0.2,
  },

  // Field
  field: { marginBottom: 14 },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  labelIcon: { fontSize: 12 },
  label: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: 0.2,
  },
  required: { color: colors.danger },

  // Input
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    minHeight: 50,
  },
  inputWrapFocused: {
    backgroundColor: colors.surface,
  },
  inputWrapMultiline: {
    paddingVertical: 12,
    alignItems: "flex-start",
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    fontWeight: "600",
    paddingVertical: Platform.OS === "ios" ? 14 : 10,
  },
  inputMultiline: {
    minHeight: 72,
    paddingTop: 0,
    textAlignVertical: "top",
    fontWeight: "500",
  },
  inputAffix: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.muted,
    letterSpacing: 0.2,
    paddingHorizontal: 4,
  },

  // Error / hint
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 6,
  },
  errorIcon: { fontSize: 11, color: colors.danger, fontWeight: "800" },
  error: {
    fontSize: 12,
    color: colors.danger,
    fontWeight: "600",
  },
  hint: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 6,
    fontWeight: "500",
  },

  // Rows
  row: { flexDirection: "row", gap: 12 },
  half: { flex: 1 },

  // Category chips
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
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

  loadingCats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  loadingCatsText: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: "500",
  },
  noCatsBox: {
    paddingVertical: 8,
  },
  reloadBtn: {
    marginTop: 10,
    alignSelf: "flex-start",
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  reloadBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.accent,
    letterSpacing: 0.2,
  },

  // Switch row
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 14,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  switchRowActive: {
    backgroundColor: colors.successBg,
    borderColor: "#D5EDD7",
  },
  switchLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  switchDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.2,
  },
  switchHint: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 3,
    fontWeight: "500",
  },

  // Submit
  submit: {
    marginTop: 22,
    backgroundColor: colors.accent,
    borderRadius: 16,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    ...STRONG_SHADOW,
  },
  submitDisabled: { opacity: 0.7 },
  submitIcon: {
    fontSize: 20,
    color: "#FFF",
    fontWeight: "800",
    marginTop: -2,
  },
  submitText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.2,
  },

  footerNote: {
    marginTop: 16,
    fontSize: 11,
    color: colors.mutedLight,
    textAlign: "center",
    fontWeight: "500",
    lineHeight: 16,
  },
});
