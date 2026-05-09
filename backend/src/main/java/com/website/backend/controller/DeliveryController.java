package com.website.backend.controller;

import com.website.backend.entity.CartItem;
import com.website.backend.repository.CartItemRepository;
import com.website.backend.service.MapService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/delivery") // Đổi tên cho chuyên nghiệp hơn
public class DeliveryController {

    @Autowired
    private MapService mapService;

    @Autowired
    private CartItemRepository cartItemRepository; // Để lấy giỏ hàng của khách

    @GetMapping("/calculate")
    public ResponseEntity<?> calculateDelivery(
            @RequestParam String address,
            @RequestParam Long userId) {
        try {
            // 1. Lấy khoảng cách từ Google Maps
            double km = mapService.getDistance(address);

            if (km == -1.0) return ResponseEntity.badRequest().body("Shop chỉ giao tại Hà Nội");
            if (km == -2.0) return ResponseEntity.badRequest().body("Địa chỉ quá xa (>30km)");

            // 2. Lấy giỏ hàng của User
            List<CartItem> cartItems = cartItemRepository.findByUserId(userId);
            if (cartItems.isEmpty()) return ResponseEntity.badRequest().body("Giỏ hàng đang trống");

            // --- LOGIC TÍNH THỜI GIAN CHẾ BIẾN ĐỘNG ---

            // Bước 2.1: Tìm thời gian chế biến của biến thể (Variant) lâu nhất
            int maxBasePrepTime = cartItems.stream()
                    .map(item -> {
                        if (item.getVariant() != null && item.getVariant().getPreparationTime() != null) {
                            return item.getVariant().getPreparationTime();
                        }
                        return 15; // Mặc định 15p nếu không cấu hình
                    })
                    .max(Integer::compare)
                    .orElse(15);

            // Bước 2.2: Tính tổng số lượng tất cả các món trong giỏ
            int totalQuantity = cartItems.stream()
                    .mapToInt(CartItem::getQuantity)
                    .sum();

            // Bước 2.3: Tính toán thời gian chế biến tổng (Final Prep Time)
            // Công thức: Món lâu nhất + (Tổng số lượng - 1) * 2 phút mỗi món thêm vào
            int finalPrepTime = maxBasePrepTime + ((totalQuantity - 1) * 2);

            // Giới hạn thời gian chế biến tối đa (ví dụ không quá 120p) để tránh con số quá ảo
            finalPrepTime = Math.min(finalPrepTime, 120);

            // 3. Tính toán thời gian vận chuyển và bàn giao
            int travelTime = (int) Math.ceil(km * 3); // 3p mỗi km
            int recipientTime = 7; // 7p cho quy trình gọi điện/nhận hàng

            int totalMinutes = finalPrepTime + travelTime + recipientTime;

            // 4. Tính phí vận chuyển (5k/km, tối thiểu 15k)
            double shippingFee = Math.max(km * 5000, 15000);

            // 5. Trả về kết quả JSON
            Map<String, Object> response = new HashMap<>();
            response.put("distance", km);
            response.put("estimatedMinutes", totalMinutes); // Đây là con số Duy sẽ hiện lên giao diện
            response.put("shippingFee", shippingFee);
            response.put("details", Map.of(
                    "prepTime", finalPrepTime,
                    "travelTime", travelTime,
                    "totalItems", totalQuantity
            ));

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(500).body("Lỗi hệ thống: " + e.getMessage());
        }
    }

}
