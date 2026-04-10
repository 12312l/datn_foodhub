package com.website.backend.service.impl;

import com.website.backend.repository.OrderRepository;
import com.website.backend.repository.ProductRepository;
import com.website.backend.repository.UserRepository;
import com.website.backend.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    @Override
    public BigDecimal getTotalRevenue() {
        LocalDateTime startDate = LocalDate.of(2020, 1, 1).atStartOfDay();
        LocalDateTime endDate = LocalDateTime.now();
        return orderRepository.getTotalRevenueBetweenDates(startDate, endDate);
    }

    @Override
    public Long getTotalOrders() {
        return orderRepository.count();
    }

    @Override
    public Long getTotalUsers() {
        return userRepository.count();
    }

    @Override
    public Long getTotalProducts() {
        return productRepository.count();
    }

    @Override
    public BigDecimal getRevenueByDate(LocalDate date) {
        LocalDateTime startDate = date.atStartOfDay();
        LocalDateTime endDate = date.atTime(LocalTime.MAX);
        return orderRepository.getTotalRevenueBetweenDates(startDate, endDate);
    }

    @Override
    public BigDecimal getRevenueByRange(LocalDate startDate, LocalDate endDate) {
        return orderRepository.getTotalRevenueBetweenDates(
                startDate.atStartOfDay(),
                endDate.atTime(LocalTime.MAX)
        );
    }

    @Override
    public BigDecimal getRevenueByMonth(int year, int month) {
        LocalDate startDate = LocalDate.of(year, month, 1);
        LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());
        return orderRepository.getTotalRevenueBetweenDates(
                startDate.atStartOfDay(),
                endDate.atTime(LocalTime.MAX)
        );
    }

    @Override
    public BigDecimal getRevenueByYear(int year) {
        LocalDate startDate = LocalDate.of(year, 1, 1);
        LocalDate endDate = LocalDate.of(year, 12, 31);
        return orderRepository.getTotalRevenueBetweenDates(
                startDate.atStartOfDay(),
                endDate.atTime(LocalTime.MAX)
        );
    }
}
