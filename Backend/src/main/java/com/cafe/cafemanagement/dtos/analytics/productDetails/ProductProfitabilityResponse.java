package com.cafe.cafemanagement.dtos.analytics.productDetails;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
public class ProductProfitabilityResponse {

    private BigDecimal unitProfit;
    private BigDecimal marginPercent;

    private BigDecimal totalGrossProfit;

    private String profitabilityLevel;
}
