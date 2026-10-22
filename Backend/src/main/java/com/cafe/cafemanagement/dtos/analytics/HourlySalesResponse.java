package com.cafe.cafemanagement.dtos.analytics;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@AllArgsConstructor
public class HourlySalesResponse {

    private Integer hour;

    private Long ordersCount;

    private Long unitsSold;

    private BigDecimal revenue;
}
