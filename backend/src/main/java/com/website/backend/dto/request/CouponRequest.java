package com.website.backend.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class CouponRequest {
    @NotBlank(message = "Mã giảm giá không được để trống")
    private String code;

    @NotNull(message = "Phần trăm giảm giá không được để trống")
    @Min(value = 1, message = "Phần trăm giảm giá phải từ 1%")
    @Max(value = 100, message = "Phần trăm giảm giá không quá 100%")
    private Integer discountPercent;

    private BigDecimal minOrderAmount;

    private BigDecimal maxDiscount;

    private LocalDate startDate;

    @NotNull(message = "Ngày hết hạn không được để trống")
    private LocalDate expiryDate;

    private Integer usageLimit;

    private List<Long> productIds;
}
