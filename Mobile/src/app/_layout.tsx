import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="Dashboard"
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="AddProducts"
        options={{
          title: "Ajouter un produit",
        }}
      />

      <Stack.Screen
        name="products"
        options={{
          title: "Produits",
        }}
      />

      <Stack.Screen
        name="posScreen"
        options={{
          title: "Crée une commande",
        }}
      />

      <Stack.Screen
        name="orders"
        options={{
          title: "Tous les commandes",
        }}
      />

      <Stack.Screen
        name="inventory"
        options={{
          title: "Stock",
        }}
      />

      <Stack.Screen
        name="analytic"
        options={{
          title: "Analyse",
        }}
      />

      <Stack.Screen
        name="analyticDashboard"
        options={{
          title: "Tableau de bord d'analyse",
        }}
      />

      <Stack.Screen
        name="productDetails"
        options={{
          title: "Les details",
        }}
      />
      <Stack.Screen
        name="product/[id]"
        options={{
          title: "Les details de",
        }}
      />
    </Stack>
  );
}
