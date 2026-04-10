package com.website.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class OrderRequest {
    @NotBlank(message = "Địa chỉ giao hàng không được để trống")
    private String shippingAddress;

    @NotBlank(message = "Số điện thoại không được để trống")
    private String shippingPhone;

    private String recipientName;

    @NotNull(message = "Phương thức thanh toán không được để trống")
    private String paymentMethod;

    private String couponCode;
}
