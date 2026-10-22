import { Text, TouchableOpacity, View } from "react-native";

import { styles } from "./QuickAction.styles";

type QuickActionProps = {
  emoji: string;
  label: string;
  onPress: () => void;
};

export default function QuickAction({
  emoji,
  label,
  onPress,
}: QuickActionProps) {
  return (
    <TouchableOpacity
      style={styles.quickAction}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.quickActionIcon}>
        <Text style={styles.quickActionEmoji}>{emoji}</Text>
      </View>

      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}
