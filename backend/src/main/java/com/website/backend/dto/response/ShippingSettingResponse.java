package com.website.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShippingSettingResponse {
    private Long id;
    private BigDecimal baseFee;
    private BigDecimal freeShippingThreshold;
    private Boolean freeShippingEnabled;
}
