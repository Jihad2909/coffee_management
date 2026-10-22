package com.cafe.cafemanagement.services;

import com.cafe.cafemanagement.dtos.dashboard.DashboardResponse;
import com.cafe.cafemanagement.dtos.dashboard.DashboardStatsResponse;
import com.cafe.cafemanagement.dtos.dashboard.ProductAlertResponse;
import com.cafe.cafemanagement.repositories.OrdersRepository;
import com.cafe.cafemanagement.repositories.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class DashboardService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private OrdersRepository ordersRepository;


    public DashboardResponse getDashboard(){

        Long totalProducts = productRepository.countProducts();
        Long lowStock = productRepository.countLowStock();
        Long outOfStock = productRepository.countOutOfStock();

        LocalDate today = LocalDate.now();
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime startOfNextDay = today.plusDays(1).atStartOfDay();

        Long todayOrders = ordersRepository.countOrdersBetween(startOfDay,startOfNextDay);

        List<ProductAlertResponse> alerts = productRepository.findStockAlerts();
        DashboardStatsResponse stats = new DashboardStatsResponse(
                totalProducts,
                lowStock,
                outOfStock,
                todayOrders
        );

        return new DashboardResponse(
                stats,
                alerts
        );
    }

}
