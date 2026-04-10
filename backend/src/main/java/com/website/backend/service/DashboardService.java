package com.website.backend.service;

import java.math.BigDecimal;
import java.time.LocalDate;

public interface DashboardService {
    BigDecimal getTotalRevenue();
    Long getTotalOrders();
    Long getTotalUsers();
    Long getTotalProducts();
    BigDecimal getRevenueByDate(LocalDate date);
    BigDecimal getRevenueByRange(LocalDate startDate, LocalDate endDate);
    BigDecimal getRevenueByMonth(int year, int month);
    BigDecimal getRevenueByYear(int year);
}
