package com.cafe.cafemanagement.dtos.analytics.productDetails;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
public class ProductWasteAnalyticsResponse {

    private Long quantityWasted;

    private BigDecimal wasteCost;

    private BigDecimal wastePercent;
}
