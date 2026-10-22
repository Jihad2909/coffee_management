package com.cafe.cafemanagement.services;

import com.cafe.cafemanagement.dtos.product.ProductResponse;
import com.cafe.cafemanagement.models.Products;
import com.cafe.cafemanagement.repositories.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepository;


    public Products addproduct(Products product){
        return productRepository.save(product);
    }


    public List<ProductResponse> findAllProducts(){
        return productRepository.findAllProducts();
    }



}
