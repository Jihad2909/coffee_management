package com.cafe.cafemanagement.dtos.analytics;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@AllArgsConstructor
public class WasteAccumulator {
    public Long productId;
    public String productName;
    public Long quantityWasted;
    public BigDecimal wasteCost;
}
