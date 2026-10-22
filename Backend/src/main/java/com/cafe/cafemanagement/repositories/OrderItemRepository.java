package com.cafe.cafemanagement.repositories;

import com.cafe.cafemanagement.dtos.analytics.ProductSalesRawResponse;
import com.cafe.cafemanagement.models.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    @Query("""
        SELECT new com.cafe.cafemanagement.dtos.analytics.ProductSalesRawResponse(
            p.id,
            p.name,
            SUM(i.quantity),
            SUM(i.unitPrice * i.quantity),
            SUM(i.UnitCost * i.quantity)
        )
        FROM OrderItem i
        JOIN i.products p
        JOIN i.orders o
        WHERE o.status = 'COMPLETED'
        GROUP BY p.id, p.name
        ORDER BY SUM(i.quantity) DESC
    """)
    List<ProductSalesRawResponse> findProductSales();


    @Query("""
    SELECT new com.cafe.cafemanagement.dtos.analytics.ProductSalesRawResponse(
        p.id,
        p.name,
        SUM(i.quantity),
        SUM(i.unitPrice * i.quantity),
        SUM(i.UnitCost * i.quantity)
    )
    FROM OrderItem i
    JOIN i.products p
    JOIN i.orders o
    WHERE o.status = 'COMPLETED'
    GROUP BY p.id, p.name
    ORDER BY SUM(i.unitPrice * i.quantity)
             - SUM(i.UnitCost * i.quantity) DESC
""")
    List<ProductSalesRawResponse> findProductsByProfitability();

    @Query("""
    SELECT i
    FROM OrderItem i
    JOIN FETCH i.orders o
    JOIN FETCH i.products p
    WHERE p.id = :productId
      AND o.status = 'COMPLETED'
    ORDER BY o.createdAt DESC
""")
    List<OrderItem> findCompletedItemsByProductId(
            @Param("productId") Long productId
    );



}
