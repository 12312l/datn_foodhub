package com.website.backend.service.impl;

import com.website.backend.dto.request.AIProductRequest;
import com.website.backend.dto.request.AIRecommendationRequest;
import com.website.backend.dto.request.AIUserHistoryRequest;
import com.website.backend.entity.Product;
import com.website.backend.repository.CategoryRepository;
import com.website.backend.repository.ProductRepository;
import com.website.backend.repository.RecentlyViewedRepository;
import com.website.backend.service.AIService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AIServiceImpl implements AIService {

    private final ProductRepository productRepository;
    private final RecentlyViewedRepository recentlyViewedRepository;
    private final CategoryRepository categoryRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    private final String FLASK_URL = "http://localhost:5000/predict_foryou";

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    @Value("${gemini.model}")
    private String geminiModel;

    @Override
    public String chat(Long userId, String message) {
        // Get menu context
        String menuContext = buildMenuContext();

        // Detect intent
        String intent = detectIntent(message);

        // Process based on intent
        if (intent.equals("order")) {
            return processOrderIntent(message, userId);
        } else if (intent.equals("recommend")) {
            return processRecommendIntent(message);
        } else if (intent.equals("menu")) {
            return menuContext;
        }



        // Use Gemini for general response
        return callGemini(message, menuContext);
    }

    private String buildMenuContext() {
        StringBuilder context = new StringBuilder("📋 THỰC ĐƠN FOODHUB:\n\n");

        List<Product> products = productRepository.findAll();
        Map<Long, String> categoryNames = new HashMap<>();

        for (Product p : products) {
            if (p.getCategory() != null) {
                categoryNames.putIfAbsent(p.getCategory().getId(), p.getCategory().getName());
            }
        }

        // Group by category
        Map<String, List<Product>> byCategory = products.stream()
                .collect(Collectors.groupingBy(p ->
                        p.getCategory() != null ? p.getCategory().getName() : "Khác"));

        for (Map.Entry<String, List<Product>> entry : byCategory.entrySet()) {
            context.append("📁 ").append(entry.getKey()).append(":\n");
            for (Product p : entry.getValue()) {
                context.append("• ").append(p.getName())
                        .append(" - ").append(p.getPrice()).append(" VND\n");
            }
            context.append("\n");
        }

        return context.toString();
    }

    private String detectIntent(String message) {
        String lowerMessage = message.toLowerCase();

        if (containsAny(lowerMessage, "đặt", "mua", "gọi", "order", "thêm vào giỏ", "cho tôi", "lấy")) {
            return "order";
        } else if (containsAny(lowerMessage, "gợi ý", "recommend", "nên ăn", "ngon", "tuyệt", "ưu tiên")) {
            return "recommend";
        } else if (containsAny(lowerMessage, "menu", "thực đơn", "có gì", "danh sách", "xem")) {
            return "menu";
        }

        return "general";
    }

    private boolean containsAny(String text, String... keywords) {
        for (String keyword : keywords) {
            if (text.contains(keyword)) {
                return true;
            }
        }
        return false;
    }

    private String processOrderIntent(String message, Long userId) {
        // Extract product name from message
        List<Product> products = productRepository.findAll();
        Product matchedProduct = null;

        String lowerMessage = message.toLowerCase();
        for (Product p : products) {
            if (lowerMessage.contains(p.getName().toLowerCase())) {
                matchedProduct = p;
                break;
            }
        }

        if (matchedProduct != null) {
            return String.format(
                    "✅ Tôi đã hiểu bạn muốn đặt: %s (Giá: %s VND)\n\n" +
                    "Để xác nhận đặt món, vui lòng:\n" +
                    "1. Thêm vào giỏ hàng trên website\n" +
                    "2. Tiến hành thanh toán\n\n" +
                    "Bạn có muốn tôi gợi thêm món khác không?",
                    matchedProduct.getName(),
                    matchedProduct.getPrice()
            );
        }

        return "Bạn muốn đặt món gì? Dưới đây là một số gợi ý:\n" + buildMenuContext();
    }

    private String processRecommendIntent(String message) {
        List<Product> topProducts = productRepository.findTopRatedProducts(
                org.springframework.data.domain.PageRequest.of(0, 5));

        StringBuilder response = new StringBuilder("⭐ TOP MÓN ĂN ĐƯỢC ĐÁNH GIÁ CAO:\n\n");

        for (Product p : topProducts) {
            Double rating = productRepository.getAverageRating(p.getId());
            response.append("• ").append(p.getName())
                    .append(" - ").append(p.getPrice()).append(" VND")
                    .append(" ⭐").append(rating != null ? String.format("%.1f", rating) : "0.0").append("\n");
        }

        response.append("\nBạn có muốn đặt món nào không?");
        return response.toString();
    }

    private String callGemini(String message, String context) {
        try {
            // Check if API key is configured
            if (geminiApiKey == null || geminiApiKey.isEmpty() || geminiApiKey.equals("YOUR_GEMINI_API_KEY")) {
                return getFallbackResponse(message, context);
            }

            RestTemplate restTemplate = new RestTemplate();

            String prompt = String.format(
                    "Bạn là trợ lý AI của FoodHub - website đặt đồ ăn. " +
                    "Hãy trả lời câu hỏi của khách hàng một cách thân thiện và hữu ích.\n\n" +
                    "Thực đơn hiện tại:\n%s\n\n" +
                    "Câu hỏi: %s\n\n" +
                    "Trả lời:",
                    context, message
            );

            Map<String, Object> requestBody = Map.of(
                    "contents", new Object[]{
                            Map.of("parts", new Object[]{
                                    Map.of("text", prompt)
                            })
                    }
            );

            String url = String.format(
                    "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s",
                    geminiModel, geminiApiKey
            );

            Map<String, Object> response = restTemplate.postForObject(url, requestBody, Map.class);

            if (response != null && response.containsKey("candidates")) {
                List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
                if (!candidates.isEmpty()) {
                    Map<String, Object> candidate = candidates.get(0);
                    Map<String, Object> content = (Map<String, Object>) candidate.get("content");
                    List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
                    if (!parts.isEmpty()) {
                        return (String) parts.get(0).get("text");
                    }
                }
            }

            return getFallbackResponse(message, context);
        } catch (Exception e) {
            // SỬA TẠI ĐÂY:
            e.printStackTrace(); // Dòng này sẽ in chi tiết lỗi ra màn hình Console của IntelliJ/Eclipse

            // Fallback to simple response
            return getFallbackResponse(message, context);
        }
    }

    private String getFallbackResponse(String message, String context) {
        String lowerMessage = message.toLowerCase();

        if (containsAny(lowerMessage, "xin chào", "hello", "hi", "chào")) {
            return "Xin chào! 👋\n\nTôi là trợ lý FoodHub.\n\nBạn cần hỗ trợ gì?\n\n• Tìm món ăn\n• Xem thực đơn\n• Kiểm tra đơn hàng\n• Giải đáp thắc mắc";
        }

        if (containsAny(lowerMessage, "giờ mở", "giờ đóng", "hour", "time")) {
            return "🕐 **Giờ hoạt động:**\n\n• Thứ 2 - Chủ nhật: 8:00 - 22:00\n\nBạn có muốn đặt món không?";
        }

        if (containsAny(lowerMessage, "liên hệ", "contact", "hotline", "phone")) {
            return "📞 **Liên hệ FoodHub:**\n\n• Hotline: 1900-xxxx\n• Email: support@foodhub.com\n• Địa chỉ: Hà Nội, Việt Nam";
        }

        if (containsAny(lowerMessage, "giá", "tiền", "price", "bao nhiêu")) {
            return "💰 **Giá cả:**\n\nGiá món ăn dao động từ **25.000 - 350.000 VND** tùy món.\n\nBạn muốn xem chi tiết thực đơn không?";
        }

        return "🤖 **Tôi là trợ lý FoodHub**\n\nHiện tại tôi có thể giúp bạn:\n\n• **Xem thực đơn** - Liệt kê các món ăn\n• **Tìm món** - Tìm kiếm món ăn yêu thích\n• **Gợi ý** - Đề xuất món ngon\n• **Kiểm tra đơn** - Xem trạng thái đơn hàng\n\nBạn cần hỗ trợ gì?";
    }

    @Override
    public List<Product> getRecommendations(Long userId) {
        // 1. Lấy toàn bộ sản phẩm hiện có
// Trong AIServiceImpl.java
        List<AIProductRequest> allProducts = productRepository.findAll().stream()
                .map(p -> AIProductRequest.builder()
                        .id(p.getId())
                        .name(p.getName())
                        // Gộp Description và Ingredients để AI có nhiều dữ liệu so sánh hơn
                        .description(p.getDescription() + " " + (p.getIngredients() != null ? p.getIngredients() : ""))
                        .categoryName(p.getCategory() != null ? p.getCategory().getName() : "Khác")
                        .build())
                .collect(Collectors.toList());

        // 2. Lấy lịch sử xem (Dùng PageRequest do Repository của bạn trả về Page)
        List<AIUserHistoryRequest> history = recentlyViewedRepository
                .findByUserIdOrderByViewedAtDesc(userId, PageRequest.of(0, 20))
                .getContent()
                .stream()
                .map(rv -> new AIUserHistoryRequest(rv.getProduct().getId(), 5))
                .collect(Collectors.toList());

        if (history.isEmpty()) return Collections.emptyList();

        // 3. Đóng gói gửi sang Python
        if (history.isEmpty()) return Collections.emptyList();

        AIRecommendationRequest aiRequest = AIRecommendationRequest.builder()
                .history_prefs(history)
                .all_products(allProducts)
                .build();

        try {
            // FIX 1: Thêm Header JSON để tránh lỗi 415 Unsupported Media Type
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);
            org.springframework.http.HttpEntity<AIRecommendationRequest> entity = new org.springframework.http.HttpEntity<>(aiRequest, headers);

            System.out.println("SỐ LƯỢNG SẢN PHẨM GỬI ĐI: " + allProducts.size());
            System.out.println("SỐ LƯỢNG LỊCH SỬ GỬI ĐI: " + history.size()); // Sửa historyPrefs -> history

            // FIX 2: Gửi 'entity' thay vì 'aiRequest'
            ResponseEntity<List> response = restTemplate.postForEntity(FLASK_URL, entity, List.class);
            List<?> recommendedIdsRaw = response.getBody();

            if (recommendedIdsRaw == null) return Collections.emptyList();

            List<Long> ids = recommendedIdsRaw.stream()
                    .map(id -> Long.valueOf(id.toString()))
                    .collect(Collectors.toList());

            return productRepository.findAllById(ids);

        } catch (Exception e) {
            System.err.println("AI Service Error: " + e.getMessage());
            e.printStackTrace(); // In chi tiết lỗi ra console
            return Collections.emptyList();
        }
    }
}
