package com.cafe.cafemanagement.dtos.analytics.productDetails;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
public class ProductSalesAnalyticsResponse {

    private Long ordersCount;
    private Long unitsSold;

    private BigDecimal revenue;
    private BigDecimal cogs;

    private BigDecimal grossProfit;
    private BigDecimal marginPercent;

    private BigDecimal averageUnitsPerOrder;
}
