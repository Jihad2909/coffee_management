package com.cafe.cafemanagement.services;

import com.cafe.cafemanagement.dtos.category.CategoryResponse;


import com.cafe.cafemanagement.dtos.category.CategorySimpleResponse;
import com.cafe.cafemanagement.dtos.product.ProductResponse;
import com.cafe.cafemanagement.models.Category;
import com.cafe.cafemanagement.models.Products;
import com.cafe.cafemanagement.repositories.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class CategoryService {

    @Autowired
    private CategoryRepository categoryRepository;


    public Category addCategory(Category category){
        return categoryRepository.save(category);
    }

    public List<CategoryResponse> getAllProductsForCategory(){

        List<Category> categories = categoryRepository.findAll();
        List<CategoryResponse> response = new ArrayList<>();

        for (Category c : categories){
            CategoryResponse cr = new CategoryResponse();

            cr.setId(c.getId());
            cr.setName(c.getName());

            List<ProductResponse> ps = new ArrayList<>();
            for (Products p : c.getProducts()){

                ProductResponse pr = new ProductResponse(
                        p.getName(),
                        p.getId(),
                        p.getDescription(),
                        p.getPrice(),
                        p.getImageUrl(),
                        p.isAvailable(),
                        p.getCreatedAt(),
                        p.getUpdatedAt(),
                        p.getCategory().getId(),
                        p.getCategory().getName(),
                        p.getMinStock(),
                        p.getStock(),
                        p.getUnit());
                ps.add(pr);
            }
            cr.setProducts(ps);
            response.add(cr);
        }
        return response;
    }

    public List<CategorySimpleResponse> getAllCategory(){
        return categoryRepository.getCategories();
    }
}
