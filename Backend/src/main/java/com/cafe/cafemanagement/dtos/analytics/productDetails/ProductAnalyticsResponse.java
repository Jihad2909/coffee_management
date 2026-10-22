package com.cafe.cafemanagement.dtos.analytics.productDetails;

import com.cafe.cafemanagement.dtos.inventory.InventoryMovementResponse;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class ProductAnalyticsResponse {

    private ProductInfoResponse product;

    private ProductStockAnalyticsResponse stock;

    private ProductSalesAnalyticsResponse sales;

    private ProductProfitabilityResponse profitability;

    private ProductWasteAnalyticsResponse waste;

    private ProductPerformanceResponse performance;

    private List<InventoryMovementResponse> stockMovements;

    private List<ProductRecommendationResponse> recommendations;
}
