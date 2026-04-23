package com.website.backend.controller;

import com.website.backend.entity.Product;
import com.website.backend.repository.ProductRepository;
import com.website.backend.service.AIService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
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
    public ResponseEntity<List<Product>> getRecommendations(@PathVariable Long userId) {
        try {
            // Log để kiểm tra xem API có được gọi vào không
            System.out.println("Đang test gợi ý cho User ID: " + userId);

            List<Product> recommendations = aiService.getRecommendations(userId);

            // Mẹo test: Nếu mảng rỗng, lấy đại vài món trong DB ra để chắc chắn API vẫn sống
            if (recommendations == null || recommendations.isEmpty()) {
                System.out.println("AI trả về rỗng, đang lấy dữ liệu mẫu...");
                return ResponseEntity.ok(productRepository.findAll(PageRequest.of(0, 5)).getContent());
            }

            return ResponseEntity.ok(recommendations);
        } catch (Exception e) {
            e.printStackTrace(); // In lỗi chi tiết ra console IntelliJ
            return ResponseEntity.status(500).build();
        }
    }
}
