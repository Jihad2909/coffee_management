package com.cafe.cafemanagement.controllers;

import com.cafe.cafemanagement.dtos.product.ProductResponse;
import com.cafe.cafemanagement.models.Products;
import com.cafe.cafemanagement.services.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/product")
public class ProductController {

    @Autowired
    private ProductService productService;

    @PostMapping("/add")
    public Products addProduct (@RequestBody Products product){
        return productService.addproduct(product);
    }

    @GetMapping("/all")
    public List<ProductResponse> allProducts(){
        return productService.findAllProducts();
    }
}
