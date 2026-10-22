package com.cafe.cafemanagement.dtos.analytics;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@AllArgsConstructor
public class ProductSalesRawResponse {

    private Long productId;
    private String productName;
    private Long unitsSold;
    private BigDecimal revenue;
    private BigDecimal cogs;
}
