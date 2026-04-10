package com.website.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class OrderResponse {
    private Long id;
    private Long userId;
    private String userName;
    private String userEmail;
    private String recipientName;
    private BigDecimal totalAmount;
    private BigDecimal shippingFee;
    private String shippingAddress;
    private String shippingPhone;
    private String paymentMethod;
    private String paymentStatus;
    private String status;
    private String couponCode;
    private BigDecimal discountAmount;
    private LocalDateTime createdAt;
    private List<OrderItemResponse> items;
}
