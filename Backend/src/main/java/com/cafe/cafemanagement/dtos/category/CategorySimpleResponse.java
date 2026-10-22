package com.cafe.cafemanagement.dtos.category;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CategorySimpleResponse {

    private Long id;
    private String name;

    public CategorySimpleResponse(Long id, String name) {
        this.id = id;
        this.name = name;
    }
}
