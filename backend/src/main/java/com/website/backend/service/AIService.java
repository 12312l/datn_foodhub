package com.website.backend.service;

import com.website.backend.entity.Product;

import java.util.List;

public interface AIService {
    String chat(Long userId, String message);

    // Chức năng gợi ý món ăn
    List<Product> getRecommendations(Long userId);
}
