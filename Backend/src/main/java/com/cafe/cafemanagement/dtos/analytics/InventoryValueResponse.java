package com.cafe.cafemanagement.dtos.analytics;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@AllArgsConstructor
public class InventoryValueResponse {

    private BigDecimal stockValue;

    private BigDecimal potentialRevenue;

    private BigDecimal potentialProfit;

    private Long totalProducts;

    private Long outOfStock;

    private Long lowStock;

}
