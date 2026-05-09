package com.website.backend.controller;

import com.website.backend.dto.response.ProductResponse;
import com.website.backend.entity.Product;
import com.website.backend.repository.ProductRepository;
import com.website.backend.service.AIService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@Slf4j
public class AIController {

    private final AIService aiService;
    private final ProductRepository productRepository;

    @PostMapping("/chat")
    public ResponseEntity<Map<String, String>> chat(
            @RequestParam(required = false) Long userId,
            @RequestBody Map<String, String> request
    ) {
        String message = request.get("message");
        String response = aiService.chat(userId, message);
        return ResponseEntity.ok(Map.of("response", response));
    }

    @GetMapping("/recommend/{userId}")
// Đổi List<Product> thành List<ProductResponse> ở đây
    public ResponseEntity<List<ProductResponse>> getRecommendations(@PathVariable Long userId) {
        try {
            System.out.println("Đang test gợi ý cho User ID: " + userId);

            // Gọi service lấy về List DTO "sạch"
            List<ProductResponse> recommendations = aiService.getRecommendations(userId);

            if (recommendations == null || recommendations.isEmpty()) {
                System.out.println("AI trả về rỗng, đang lấy dữ liệu mẫu...");
                // Chỗ này Duy cũng phải map sang ProductResponse nếu muốn lấy mẫu,
                // hoặc tạm thời return một list rỗng để tránh lỗi kiểu dữ liệu:
                return ResponseEntity.ok(new ArrayList<>());
            }

            return ResponseEntity.ok(recommendations);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/similar/{productId}")
    public ResponseEntity<List<ProductResponse>> getSimilarProducts(@PathVariable Long productId) {
        try {
            log.info("Đang gọi AI tìm món tương tự cho Sản phẩm ID: {}", productId);

            List<ProductResponse> similarProducts = aiService.getSimilarProducts(productId);

            if (similarProducts == null || similarProducts.isEmpty()) {
                log.warn("AI không tìm thấy món nào tương tự cho Sản phẩm: {}", productId);
                return ResponseEntity.ok(new ArrayList<>());
            }

            return ResponseEntity.ok(similarProducts);
        } catch (Exception e) {
            log.error("Lỗi khi tìm món tương tự cho Sản phẩm {}: {}", productId, e.getMessage());
            return ResponseEntity.status(500).build();
        }
    }
}
