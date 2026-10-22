package com.cafe.cafemanagement.dtos.analytics.productDetails;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ProductRecommendationResponse {

    private String type;
    private String level;
    private String message;
}
