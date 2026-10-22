package com.cafe.cafemanagement.dtos.category;

import com.cafe.cafemanagement.dtos.product.ProductResponse;
import lombok.*;

import java.util.List;


@Getter
@Setter
public class CategoryResponse {
    private Long id;
    private String name;
    private List<ProductResponse> products;
}


