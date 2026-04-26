package com.website.backend.controller;

import com.website.backend.dto.request.OrderRequest;
import com.website.backend.dto.response.OrderResponse;
import com.website.backend.entity.User;
import com.website.backend.exception.CustomException;
import com.website.backend.repository.UserRepository;
import com.website.backend.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody OrderRequest request
    ) {
        Long userId = getUserId(userDetails);
        return ResponseEntity.ok(orderService.createOrder(userId, request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> getOrderById(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getOrderById(id));
    }

    @GetMapping("/my-orders")
    public ResponseEntity<List<OrderResponse>> getMyOrders(@AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        return ResponseEntity.ok(orderService.getUserOrders(userId));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<OrderResponse>> getAllOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(orderService.getAllOrders(pageable));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<OrderResponse> updateOrderStatus(
            @PathVariable Long id,
            @RequestParam String status
    ) {
        return ResponseEntity.ok(orderService.updateOrderStatus(id, status));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<OrderResponse> cancelOrder(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        Long userId = getUserId(userDetails);
        return ResponseEntity.ok(orderService.cancelOrder(id, userId));
    }

    @PostMapping("/{id}/vnpay")
    public ResponseEntity<Map<String, String>> createVNPayUrl(@PathVariable Long id) {
        String url = orderService.createVNPayUrl(id);
        return ResponseEntity.ok(Map.of("url", url));
    }

//    private Long getUserId(UserDetails userDetails) {
//        // TODO: Extract user ID from JWT properly
//        return 1L;
//    }

    private Long getUserId(UserDetails userDetails) {
        if (userDetails == null) return null;
        return userRepository.findByEmail(userDetails.getUsername())
                .map(User::getId)
                .orElseThrow(() -> CustomException.notFound("User not found"));
    }

    // Trong file OrderController.java
    @GetMapping("/vnpay-callback")
    public ResponseEntity<?> vnpayCallback(@RequestParam Map<String, String> params) {
        String responseCode = params.get("vnp_ResponseCode");
        String orderId = params.get("vnp_TxnRef");

        // Backend cập nhật Database
        orderService.processPaymentResult(responseCode, orderId);

        // Xây dựng URL an toàn (đã qua mã hóa ký tự đặc biệt)
        String frontendUrl = "http://localhost:3005/checkout/return?" + buildQueryString(params);

        return ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create(frontendUrl))
                .build();
    }

    // SỬA LẠI HÀM NÀY ĐỂ MÃ HÓA KÝ TỰ
    private String buildQueryString(Map<String, String> params) {
        return params.entrySet().stream()
                .map(e -> {
                    try {
                        // Mã hóa giá trị để biến khoảng trắng thành %20 hoặc +
                        return e.getKey() + "=" + URLEncoder.encode(e.getValue(), StandardCharsets.UTF_8.toString());
                    } catch (Exception ex) {
                        return e.getKey() + "=" + e.getValue();
                    }
                })
                .collect(Collectors.joining("&"));
    }
}
