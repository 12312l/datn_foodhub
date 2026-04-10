package com.website.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CouponResponse {
    private Long id;
    private String code;
    private Integer discountPercent;
    private BigDecimal minOrderAmount;
    private BigDecimal maxDiscount;
    private LocalDate startDate;
    private LocalDate expiryDate;
    private Boolean isActive;
    private Integer usageLimit;
    private Long usageCount;
    private List<Long> productIds;
    private List<CouponProductResponse> applicableProducts;
}
