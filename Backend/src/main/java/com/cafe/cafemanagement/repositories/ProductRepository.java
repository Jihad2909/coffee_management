package com.cafe.cafemanagement.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.cafe.cafemanagement.dtos.dashboard.ProductAlertResponse;
import com.cafe.cafemanagement.dtos.product.ProductResponse;
import com.cafe.cafemanagement.models.Products;

@Repository
public interface ProductRepository extends JpaRepository<Products, Long> {

    @Query("""
     SELECT new com.cafe.cafemanagement.dtos.product.ProductResponse(
        p.name,
        p.id,        
        p.description,
        p.price,
        p.imageUrl,
        p.available,
        p.createdAt,
        p.updatedAt,
        c.id,
        c.name,
        p.minStock,
        p.stock,
        p.unit
    )
    FROM Products p
    JOIN p.category c
""")
    List<ProductResponse> findAllProducts();

    // Nombre total de produits
    @Query("""
        SELECT COUNT(p)
        FROM Products p
    """)
    Long countProducts();


    // Produits en rupture
    @Query("""
        SELECT COUNT(p)
        FROM Products p
        WHERE p.stock = 0
    """)
    Long countOutOfStock();


    // Produits avec stock faible
    @Query("""
        SELECT COUNT(p)
        FROM Products p
        WHERE p.stock > 0
        AND p.stock <= p.minStock
    """)
    Long countLowStock();

    @Query("""
        SELECT new com.cafe.cafemanagement.dtos.dashboard.ProductAlertResponse(
            p.id,
            p.name,
            c.name,
            p.stock,
            p.minStock,
            p.unit
        )
        FROM Products p
        JOIN p.category c
        WHERE p.stock <= p.minStock
        ORDER BY p.stock ASC
    """)
    List<ProductAlertResponse> findStockAlerts();
}
