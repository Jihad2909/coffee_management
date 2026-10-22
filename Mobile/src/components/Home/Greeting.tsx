import { Text, View } from "react-native";
import { styles } from "./Greeting.styles";

export default function Greeting() {
  const hour = new Date().getHours();

  const hello =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <View style={styles.greetingBlock}>
      <Text style={styles.greeting}>{hello} ☕</Text>

      <Text style={styles.shopName}>Coffee Stock</Text>

      <Text style={styles.subtitle}>
        Here’s what’s happening in your inventory
      </Text>
    </View>
  );
}
