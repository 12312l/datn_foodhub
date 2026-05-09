package com.website.backend.service;

import com.website.backend.dto.response.ProductResponse;
import com.website.backend.entity.Product;

import java.util.List;

public interface AIService {
    String chat(Long userId, String message);

    // Chức năng gợi ý món ăn
    List<ProductResponse> getRecommendations(Long userId);

    // ✅ THÊM MỚI: Gợi ý món tương tự (Dựa trên ID sản phẩm đang xem)
    List<ProductResponse> getSimilarProducts(Long productId);
}
