package com.cafe.cafemanagement.dtos.product;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProductResponse {
    private Long id;
    private String name;
    private String description;
    private BigDecimal price;
    private String imageUrl;
    private Boolean available;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long categoryId;
    private String categoryName;
    private Integer minStock;
    private Integer stock;
    private String unit;

    public ProductResponse(String name, Long id, String description, BigDecimal price, String imageUrl, Boolean available, LocalDateTime createdAt, LocalDateTime updatedAt, Long categoryId, String categoryName, Integer minStock, Integer stock, String Unit) {
        this.name = name;
        this.id = id;
        this.description = description;
        this.price = price;
        this.imageUrl = imageUrl;
        this.available = available;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.categoryId = categoryId;
        this.categoryName = categoryName;
        this.minStock = minStock;
        this.stock = stock;
        this.unit = unit;
    }
}
