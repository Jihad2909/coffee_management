import ProductDetailScreen from "@/screens/ProductDetails/ProductDetailsScreen";
import { useLocalSearchParams } from "expo-router";

export default function ProductDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ProductDetailScreen route={{ params: { id: Number(id) } }} />;
}
