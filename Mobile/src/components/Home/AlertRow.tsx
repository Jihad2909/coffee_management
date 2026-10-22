import { Text, TouchableOpacity, View } from "react-native";

import { ProductAlert } from "../../models/Product";
import {
  getStockStatus,
  statusColors,
  statusLabel,
} from "../../utils/stock.utils";

import { styles } from "./AlertRow.styles";

type AlertRowProps = {
  item: ProductAlert;
  onPress: (id: string) => void;
};

export default function AlertRow({ item, onPress }: AlertRowProps) {
  const status = getStockStatus(item.stock, item.minStock);

  const { fg, bg } = statusColors(status);

  const unit = item.unit ?? "units";

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

        <View
          style={[
            styles.badge,
            {
              backgroundColor: bg,
            },
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              {
                color: fg,
              },
            ]}
          >
            {statusLabel(status)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
