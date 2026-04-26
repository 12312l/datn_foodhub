package com.website.backend.service;

import com.website.backend.dto.request.OrderRequest;
import com.website.backend.dto.response.OrderResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface OrderService {
    OrderResponse createOrder(Long userId, OrderRequest request);
    OrderResponse getOrderById(Long orderId);
    List<OrderResponse> getUserOrders(Long userId);
    Page<OrderResponse> getAllOrders(Pageable pageable);
    OrderResponse updateOrderStatus(Long orderId, String status);
    OrderResponse updateOrder(Long orderId, OrderRequest request);
    void deleteOrder(Long orderId);
    OrderResponse cancelOrder(Long orderId, Long userId);
    String createVNPayUrl(Long orderId);

    // Thêm hàm xử lý kết quả thanh toán vào đây
    void processPaymentResult(String responseCode, String orderId);
}
