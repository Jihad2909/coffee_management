package com.cafe.cafemanagement.controllers;

import com.cafe.cafemanagement.dtos.analytics.*;
import com.cafe.cafemanagement.dtos.analytics.productDetails.ProductAnalyticsResponse;
import com.cafe.cafemanagement.services.AnalyticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    @Autowired
    private AnalyticsService analyticsService;


    @GetMapping("/dashboard")
    public ResponseEntity<AnalyticsDashboardResponse> getAnalyticsDashboard() {

        return ResponseEntity.ok(
                analyticsService.getAnalyticsDashboard()
        );
    }

    @GetMapping("/product/{id}")
    public ResponseEntity<ProductAnalyticsResponse> getAnalyticsForProduct(@PathVariable() Long id) {

        return ResponseEntity.ok(
                analyticsService.getProductAnalytics(id)
        );
    }

    @GetMapping("/inventoryValue")
    public ResponseEntity<InventoryValueResponse> getInventoryValue() {

        return ResponseEntity.ok(
                analyticsService.getInventoryValue()
        );
    }

    @GetMapping("/inventory/{productId}")
    public ResponseEntity<ProductInventoryValueResponse> getProductInventoryValue(
            @PathVariable Long productId
    ) {
        return ResponseEntity.ok(
                analyticsService.getProductInventoryValue(productId)
        );
    }

    @GetMapping("/products/sales")
    public ResponseEntity<List<ProductSalesResponse>> getProductSales() {

        return ResponseEntity.ok(
                analyticsService.getProductSales()
        );
    }

    @GetMapping("/products/profitability")
    public ResponseEntity<List<ProductSalesResponse>> getProductsByProfitability() {

        return ResponseEntity.ok(
                analyticsService.getProductsByProfitability()
        );
    }

    @GetMapping("/sales/hourly")
    public ResponseEntity<List<HourlySalesResponse>> getHourlySales() {

        return ResponseEntity.ok(
                analyticsService.getHourlySales()
        );
    }

    @GetMapping("/waste")
    public ResponseEntity<List<WasteResponse>> getWasteByProduct() {

        return ResponseEntity.ok(
                analyticsService.getWasteByProduct()
        );
    }
}
