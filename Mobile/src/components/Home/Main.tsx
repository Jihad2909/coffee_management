// src/screens/HomeScreen.tsx
import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── Theme ───────────────────────────────────────────────────────────────────
const colors = {
  primary: '#3E2723',
  accent: '#C67C4E',
  background: '#FAF7F2',
  surface: '#FFFFFF',
  text: '#1A1A1A',
  muted: '#6B6B6B',
  border: '#EDE6DC',
  success: '#2E7D32',
  successBg: '#E8F5E9',
  warning: '#F9A825',
  warningBg: '#FFF8E1',
  danger: '#C62828',
  dangerBg: '#FFEBEE',
  chipBg: '#F3EDE6',
};

// ─── Types (replace with your API types later) ───────────────────────────────
type StockStatus = 'ok' | 'low' | 'out';

type ProductAlert = {
  id: string;
  name: string;
  category: string;
  stock: number;
  minStock: number;
  unit?: string;
};

type DashboardStats = {
  totalProducts: number;
  lowStock: number;
  outOfStock: number;
  todayOrders: number;
};

// ─── Mock data (swap for API / React Query) ──────────────────────────────────
const MOCK_STATS: DashboardStats = {
  totalProducts: 48,
  lowStock: 6,
  outOfStock: 2,
  todayOrders: 14,
};

const MOCK_ALERTS: ProductAlert[] = [
  { id: '1', name: 'Ethiopia Yirgacheffe', category: 'Beans', stock: 2, minStock: 10, unit: 'kg' },
  { id: '2', name: 'Oat Milk Barista', category: 'Dairy alt.', stock: 0, minStock: 8, unit: 'L' },
  { id: '3', name: 'Paper Cups 12oz', category: 'Packaging', stock: 45, minStock: 100, unit: 'pcs' },
  { id: '4', name: 'Colombia Supremo', category: 'Beans', stock: 5, minStock: 12, unit: 'kg' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getStockStatus(stock: number, minStock: number): StockStatus {
  if (stock <= 0) return 'out';
  if (stock <= minStock) return 'low';
  return 'ok';
}

function statusLabel(status: StockStatus) {
  switch (status) {
    case 'out':
      return 'Out of stock';
    case 'low':
      return 'Low stock';
    default:
      return 'In stock';
  }
}

function statusColors(status: StockStatus) {
  switch (status) {
    case 'out':
      return { fg: colors.danger, bg: colors.dangerBg };
    case 'low':
      return { fg: colors.warning, bg: colors.warningBg };
    default:
      return { fg: colors.success, bg: colors.successBg };
  }
}

// ─── Small UI pieces ─────────────────────────────────────────────────────────
function Greeting() {
  const hour = new Date().getHours();
  const hello =
    hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <View style={styles.greetingBlock}>
      <Text style={styles.greeting}>{hello} ☕</Text>
      <Text style={styles.shopName}>Coffee Stock</Text>
      <Text style={styles.subtitle}>Here’s what’s happening in your inventory</Text>
    </View>
  );
}

type KpiProps = {
  label: string;
  value: number | string;
  accent?: string;
  onPress?: () => void;
};

function KpiTile({ label, value, accent = colors.primary, onPress }: KpiProps) {
  return (
    <TouchableOpacity
      style={styles.kpiTile}
      onPress={onPress}
      activeOpacity={onPress ? 0.75 : 1}
      disabled={!onPress}
    >
      <Text style={[styles.kpiValue, { color: accent }]}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

type QuickActionProps = {
  emoji: string;
  label: string;
  onPress: () => void;
};

function QuickAction({ emoji, label, onPress }: QuickActionProps) {
  return (
    <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.quickActionIcon}>
        <Text style={styles.quickActionEmoji}>{emoji}</Text>
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

type AlertRowProps = {
  item: ProductAlert;
  onPress: (id: string) => void;
};

function AlertRow({ item, onPress }: AlertRowProps) {
  const status = getStockStatus(item.stock, item.minStock);
  const { fg, bg } = statusColors(status);
  const unit = item.unit ?? 'units';

  return (
    <TouchableOpacity
      style={styles.alertRow}
      onPress={() => onPress(item.id)}
      activeOpacity={0.75}
    >
      <View style={styles.alertLeft}>
        <Text style={styles.alertName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.alertMeta}>{item.category}</Text>
      </View>

      <View style={styles.alertRight}>
        <Text style={styles.alertStock}>
          {item.stock}
          <Text style={styles.alertUnit}> {unit}</Text>
        </Text>
        <View style={[styles.badge, { backgroundColor: bg }]}>
          <Text style={[styles.badgeText, { color: fg }]}>{statusLabel(status)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────
type HomeScreenProps = {
  navigation?: {
    navigate: (screen: string, params?: object) => void;
  };
};

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats>(MOCK_STATS);
  const [alerts, setAlerts] = useState<ProductAlert[]>(MOCK_ALERTS);

  // Later: fetch from Spring Boot
  // GET /api/dashboard  +  GET /api/products?status=low
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // const res = await api.getDashboard();
      // setStats(res.stats); setAlerts(res.alerts);
      await new Promise((r) => setTimeout(r, 600));//simuler d'attendre attendre 600 ms
      setStats(MOCK_STATS);
      setAlerts(MOCK_ALERTS);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const attentionCount = useMemo(
    () => alerts.filter((a) => getStockStatus(a.stock, a.minStock) !== 'ok').length,
    [alerts],
  );

  const go = (screen: string, params?: object) => {
    navigation?.navigate(screen, params);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      >
        <Greeting />

        {/* KPIs */}
        <View style={styles.kpiGrid}>
          <KpiTile
            label="Products"
            value={stats.totalProducts}
            onPress={() => go('Products')}
          />
          <KpiTile
            label="Low stock"
            value={stats.lowStock}
            accent={colors.warning}
            onPress={() => go('Products', { filter: 'low' })}
          />
          <KpiTile
            label="Out of stock"
            value={stats.outOfStock}
            accent={colors.danger}
            onPress={() => go('Products', { filter: 'out' })}
          />
          <KpiTile
            label="Orders today"
            value={stats.todayOrders}
            accent={colors.accent}
            onPress={() => go('Orders')}
          />
        </View>

        {/* Quick actions */}
        <Text style={styles.sectionTitle}>Quick actions</Text>
        <View style={styles.quickRow}>
          <QuickAction emoji="➕" label="Add product" onPress={() => go('ProductForm')} />
          <QuickAction emoji="🧾" label="New order" onPress={() => go('NewOrder')} />
          <QuickAction emoji="📦" label="Adjust stock" onPress={() => go('StockAdjust')} />
          <QuickAction emoji="📁" label="Categories" onPress={() => go('Categories')} />
        </View>

        {/* Needs attention */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Needs attention</Text>
          {attentionCount > 0 && (
            <View style={styles.countChip}>
              <Text style={styles.countChipText}>{attentionCount}</Text>
            </View>
          )}
        </View>

        <View style={styles.card}>
          {alerts.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>✨</Text>
              <Text style={styles.emptyTitle}>All stocked up</Text>
              <Text style={styles.emptyText}>No low or out-of-stock items right now.</Text>
            </View>
          ) : (
            alerts.map((item, index) => (
              <View key={item.id}>
                <AlertRow item={item} onPress={(id) => go('ProductDetail', { id })} />
                {index < alerts.length - 1 && <View style={styles.divider} />}
              </View>
            ))
          )}
        </View>

        <TouchableOpacity
          style={styles.seeAll}
          onPress={() => go('Products', { filter: 'attention' })}
          activeOpacity={0.7}
        >
          <Text style={styles.seeAllText}>View all products</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },

  greetingBlock: {
    marginTop: 8,
    marginBottom: 20,
  },
  greeting: {
    fontSize: 15,
    color: colors.muted,
    fontWeight: '500',
  },
  shopName: {
    marginTop: 4,
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: colors.muted,
    lineHeight: 20,
  },

  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 28,
  },
  kpiTile: {
    width: '47.5%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#3E2723',
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 2 },
    }),
  },
  kpiValue: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  kpiLabel: {
    marginTop: 4,
    fontSize: 13,
    color: colors.muted,
    fontWeight: '500',
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  countChip: {
    backgroundColor: colors.warningBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    marginBottom: 12,
  },
  countChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.warning,
  },

  quickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  quickAction: {
    alignItems: 'center',
    width: '23%',
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionEmoji: {
    fontSize: 22,
  },
  quickActionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.muted,
    textAlign: 'center',
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#3E2723',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 1 },
    }),
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  alertLeft: {
    flex: 1,
    paddingRight: 12,
  },
  alertName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  alertMeta: {
    marginTop: 3,
    fontSize: 12,
    color: colors.muted,
  },
  alertRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  alertStock: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  alertUnit: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.muted,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: 16,
  },

  empty: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
  },
  emptyEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  emptyText: {
    marginTop: 4,
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
  },

  seeAll: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 12,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
  },
});