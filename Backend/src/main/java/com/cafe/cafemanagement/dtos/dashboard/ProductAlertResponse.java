package com.cafe.cafemanagement.dtos.dashboard;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ProductAlertResponse {
    private Long id;

    private String name;

    private String category;

    private int stock;

    private int minStock;

    private String unit;
}
