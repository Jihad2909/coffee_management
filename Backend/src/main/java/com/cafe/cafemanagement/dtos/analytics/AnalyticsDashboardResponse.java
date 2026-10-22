package com.cafe.cafemanagement.dtos.analytics;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class AnalyticsDashboardResponse {

    private SalesPeriodResponse sales;

    private InventoryValueResponse inventory;

    private List<ProductSalesResponse> productSales;

    private List<ProductSalesResponse> profitability;

    private List<HourlySalesResponse> hourlySales;

    private List<WasteResponse> waste;

}
