package com.cafe.cafemanagement.controllers;

import com.cafe.cafemanagement.dtos.category.CategoryResponse;
import com.cafe.cafemanagement.dtos.category.CategorySimpleResponse;
import com.cafe.cafemanagement.models.Category;
import com.cafe.cafemanagement.services.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    @Autowired
    private CategoryService categoryService;

    @GetMapping
    public List<CategorySimpleResponse> getCategory(){
        return categoryService.getAllCategory();
    }

    @GetMapping("/allwithproducts")
    public List<CategoryResponse> getAllCategoryWithProducts(){
        return categoryService.getAllProductsForCategory();
    }

    @PostMapping("/add")
    public Category addCategory(@RequestBody Category category){
        return categoryService.addCategory(category);
    }
}
