import { useCallback, useMemo, useState } from "react";

import {
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { getDashboard } from "@/services/dashboard";

import { SafeAreaView } from "react-native-safe-area-context";

import AlertRow from "../../components/Home/AlertRow";
import Greeting from "../../components/Home/Greeting";
import KpiTile from "../../components/Home/KpiTile";
import QuickAction from "../../components/Home/QuickAction";

import { colors } from "../../constants/colors";

import { MOCK_ALERTS, MOCK_STATS } from "../../models/dashboard.mock";
import { DashboardStats } from "../../models/DashboardStats";
import { ProductAlert } from "../../models/Product";

import { getStockStatus } from "../../utils/stock.utils";

import { router } from "expo-router";
import { styles } from "./HomeScreen.styles";

type HomeScreenProps = {
  navigation?: {
    navigate: (screen: string, params?: object) => void;
  };
};

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const [refreshing, setRefreshing] = useState(false);

  const [stats, setStats] = useState<DashboardStats>(MOCK_STATS);

  const [alerts, setAlerts] = useState<ProductAlert[]>(MOCK_ALERTS);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await getDashboard();
      console.log("dashboard api", data);

      setStats(data.stats);
      setAlerts(data.alerts);
    } catch (error) {
      console.error("Dashboard api Error", error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const attentionCount = useMemo(
    () =>
      alerts.filter(
        (alert) => getStockStatus(alert.stock, alert.minStock) !== "ok",
      ).length,
    [alerts],
  );

  const go = (screen: string, filter?: Object) => {
    navigation?.navigate("Dashboard");
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
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
            onPress={() => router.push("/products")}
          />

          <KpiTile
            label="Low stock"
            value={stats.lowStock}
            accent={colors.warning}
            onPress={() =>
              go("Products", {
                filter: "low",
              })
            }
          />

          <KpiTile
            label="Out of stock"
            value={stats.outOfStock}
            accent={colors.danger}
            onPress={() =>
              go("Products", {
                filter: "out",
              })
            }
          />

          <KpiTile
            label="Orders today"
            value={stats.todayOrders}
            accent={colors.accent}
            onPress={() => go("Orders")}
          />
        </View>

        {/* Quick actions */}
        <Text style={styles.sectionTitle}>Quick actions</Text>

        <View style={styles.quickRow}>
          <QuickAction
            emoji="➕"
            label="Ajouter un produit"
            onPress={() => router.push("/AddProducts")}
          />

          <QuickAction
            emoji="🧾"
            label="Caisse"
            onPress={() => router.push("/posScreen")}
          />

          <QuickAction
            emoji="📦"
            label="Histourique de commandes"
            onPress={() => router.push("/orders")}
          />
        </View>
        <View style={styles.quickRow}>
          <QuickAction
            emoji="📁"
            label="Analyse"
            onPress={() => router.push("/analytic")}
          />

          <QuickAction
            emoji="📁"
            label="Inventaire"
            onPress={() => router.push("/inventory")}
          />
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

              <Text style={styles.emptyText}>
                No low or out-of-stock items right now.
              </Text>
            </View>
          ) : (
            alerts.map((item, index) => (
              <View key={item.id}>
                <AlertRow
                  item={item}
                  onPress={(id) => go("ProductDetail", { id })}
                />

                {index < alerts.length - 1 && <View style={styles.divider} />}
              </View>
            ))
          )}
        </View>

        <TouchableOpacity
          style={styles.seeAll}
          onPress={() =>
            go("Products", {
              filter: "attention",
            })
          }
          activeOpacity={0.7}
        >
          <Text style={styles.seeAllText}>View all products</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
