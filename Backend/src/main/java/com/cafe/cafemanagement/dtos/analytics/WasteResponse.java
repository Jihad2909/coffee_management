package com.cafe.cafemanagement.dtos.analytics;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@AllArgsConstructor
public class WasteResponse {

    private Long productId;

    private String productName;

    private Long quantityWasted;

    private BigDecimal wasteCost;

}
