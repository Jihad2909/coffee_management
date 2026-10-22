package com.cafe.cafemanagement.controllers;

import com.cafe.cafemanagement.dtos.dashboard.DashboardResponse;
import com.cafe.cafemanagement.services.DashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    @Autowired
    private DashboardService dashboardService;

    @GetMapping
    public DashboardResponse getDashboard(){
        return dashboardService.getDashboard();
    }
}
