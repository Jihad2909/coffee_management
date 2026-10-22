package com.cafe.cafemanagement.dtos.analytics;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@AllArgsConstructor
public class ProductInventoryValueResponse {

    private Long productId;
    private String productName;

    private Integer stock;

    private BigDecimal costPrice;
    private BigDecimal salePrice;

    private BigDecimal inventoryValue;
    private BigDecimal potentialRevenue;
    private BigDecimal potentialProfit;
}
