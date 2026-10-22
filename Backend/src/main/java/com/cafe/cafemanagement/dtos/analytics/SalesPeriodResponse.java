package com.cafe.cafemanagement.dtos.analytics;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@AllArgsConstructor
public class SalesPeriodResponse {

    private BigDecimal revenue;

    private BigDecimal coutDesProduitsVendus;

    private BigDecimal grossProfit;

    private BigDecimal marginPercent;

    private Long ordersCount;

    private Long unitsSold;
}
