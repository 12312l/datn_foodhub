package com.website.backend.service.impl;

import com.website.backend.dto.request.AIProductRequest;
import com.website.backend.dto.request.AIRecommendationRequest;
import com.website.backend.dto.request.AIUserHistoryRequest;
import com.website.backend.dto.response.ProductResponse;
import com.website.backend.entity.Product;
import com.website.backend.repository.*;
import com.website.backend.service.AIService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AIServiceImpl implements AIService {

    private final ProductRepository productRepository;
    private final RecentlyViewedRepository recentlyViewedRepository;
    private final CategoryRepository categoryRepository;
    private final OrderRepository orderRepository;
    private final FavoriteRepository favoriteRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    private final String FLASK_URL = "http://localhost:5000/predict_foryou";
    private final String FLASK_URL_SIMILAR = "http://localhost:5000/predict_similar";

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    @Value("${gemini.model}")
    private String geminiModel;

    @Value("${groq.api.key}")
    private String groqApiKey;

    @Value("${groq.model}")
    private String groqModel;

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
//        return callGemini(message, menuContext);
        return callAI(message, menuContext);
    }

    private String callAI(String message, String context) {
        try {
            // Thử gọi Gemini trước
            return callGemini(message, context);
        } catch (Exception e) {
            System.err.println("Gemini gặp sự cố, đang chuyển sang Groq dự phòng...");
            try {
                Thread.sleep(500);
                // Nếu Gemini lỗi, chuyển sang Groq
                return callGroq(message, context);
            } catch (Exception ex) {
                System.err.println("Cả Gemini và Groq đều lỗi!");
                // Cuối cùng mới dùng câu trả lời mặc định (Fallback)
                return getFallbackResponse(message, context);
//                throw e;
            }
        }
    }

    private String callGroq(String message, String context) {
        try {
            if (groqApiKey == null || groqApiKey.isEmpty()) {
                throw new RuntimeException("Chưa cấu hình Groq API Key");
            }

            String url = "https://api.groq.com/openai/v1/chat/completions";

            String prompt = String.format(
                    "Bạn là trợ lý AI của FoodHub. Hãy trả lời thân thiện dựa trên thực đơn này:\n%s\n\nCâu hỏi: %s",
                    context, message
            );

            // --- SỬA TẠI ĐÂY: Dùng List.of thay vì Object[] để tạo JSON Array chuẩn ---
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", groqModel);
            requestBody.put("messages", List.of(
                    Map.of("role", "user", "content", prompt)
            ));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(groqApiKey);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            // Gửi request
            ResponseEntity<Map> responseEntity = restTemplate.postForEntity(url, entity, Map.class);
            Map<String, Object> response = responseEntity.getBody();

            if (response != null && response.containsKey("choices")) {
                List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
                if (!choices.isEmpty()) {
                    Map<String, Object> firstChoice = choices.get(0);
                    Map<String, Object> messageObj = (Map<String, Object>) firstChoice.get("message");
                    return (String) messageObj.get("content");
                }
            }

            throw new RuntimeException("Cấu trúc phản hồi từ Groq không hợp lệ");

        } catch (Exception e) {
            // In lỗi chi tiết của Groq ra console để debug
            log.error("Chi tiết lỗi Groq: {}", e.getMessage());
            throw new RuntimeException("Lỗi khi gọi Groq: " + e.getMessage());
        }
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
                // Lấy thời gian chuẩn bị từ variant (ví dụ lấy cái nhanh nhất)
                Integer minPrepTime = p.getVariants().stream()
                        .map(v -> v.getPreparationTime())
                        .filter(t -> t != null)
                        .min(Integer::compare).orElse(15); // mặc định 15p nếu ko có dữ liệu
                context.append("• ").append(p.getName())
                        .append(" - ").append(p.getPrice()).append(" VND\n")
                        .append(" - Thời gian chuẩn bị: ").append(minPrepTime).append(" phút\n");
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
            // Nếu response rỗng hoặc không đúng cấu trúc, ném một lỗi để callAI biết
            throw new RuntimeException("Gemini response không hợp lệ");

//            return getFallbackResponse(message, context);
        } catch (Exception e) {
            // SỬA TẠI ĐÂY:
//            e.printStackTrace(); // Dòng này sẽ in chi tiết lỗi ra màn hình Console của IntelliJ/Eclipse
//
//            // Fallback to simple response
//            return getFallbackResponse(message, context);
            log.error("Lỗi Gemini: {}", e.getMessage());
            // QUAN TRỌNG: Ném lỗi ra ngoài để callAI bắt được và chuyển sang Groq
            throw e;
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
    public List<ProductResponse> getRecommendations(Long userId) {
        // 1. Lấy toàn bộ sản phẩm hiện có
        List<AIProductRequest> allProducts = productRepository.findAll().stream()
                .map(p -> AIProductRequest.builder()
                        .id(p.getId())
                        .name(p.getName())
                        .description(p.getDescription() + " " + (p.getIngredients() != null ? p.getIngredients() : ""))
                        .categoryName(p.getCategory() != null ? p.getCategory().getName() : "Khác")
                        .build())
                .collect(Collectors.toList());

        // 2. Gộp 3 nguồn dữ liệu: Mua, Thích, Xem vào một danh sách history duy nhất
        List<AIUserHistoryRequest> history = new ArrayList<>();

        // --- Mua hàng (Trọng số 5) ---
        orderRepository.findByUserId(userId, PageRequest.of(0, 100)).getContent().forEach(order ->
                order.getOrderItems().forEach(item ->
                        history.add(new AIUserHistoryRequest(item.getProduct().getId(), 5.0))));

        // --- Yêu thích (Trọng số 3) ---
        favoriteRepository.findByUserId(userId).forEach(fav ->
                history.add(new AIUserHistoryRequest(fav.getProduct().getId(), 3.0)));

        // --- Đã xem (Trọng số 1) ---
        recentlyViewedRepository.findByUserIdOrderByViewedAtDesc(userId, PageRequest.of(0, 20))
                .getContent()
                .forEach(rv -> history.add(new AIUserHistoryRequest(rv.getProduct().getId(), 1.0)));

        if (history.isEmpty()) {
            System.out.println("User " + userId + " chưa có hành vi nào để gợi ý.");
            return Collections.emptyList();
        }

        // 3. Đóng gói gửi sang Python
        AIRecommendationRequest aiRequest = AIRecommendationRequest.builder()
                .history_prefs(history)
                .all_products(allProducts)
                .build();

        List<Long> ids;
        try {
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);
            org.springframework.http.HttpEntity<AIRecommendationRequest> entity = new org.springframework.http.HttpEntity<>(aiRequest, headers);

            System.out.println(">>> Đang gọi AI cho User: " + userId);
            System.out.println(">>> Tổng số tương tác (Mua/Thích/Xem): " + history.size());

            ResponseEntity<List> response = restTemplate.postForEntity(FLASK_URL, entity, List.class);
            List<?> recommendedIdsRaw = response.getBody();

            if (recommendedIdsRaw == null) return Collections.emptyList();

            ids = recommendedIdsRaw.stream()
                    .map(id -> Long.valueOf(id.toString()))
                    .collect(Collectors.toList());

            // --- ĐOẠN SỬA QUAN TRỌNG NHẤT Ở ĐÂY ---
            List<Product> products = productRepository.findAllById(ids);


        } catch (Exception e) {
            System.err.println("!!! AI Service Error: " + e.getMessage());
            e.printStackTrace(); // In ra lỗi chi tiết nếu có
            return Collections.emptyList();
        }

        List<Product> products = productRepository.findAllById(ids);

        return products.stream().map(p -> {
            // 1. Lấy ảnh đầu tiên từ danh sách media của Duy
            String firstImageUrl = (p.getMedia() != null && !p.getMedia().isEmpty())
                    ? p.getMedia().get(0).getMediaUrl()
                    : null;

            // 2. Map sang DTO ProductResponse (Sẽ không bao giờ bị lặp JSON)
            return ProductResponse.builder()
                    .id(p.getId())
                    .name(p.getName())
                    .description(p.getDescription())
                    .price(p.getPrice()) // Giá sau giảm hoặc giá gốc tùy logic của Duy
                    .originalPrice(p.getPrice())
                    .discount(p.getDiscount())
                    .imageUrl(firstImageUrl) // TRỌNG TÂM: Ảnh sản phẩm hiện ở đây
                    .categoryId(p.getCategory() != null ? p.getCategory().getId() : null)
                    .categoryName(p.getCategory() != null ? p.getCategory().getName() : null)
                    .ingredients(p.getIngredients())
                    .isAvailable(p.getIsAvailable())
                    .isFeatured(p.getIsFeatured())
                    .isNew(p.getIsNew())
                    .stock(p.getStock())
                    // Các trường như rating/soldCount nếu chưa có logic tính thì để mặc định
                    .rating(java.math.BigDecimal.valueOf(0))
                    .soldCount(0)
                    .createdAt(p.getCreatedAt())
                    .build();
        }).collect(Collectors.toList());
    }

    @Override
    public List<ProductResponse> getSimilarProducts(Long productId) {
        // 1. Lấy tất cả sản phẩm để AI so sánh nội dung (TF-IDF)
        List<AIProductRequest> allProducts = getAllProductsForAI();

        // 2. Chuẩn bị dữ liệu gửi sang Flask
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("current_product_id", productId);
        requestBody.put("all_products", allProducts);

        try {
            // 3. Gọi API Python (Duy nhớ dùng đúng URL mới)
            List<?> recommendedIdsRaw = restTemplate.postForObject(FLASK_URL_SIMILAR, requestBody, List.class);

            if (recommendedIdsRaw == null || recommendedIdsRaw.isEmpty()) return new ArrayList<>();

            List<Long> ids = recommendedIdsRaw.stream()
                    .map(id -> Long.valueOf(id.toString()))
                    .collect(Collectors.toList());

            // 4. Lấy chi tiết từ DB
            List<Product> similarProducts = productRepository.findAllById(ids);

            // 5. Trả về danh sách DTO
            return similarProducts.stream()
                    .map(this::mapToProductResponse)
                    .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("!!! AI Similar Products Error: {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    private List<AIProductRequest> getAllProductsForAI() {
        return productRepository.findAll().stream()
                .map(p -> AIProductRequest.builder()
                        .id(p.getId())
                        .name(p.getName())
                        .description(p.getDescription() + " " + (p.getIngredients() != null ? p.getIngredients() : ""))
                        .categoryName(p.getCategory() != null ? p.getCategory().getName() : "Khác")
                        .build())
                .collect(Collectors.toList());
    }

    private ProductResponse mapToProductResponse(Product p) {
        String firstImageUrl = (p.getMedia() != null && !p.getMedia().isEmpty())
                ? p.getMedia().get(0).getMediaUrl() : null;

        return ProductResponse.builder()
                .id(p.getId())
                .name(p.getName())
                .description(p.getDescription())
                .price(p.getPrice())
                .imageUrl(firstImageUrl)
                .categoryName(p.getCategory() != null ? p.getCategory().getName() : null)
                .isAvailable(p.getIsAvailable())
                .build();
    }
}
