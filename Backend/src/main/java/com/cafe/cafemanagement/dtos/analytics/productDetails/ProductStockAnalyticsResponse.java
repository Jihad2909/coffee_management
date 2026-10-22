package com.cafe.cafemanagement.dtos.analytics.productDetails;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
public class ProductStockAnalyticsResponse {

    private Integer currentStock;
    private Integer minStock;

    private String stockStatus;

    private BigDecimal stockValue;

    private BigDecimal potentialRevenue;
    private BigDecimal potentialProfit;
}
