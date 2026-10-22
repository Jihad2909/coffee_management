package com.cafe.cafemanagement.repositories;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.cafe.cafemanagement.models.Orders;

@Repository
public interface OrdersRepository extends JpaRepository<Orders,Long> {


    @Query("""
        SELECT COUNT(o)
        FROM Orders o
        WHERE o.createdAt >= :startOfDay
        AND o.createdAt <= :startOfNextDay
    """)
    Long countOrdersBetween(LocalDateTime startOfDay, LocalDateTime startOfNextDay);

    @Query("""
        SELECT DISTINCT o
        FROM Orders o
        LEFT JOIN FETCH o.items i
        LEFT JOIN FETCH i.products
        ORDER BY o.createdAt DESC
    """)
    List<Orders> findAllOrdersWithItems();

    @Query("""
    SELECT DISTINCT o
    FROM Orders o
    LEFT JOIN FETCH o.items i
    LEFT JOIN FETCH i.products
    WHERE o.createdAt >= :start
      AND o.createdAt < :end
    ORDER BY o.createdAt DESC
""")
    List<Orders> findOrdersBetween(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    @Query("""
    SELECT DISTINCT o
    FROM Orders o
    LEFT JOIN FETCH o.items i
    LEFT JOIN FETCH i.products
    WHERE o.status = 'COMPLETED'
    ORDER BY o.createdAt ASC
""")
    List<Orders> findCompletedOrdersWithItems();
}
