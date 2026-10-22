package com.cafe.cafemanagement.dtos.dashboard;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class DashboardStatsResponse {
    private long totalProducts;

    private long lowStock;

    private long outOfStock;

    private long todayOrders;
}
