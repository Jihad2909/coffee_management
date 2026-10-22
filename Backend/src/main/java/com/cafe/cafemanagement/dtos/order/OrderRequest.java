package com.cafe.cafemanagement.dtos.order;

import java.util.List;

import com.cafe.cafemanagement.models.OrderStatus;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor

public class OrderRequest {

    private OrderStatus status;
    private List<OrderItemRequest> items;
}
