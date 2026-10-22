package com.cafe.cafemanagement.services;

import com.cafe.cafemanagement.dtos.analytics.SalesPeriodResponse;
import com.cafe.cafemanagement.dtos.analytics.SalesSummaryResponse;
import com.cafe.cafemanagement.dtos.order.OrderItemRequest;
import com.cafe.cafemanagement.dtos.order.OrderItemResponse;
import com.cafe.cafemanagement.dtos.order.OrderRequest;
import com.cafe.cafemanagement.dtos.order.OrderResponse;
import com.cafe.cafemanagement.models.*;
import com.cafe.cafemanagement.repositories.OrdersRepository;
import com.cafe.cafemanagement.repositories.ProductRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class OrderService {

    @Autowired
    private OrdersRepository ordersRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private InventoryService inventoryService;

    @Transactional
    public OrderResponse createOrder(OrderRequest request) {

        // 1. Validation générale
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new RuntimeException("Order must contain at least one item");
        }

        // 2. Validation des produits
        for (OrderItemRequest itemRequest : request.getItems()) {

            if (itemRequest.getQuantity() == null
                    || itemRequest.getQuantity() <= 0) {

                throw new RuntimeException(
                        "Quantity must be greater than 0"
                );
            }

            Products product = productRepository.findById(
                    itemRequest.getProductId()
            ).orElseThrow(() ->
                    new RuntimeException(
                            "Product not found with id: "
                                    + itemRequest.getProductId()
                    )
            );

            if (!product.isAvailable()) {
                throw new RuntimeException(
                        "Product is not available: "
                                + product.getName()
                );
            }

            if (product.getStock() < itemRequest.getQuantity()) {

                throw new RuntimeException(
                        "Insufficient stock for "
                                + product.getName()
                                + ". Available: "
                                + product.getStock()
                                + ", requested: "
                                + itemRequest.getQuantity()
                );
            }
        }

        // 3. Création de la commande
        Orders order = new Orders();
        order.setStatus(request.getStatus());

        List<OrderItem> orderItems = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;


        // 4. Création des OrderItems
        for (OrderItemRequest itemRequest : request.getItems()) {

            Products product = productRepository.findById(
                    itemRequest.getProductId()
            ).orElseThrow(() ->
                    new RuntimeException(
                            "Product not found with id: "
                                    + itemRequest.getProductId()
                    )
            );

            BigDecimal subtotal =
                    product.getPrice()
                            .multiply(
                                    BigDecimal.valueOf(
                                            itemRequest.getQuantity()
                                    )
                            );

            OrderItem orderItem = new OrderItem();

            orderItem.setQuantity(itemRequest.getQuantity());

            // Prix de vente au moment de la vente
            orderItem.setUnitPrice(product.getPrice());

            // Coût au moment de la vente
            orderItem.setUnitCost(product.getCostPrice());

            orderItem.setProducts(product);
            orderItem.setOrders(order);

            orderItems.add(orderItem);

            total = total.add(subtotal);
        }

        order.setTotal(total);
        order.setItems(orderItems);

        Orders savedOrder = ordersRepository.save(order);

        // 7. Diminution du stock
        for (OrderItemRequest itemRequest : request.getItems()) {

            inventoryService.removeStock(
                    itemRequest.getProductId(),
                    itemRequest.getQuantity(),
                    InventoryMovementType.SALE,
                    "Commande Vendu"
            );
        }

        return toResponse(savedOrder);
    }

    private OrderResponse toResponse(Orders order) {

        List<OrderItemResponse> items = order.getItems()
                .stream()
                .map(item -> {

                    BigDecimal subtotal =
                            item.getUnitPrice()
                                    .multiply(
                                            BigDecimal.valueOf(
                                                    item.getQuantity()
                                            )
                                    );

                    return new OrderItemResponse(
                            item.getProducts().getId(),
                            item.getProducts().getName(),
                            item.getQuantity(),
                            item.getUnitPrice(),
                            subtotal
                    );

                })
                .toList();

        return new OrderResponse(
                order.getId(),
                order.getTotal(),
                order.getStatus(),
                order.getCreatedAt(),
                items
        );
    }

    public List<OrderResponse> getAllOrders() {

        List<Orders> orders = ordersRepository.findAllOrdersWithItems();

        return orders.stream()
                .map(this::toResponse)
                .toList();
    }

    public SalesSummaryResponse getSalesSummary() {

        List<Orders> orders = ordersRepository.findAllOrdersWithItems();

        BigDecimal revenue = BigDecimal.ZERO;
        BigDecimal cogs = BigDecimal.ZERO;

        for (Orders order : orders) {

            if (!OrderStatus.COMPLETED.equals(order.getStatus())) {
                continue;
            }

            for (OrderItem item : order.getItems()) {

                BigDecimal itemRevenue =
                        item.getUnitPrice()
                                .multiply(
                                        BigDecimal.valueOf(
                                                item.getQuantity()
                                        )
                                );

                BigDecimal itemCogs =
                        item.getUnitCost()
                                .multiply(
                                        BigDecimal.valueOf(
                                                item.getQuantity()
                                        )
                                );

                revenue = revenue.add(itemRevenue);
                cogs = cogs.add(itemCogs);
            }
        }

        BigDecimal grossProfit = revenue.subtract(cogs);

        BigDecimal marginPercent = BigDecimal.ZERO;

        if (revenue.compareTo(BigDecimal.ZERO) > 0) {

            marginPercent =
                    grossProfit
                            .divide(
                                    revenue,
                                    4,
                                    RoundingMode.HALF_UP
                            )
                            .multiply(BigDecimal.valueOf(100));
        }

        return new SalesSummaryResponse(
                revenue,
                cogs,
                grossProfit,
                marginPercent
        );
    }



}
