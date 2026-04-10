package com.website.backend.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ShippingSettingRequest {
    @NotNull(message = "Phí vận chuyển cơ bản không được để trống")
    @DecimalMin(value = "0", message = "Phí vận chuyển phải lớn hơn hoặc bằng 0")
    private BigDecimal baseFee;

    @DecimalMin(value = "0", message = "Ngưỡng miễn phí vận chuyển phải lớn hơn hoặc bằng 0")
    private BigDecimal freeShippingThreshold;

    @NotNull(message = "Trạng thái miễn phí vận chuyển không được để trống")
    private Boolean freeShippingEnabled;
}
