package com.website.backend.controller;

import com.website.backend.dto.request.OrderRequest;
import com.website.backend.dto.request.ShippingSettingRequest;
import com.website.backend.dto.response.OrderResponse;
import com.website.backend.dto.response.ShippingSettingResponse;
import com.website.backend.service.OrderService;
import com.website.backend.service.ShippingSettingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/orders")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminOrderController {

    private final OrderService orderService;
    private final ShippingSettingService shippingSettingService;

    @GetMapping
    public ResponseEntity<Page<OrderResponse>> getAllOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(orderService.getAllOrders(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> getOrderById(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getOrderById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<OrderResponse> updateOrder(
            @PathVariable Long id,
            @Valid @RequestBody OrderRequest request
    ) {
        return ResponseEntity.ok(orderService.updateOrder(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOrder(@PathVariable Long id) {
        orderService.deleteOrder(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<OrderResponse> updateOrderStatus(
            @PathVariable Long id,
            @RequestParam String status
    ) {
        return ResponseEntity.ok(orderService.updateOrderStatus(id, status));
    }

    @PostMapping("/{id}/vnpay")
    public ResponseEntity<Map<String, String>> createVNPayUrl(@PathVariable Long id) {
        String url = orderService.createVNPayUrl(id);
        return ResponseEntity.ok(Map.of("url", url));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<OrderResponse> cancelOrder(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.cancelOrder(id, 1L)); // Admin cancel
    }

    @GetMapping("/shipping-settings")
    public ResponseEntity<ShippingSettingResponse> getShippingSettings() {
        return ResponseEntity.ok(shippingSettingService.getCurrent());
    }

    @PutMapping("/shipping-settings")
    public ResponseEntity<ShippingSettingResponse> updateShippingSettings(
            @Valid @RequestBody ShippingSettingRequest request
    ) {
        return ResponseEntity.ok(shippingSettingService.update(request));
    }
}
