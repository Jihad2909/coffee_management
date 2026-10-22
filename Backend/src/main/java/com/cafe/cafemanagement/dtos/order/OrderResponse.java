package com.cafe.cafemanagement.dtos.order;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import com.cafe.cafemanagement.models.OrderStatus;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor

public class OrderResponse {
    private Long id;
    private BigDecimal total;
    private OrderStatus status;
    private LocalDateTime createdAt;
    private List<OrderItemResponse> items;
}
