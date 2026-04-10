package com.website.backend.controller;

import com.website.backend.dto.response.ProductResponse;
import com.website.backend.service.DashboardService;
import com.website.backend.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final DashboardService dashboardService;
    private final ProductService productService;

    @GetMapping("/dashboard/stats")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        return ResponseEntity.ok(Map.of(
                "totalRevenue", dashboardService.getTotalRevenue(),
                "totalOrders", dashboardService.getTotalOrders(),
                "totalUsers", dashboardService.getTotalUsers(),
                "totalProducts", dashboardService.getTotalProducts()
        ));
    }

    @GetMapping("/dashboard/revenue/today")
    public ResponseEntity<BigDecimal> getTodayRevenue() {
        return ResponseEntity.ok(dashboardService.getRevenueByDate(LocalDate.now()));
    }

    @GetMapping("/dashboard/revenue/date")
    public ResponseEntity<BigDecimal> getRevenueByDate(@RequestParam LocalDate date) {
        return ResponseEntity.ok(dashboardService.getRevenueByDate(date));
    }

    @GetMapping("/dashboard/revenue/range")
    public ResponseEntity<BigDecimal> getRevenueByRange(
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate
    ) {
        return ResponseEntity.ok(dashboardService.getRevenueByRange(startDate, endDate));
    }

    @GetMapping("/dashboard/revenue/month")
    public ResponseEntity<BigDecimal> getRevenueByMonth(
            @RequestParam int year,
            @RequestParam int month
    ) {
        return ResponseEntity.ok(dashboardService.getRevenueByMonth(year, month));
    }

    @GetMapping("/dashboard/revenue/year")
    public ResponseEntity<BigDecimal> getRevenueByYear(@RequestParam int year) {
        return ResponseEntity.ok(dashboardService.getRevenueByYear(year));
    }

    @GetMapping("/dashboard/top-products")
    public ResponseEntity<List<ProductResponse>> getTopSellingProducts(
            @RequestParam(defaultValue = "10") int limit
    ) {
        return ResponseEntity.ok(productService.getTopSellingProducts(limit));
    }
}
