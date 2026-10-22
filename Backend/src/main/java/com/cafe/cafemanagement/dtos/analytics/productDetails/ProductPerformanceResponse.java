package com.cafe.cafemanagement.dtos.analytics.productDetails;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
public class ProductPerformanceResponse {

    private Long salesRank;
    private Long profitabilityRank;

    private BigDecimal revenueSharePercent;

    private String performanceLevel;
}
