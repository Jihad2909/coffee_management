package com.cafe.cafemanagement.dtos.product;

import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;

@Getter
@Setter
public class ProductRequest {


    private String name;

    private String description;

    private BigDecimal price;

    private String imageUrl;

    private Boolean available;
}
