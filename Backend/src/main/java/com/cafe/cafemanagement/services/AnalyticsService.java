package com.cafe.cafemanagement.services;

import com.cafe.cafemanagement.dtos.analytics.*;
import com.cafe.cafemanagement.dtos.analytics.productDetails.*;
import com.cafe.cafemanagement.dtos.inventory.InventoryMovementResponse;
import com.cafe.cafemanagement.models.*;
import com.cafe.cafemanagement.repositories.InventoryRepository;
import com.cafe.cafemanagement.repositories.OrderItemRepository;
import com.cafe.cafemanagement.repositories.OrdersRepository;
import com.cafe.cafemanagement.repositories.ProductRepository;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class AnalyticsService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private OrdersRepository ordersRepository;

    @Autowired
    private InventoryRepository inventoryRepository;


    public InventoryValueResponse getInventoryValue() {

        List<Products> products = productRepository.findAll();

        BigDecimal stockValue = BigDecimal.ZERO;
        BigDecimal potentialRevenue = BigDecimal.ZERO;

        long outOfStock = 0;
        long lowStock = 0;

        for (Products product : products) {

            int stock = product.getStock();

            if (stock == 0) {
                outOfStock++;
            }

            if (stock > 0 && stock <= product.getMinStock()) {
                lowStock++;
            }

            BigDecimal productStockValue =
                    product.getCostPrice()
                            .multiply(
                                    BigDecimal.valueOf(stock)
                            );

            stockValue =
                    stockValue.add(productStockValue);

            BigDecimal productPotentialRevenue =
                    product.getPrice()
                            .multiply(
                                    BigDecimal.valueOf(stock)
                            );

            potentialRevenue =
                    potentialRevenue.add(
                            productPotentialRevenue
                    );
        }

        BigDecimal potentialProfit =
                potentialRevenue.subtract(stockValue);

        return new InventoryValueResponse(
                stockValue,
                potentialRevenue,
                potentialProfit,
                (long) products.size(),
                outOfStock,
                lowStock
        );
    }

    public ProductInventoryValueResponse getProductInventoryValue(Long productId) {

        Products product = productRepository.findById(productId)
                .orElseThrow(() ->
                        new RuntimeException("Product not found with id: " + productId)
                );

        Integer stock = product.getStock();

        BigDecimal inventoryValue =
                product.getCostPrice()
                        .multiply(BigDecimal.valueOf(stock));

        BigDecimal potentialRevenue =
                product.getPrice()
                        .multiply(BigDecimal.valueOf(stock));

        BigDecimal potentialProfit =
                potentialRevenue.subtract(inventoryValue);

        return new ProductInventoryValueResponse(
                product.getId(),
                product.getName(),
                stock,
                product.getCostPrice(),
                product.getPrice(),
                inventoryValue,
                potentialRevenue,
                potentialProfit
        );
    }

    public List<ProductSalesResponse> getProductSales() {

        List<ProductSalesRawResponse> rawResults =
                orderItemRepository.findProductSales();

        return rawResults.stream()
                .map(raw -> {

                    BigDecimal grossProfit =
                            raw.getRevenue()
                                    .subtract(raw.getCogs());

                    BigDecimal marginPercent = BigDecimal.ZERO;

                    if (raw.getRevenue().compareTo(BigDecimal.ZERO) > 0) {

                        marginPercent =
                                grossProfit
                                        .divide(
                                                raw.getRevenue(),
                                                4,
                                                RoundingMode.HALF_UP
                                        )
                                        .multiply(BigDecimal.valueOf(100))
                                        .setScale(2, RoundingMode.HALF_UP);
                    }

                    return new ProductSalesResponse(
                            raw.getProductId(),
                            raw.getProductName(),
                            raw.getUnitsSold(),
                            raw.getRevenue(),
                            raw.getCogs(),
                            grossProfit,
                            marginPercent
                    );
                })
                .toList();
    }

    public List<ProductSalesResponse> getProductsByProfitability() {

        List<ProductSalesRawResponse> rawResults =
                orderItemRepository.findProductsByProfitability();

        return rawResults.stream()
                .map(raw -> {

                    BigDecimal grossProfit =
                            raw.getRevenue()
                                    .subtract(raw.getCogs());

                    BigDecimal marginPercent = BigDecimal.ZERO;

                    if (raw.getRevenue().compareTo(BigDecimal.ZERO) > 0) {

                        marginPercent =
                                grossProfit
                                        .divide(
                                                raw.getRevenue(),
                                                4,
                                                RoundingMode.HALF_UP
                                        )
                                        .multiply(BigDecimal.valueOf(100))
                                        .setScale(2, RoundingMode.HALF_UP);
                    }

                    return new ProductSalesResponse(
                            raw.getProductId(),
                            raw.getProductName(),
                            raw.getUnitsSold(),
                            raw.getRevenue(),
                            raw.getCogs(),
                            grossProfit,
                            marginPercent
                    );
                })
                .toList();
    }

    public List<HourlySalesResponse> getHourlySales() {

        List<Orders> orders =
                ordersRepository.findCompletedOrdersWithItems();

        Map<Integer, Long> ordersByHour = new HashMap<>();
        Map<Integer, Long> unitsByHour = new HashMap<>();
        Map<Integer, BigDecimal> revenueByHour = new HashMap<>();

        for (Orders order : orders) {

            int hour = order.getCreatedAt().getHour();

            // Nombre de commandes
            ordersByHour.merge(hour, 1L, Long::sum);

            for (OrderItem item : order.getItems()) {

                // Quantité vendue
                unitsByHour.merge(
                        hour,
                        item.getQuantity().longValue(),
                        Long::sum
                );

                // Chiffre d'affaires
                BigDecimal subtotal =
                        item.getUnitPrice()
                                .multiply(
                                        BigDecimal.valueOf(item.getQuantity())
                                );

                revenueByHour.merge(
                        hour,
                        subtotal,
                        BigDecimal::add
                );
            }
        }

        List<HourlySalesResponse> result = new ArrayList<>();

        for (int hour = 0; hour < 24; hour++) {

            Long ordersCount =
                    ordersByHour.getOrDefault(hour, 0L);

            Long unitsSold =
                    unitsByHour.getOrDefault(hour, 0L);

            BigDecimal revenue =
                    revenueByHour.getOrDefault(
                            hour,
                            BigDecimal.ZERO
                    );

            result.add(
                    new HourlySalesResponse(
                            hour,
                            ordersCount,
                            unitsSold,
                            revenue
                    )
            );
        }

        return result;
    }

    public List<WasteResponse> getWasteByProduct() {
        List<InventoryMovement> movements =
                inventoryRepository.findByTypeOrderByCreatedAtDesc(
                        InventoryMovementType.WASTE
                );

        Map<Long, WasteAccumulator> wasteMap = new HashMap<>();

        for (InventoryMovement movement : movements) {

            Products product = movement.getProduct();

            Long productId = product.getId();

            WasteAccumulator accumulator =
                    wasteMap.computeIfAbsent(
                            productId,
                            id -> new WasteAccumulator(
                                    product.getId(),
                                    product.getName(),
                                    0L,
                                    BigDecimal.ZERO
                            )
                    );

            accumulator.quantityWasted +=
                    movement.getQuantity();

            BigDecimal cost =
                    product.getCostPrice()
                            .multiply(
                                    BigDecimal.valueOf(
                                            movement.getQuantity()
                                    )
                            );

            accumulator.wasteCost =
                    accumulator.wasteCost.add(cost);
        }

        return wasteMap.values()
                .stream()
                .sorted(
                        Comparator.comparing(
                                WasteAccumulator::getWasteCost
                        ).reversed()
                )
                .map(accumulator ->
                        new WasteResponse(
                                accumulator.productId,
                                accumulator.productName,
                                accumulator.quantityWasted,
                                accumulator.wasteCost
                        )
                )
                .toList();
    }

    public SalesPeriodResponse getSalesForPeriod(LocalDateTime start, LocalDateTime end) {

        List<Orders> orders =
                ordersRepository.findOrdersBetween(start, end);

        BigDecimal revenue = BigDecimal.ZERO;
        BigDecimal cogs = BigDecimal.ZERO;

        long ordersCount = 0;
        long unitsSold = 0;

        for (Orders order : orders) {

            if (!OrderStatus.COMPLETED.equals(order.getStatus())) {
                continue;
            }

            ordersCount++;

            for (OrderItem item : order.getItems()) {

                BigDecimal quantity =
                        BigDecimal.valueOf(item.getQuantity());

                revenue = revenue.add(
                        item.getUnitPrice().multiply(quantity)
                );

                cogs = cogs.add(
                        item.getUnitCost().multiply(quantity)
                );

                unitsSold += item.getQuantity();
            }
        }

        BigDecimal grossProfit =
                revenue.subtract(cogs);

        BigDecimal marginPercent = BigDecimal.ZERO;

        if (revenue.compareTo(BigDecimal.ZERO) > 0) {

            marginPercent =
                    grossProfit
                            .divide(
                                    revenue,
                                    4,
                                    RoundingMode.HALF_UP
                            )
                            .multiply(BigDecimal.valueOf(100));
        }

        return new SalesPeriodResponse(
                revenue,
                cogs,
                grossProfit,
                marginPercent,
                ordersCount,
                unitsSold
        );
    }

    public AnalyticsDashboardResponse getAnalyticsDashboard() {

        SalesPeriodResponse sales = getSalesForPeriod(
                LocalDateTime.now().toLocalDate().atStartOfDay(),
                LocalDateTime.now().plusDays(1).toLocalDate().atStartOfDay()
        );

        InventoryValueResponse inventory = getInventoryValue();

        List<ProductSalesResponse> productSales = getProductSales();

        List<ProductSalesResponse> profitability = getProductsByProfitability();

        List<HourlySalesResponse> hourlySales = getHourlySales();

        List<WasteResponse> waste = getWasteByProduct();

        return new AnalyticsDashboardResponse(
                sales,
                inventory,
                productSales,
                profitability,
                hourlySales,
                waste
        );
    }

    public ProductAnalyticsResponse getProductAnalytics(Long productId) {

        Products product = productRepository.findById(productId)
                .orElseThrow(() ->
                        new RuntimeException("Produit introuvable : " + productId)
                );

        List<OrderItem> sales =
                orderItemRepository.findCompletedItemsByProductId(productId);

        List<InventoryMovement> movements =
                inventoryRepository.findByProductIdOrderByCreatedAtDesc(productId);

        BigDecimal unitProfit =
                product.getPrice().subtract(product.getCostPrice());

        BigDecimal marginPercent = BigDecimal.ZERO;

        if (product.getPrice().compareTo(BigDecimal.ZERO) > 0) {

            marginPercent = unitProfit
                    .divide(product.getPrice(), 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));

        }

        ProductInfoResponse productInfo =
                new ProductInfoResponse(
                        product.getId(),
                        product.getName(),
                        product.getDescription(),
                        product.getCategory().getName(),
                        product.getImageUrl(),
                        product.getPrice(),
                        product.getCostPrice(),
                        unitProfit,
                        marginPercent,
                        product.isAvailable()
                );

        //Analyse de stock
        Integer stock = product.getStock();
        Integer minStock = product.getMinStock();

        String stockStatus;

        if (stock == 0) {
            stockStatus = "OUT";
        } else if (stock <= minStock) {
            stockStatus = "LOW";
        } else {
            stockStatus = "OK";
        }

        BigDecimal stockValue =
                product.getCostPrice()
                        .multiply(BigDecimal.valueOf(stock));
        BigDecimal potentialRevenue =
                product.getPrice()
                        .multiply(BigDecimal.valueOf(stock));
        BigDecimal potentialProfit =
                potentialRevenue.subtract(stockValue);

        ProductStockAnalyticsResponse stockAnalytics =
                new ProductStockAnalyticsResponse(
                        stock,
                        minStock,
                        stockStatus,
                        stockValue,
                        potentialRevenue,
                        potentialProfit
                );

        //Analyse de vente
        long ordersCount = sales.stream()
                .map(item -> item.getOrders().getId())
                .distinct()
                .count();
        long unitsSold = sales.stream()
                .mapToLong(item -> item.getQuantity().longValue())
                .sum();

        BigDecimal revenue = sales.stream()
                .map(item ->
                        item.getUnitPrice()
                                .multiply(
                                        BigDecimal.valueOf(item.getQuantity())
                                )
                )
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal cogs = sales.stream()
                .map(item ->
                        item.getUnitCost()
                                .multiply(
                                        BigDecimal.valueOf(item.getQuantity())
                                )
                )
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal grossProfit =
                revenue.subtract(cogs);

        BigDecimal salesMarginPercent = BigDecimal.ZERO;

        if (revenue.compareTo(BigDecimal.ZERO) > 0) {

            salesMarginPercent = grossProfit
                    .divide(revenue, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
        }

        BigDecimal averageUnitsPerOrder = BigDecimal.ZERO;

        if (ordersCount > 0) {

            averageUnitsPerOrder =
                    BigDecimal.valueOf(unitsSold)
                            .divide(
                                    BigDecimal.valueOf(ordersCount),
                                    2,
                                    RoundingMode.HALF_UP
                            );
        }
        ProductSalesAnalyticsResponse salesAnalytics =
                new ProductSalesAnalyticsResponse(
                        ordersCount,
                        unitsSold,
                        revenue,
                        cogs,
                        grossProfit,
                        salesMarginPercent,
                        averageUnitsPerOrder
                );


        //Analyse de rentabilité
        String profitabilityLevel;

        if (salesMarginPercent.compareTo(BigDecimal.valueOf(50)) >= 0) {
            profitabilityLevel = "HIGH";
        } else if (salesMarginPercent.compareTo(BigDecimal.valueOf(25)) >= 0) {
            profitabilityLevel = "MEDIUM";
        } else {
            profitabilityLevel = "LOW";
        }
        ProductProfitabilityResponse profitability =
                new ProductProfitabilityResponse(
                        unitProfit,
                        salesMarginPercent,
                        grossProfit,
                        profitabilityLevel
                );

        //Analyse de gaspillage
        long quantityWasted = movements.stream()
                .filter(m ->
                        m.getType() == InventoryMovementType.WASTE
                )
                .mapToLong(m -> m.getQuantity().longValue())
                .sum();
        BigDecimal wasteCost = movements.stream()
                .filter(m ->
                        m.getType() == InventoryMovementType.WASTE
                )
                .map(m ->
                        product.getCostPrice()
                                .multiply(
                                        BigDecimal.valueOf(m.getQuantity())
                                )
                )
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal wastePercent = BigDecimal.ZERO;

        long totalConsumed = unitsSold + quantityWasted;

        if (totalConsumed > 0) {

            wastePercent =
                    BigDecimal.valueOf(quantityWasted)
                            .divide(
                                    BigDecimal.valueOf(totalConsumed),
                                    4,
                                    RoundingMode.HALF_UP
                            )
                            .multiply(BigDecimal.valueOf(100));
        }
        ProductWasteAnalyticsResponse waste =
                new ProductWasteAnalyticsResponse(
                        quantityWasted,
                        wasteCost,
                        wastePercent
                );

        //Mouvement de produit
        List<InventoryMovementResponse> stockMovements =
                movements.stream()
                        .map(m -> new InventoryMovementResponse(
                                m.getId(),
                                m.getProduct().getId(),
                                m.getProduct().getName(),
                                m.getQuantity(),
                                m.getType(),
                                m.getReason(),
                                m.getCreatedAt()
                        ))
                        .toList();

        //Performance de Produit
        BigDecimal revenueSharePercent = BigDecimal.ZERO;
        String performanceLevel;

        List<ProductSalesResponse> allProductSales =
                getProductSales();

        List<ProductSalesResponse> allProfitability =
                getProductsByProfitability();

        Long salesRank = null;

        for (int i = 0; i < allProductSales.size(); i++) {

            if (allProductSales.get(i)
                    .getProductId()
                    .equals(productId)) {

                salesRank = (long) (i + 1);
                break;
            }
        }

        Long profitabilityRank = null;

        for (int i = 0; i < allProfitability.size(); i++) {

            if (allProfitability.get(i)
                    .getProductId()
                    .equals(productId)) {

                profitabilityRank = (long) (i + 1);
                break;
            }
        }

        if (unitsSold >= 100 && salesMarginPercent.compareTo(BigDecimal.valueOf(40)) >= 0) {
            performanceLevel = "HIGH";
        } else if (unitsSold >= 30) {
            performanceLevel = "MEDIUM";
        } else {
            performanceLevel = "LOW";
        }

        ProductPerformanceResponse performance =
                new ProductPerformanceResponse(
                        salesRank,
                        profitabilityRank,
                        revenueSharePercent,
                        performanceLevel
                );

        //Recommandations
        List<ProductRecommendationResponse> recommendations =
                new ArrayList<>();
        generateRecommendations(
                product,
                salesAnalytics,
                profitability,
                waste,
                recommendations
        );


        return new ProductAnalyticsResponse(
                productInfo,
                stockAnalytics,
                salesAnalytics,
                profitability,
                waste,
                performance,
                stockMovements,
                recommendations
        );

    }

    private void generateRecommendations(
            Products product,
            ProductSalesAnalyticsResponse sales,
            ProductProfitabilityResponse profitability,
            ProductWasteAnalyticsResponse waste,
            List<ProductRecommendationResponse> recommendations
    ) {

        // STOCK
        if (product.getStock() == 0) {

            recommendations.add(
                    new ProductRecommendationResponse(
                            "STOCK",
                            "CRITICAL",
                            "Le produit est en rupture de stock. Prévoir un réapprovisionnement."
                    )
            );

        } else if (product.getStock() <= product.getMinStock()) {

            recommendations.add(
                    new ProductRecommendationResponse(
                            "STOCK",
                            "WARNING",
                            "Le stock est faible. Prévoir prochainement un réapprovisionnement."
                    )
            );
        }


        // RENTABILITÉ
        if (profitability.getMarginPercent()
                .compareTo(BigDecimal.valueOf(20)) < 0) {

            recommendations.add(
                    new ProductRecommendationResponse(
                            "PROFITABILITY",
                            "WARNING",
                            "La marge est faible. Vérifier le prix de revient ou le prix de vente."
                    )
            );

        } else if (profitability.getMarginPercent()
                .compareTo(BigDecimal.valueOf(50)) >= 0) {

            recommendations.add(
                    new ProductRecommendationResponse(
                            "PROFITABILITY",
                            "GOOD",
                            "Très bonne marge. Ce produit est fortement rentable."
                    )
            );
        }


        // GASPILLAGE
        if (waste.getWastePercent()
                .compareTo(BigDecimal.valueOf(20)) >= 0) {

            recommendations.add(
                    new ProductRecommendationResponse(
                            "WASTE",
                            "CRITICAL",
                            "Le niveau de gaspillage est élevé. Réduire les quantités préparées ou achetées."
                    )
            );

        } else if (waste.getWastePercent()
                .compareTo(BigDecimal.valueOf(10)) >= 0) {

            recommendations.add(
                    new ProductRecommendationResponse(
                            "WASTE",
                            "WARNING",
                            "Le gaspillage commence à être important. Surveiller ce produit."
                    )
            );
        }


        // PRODUIT TRÈS PERFORMANT
        if (sales.getUnitsSold() >= 100
                && profitability.getMarginPercent()
                .compareTo(BigDecimal.valueOf(40)) >= 0) {

            recommendations.add(
                    new ProductRecommendationResponse(
                            "PERFORMANCE",
                            "GOOD",
                            "Produit très vendu et rentable. Prioriser sa disponibilité."
                    )
            );
        }


        // PRODUIT PEU VENDU
        if (sales.getUnitsSold() < 10) {

            recommendations.add(
                    new ProductRecommendationResponse(
                            "SALES",
                            "WARNING",
                            "Le produit est peu vendu. Envisager une promotion ou revoir son positionnement."
                    )
            );
        }
    }




}
