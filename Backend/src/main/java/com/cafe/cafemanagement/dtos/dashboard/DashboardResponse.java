package com.cafe.cafemanagement.dtos.dashboard;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor

public class DashboardResponse {

    private DashboardStatsResponse stats;

    private List<ProductAlertResponse> alerts;
}
