import { Text, TouchableOpacity } from "react-native";

import { colors } from "../../constants/colors";
import { styles } from "./KpiTile.styles";

type KpiTileProps = {
  label: string;
  value: number | string;
  accent?: string;
  onPress?: () => void;
};

export default function KpiTile({
  label,
  value,
  accent = colors.primary,
  onPress,
}: KpiTileProps) {
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
