package com.website.backend.service;

import com.website.backend.dto.request.ProductRequest;
import com.website.backend.dto.response.ProductResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ProductService {
    Page<ProductResponse> getAllProducts(Pageable pageable);
    Page<ProductResponse> getAllProductsAdmin(Pageable pageable);
    ProductResponse getProductById(Long id);
    Page<ProductResponse> getProductsByCategory(Long categoryId, Pageable pageable);
    Page<ProductResponse> getFeaturedProducts(Pageable pageable);
    Page<ProductResponse> getNewProducts(Pageable pageable);
    Page<ProductResponse> searchProducts(String keyword, Pageable pageable);
    List<ProductResponse> getTopSellingProducts(int limit);
    List<ProductResponse> getTopRatedProducts(int limit);
    List<ProductResponse> getRecommendedProducts(Long userId);
    ProductResponse createProduct(ProductRequest request);
    ProductResponse updateProduct(Long id, ProductRequest request);
    void deleteProduct(Long id);
    String uploadFile(org.springframework.web.multipart.MultipartFile file, String type);

    //Recently Viewed
    Page<ProductResponse> getRecentlyViewed(Long userId, Pageable pageable);
    void saveToRecentlyViewed(Long userId, Long productId);
}
