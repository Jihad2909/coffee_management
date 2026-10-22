package com.cafe.cafemanagement.dtos.analytics.productDetails;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
public class ProductInfoResponse {

    private Long id;
    private String name;
    private String description;
    private String categoryName;
    private String imageUrl;

    private BigDecimal salePrice;
    private BigDecimal costPrice;

    private BigDecimal unitProfit;
    private BigDecimal marginPercent;

    private Boolean available;
}
