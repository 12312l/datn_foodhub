package com.website.backend.service.impl;

import com.website.backend.dto.request.ProductRequest;
import com.website.backend.dto.request.ProductVariantRequest;
import com.website.backend.dto.response.ProductImageResponse;
import com.website.backend.dto.response.ProductResponse;
import com.website.backend.dto.response.ProductVariantAttributeResponse;
import com.website.backend.dto.response.ProductVariantResponse;
import com.website.backend.dto.response.ReviewResponse;
import com.website.backend.entity.*;
import com.website.backend.exception.CustomException;
import com.website.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements com.website.backend.service.ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ReviewRepository reviewRepository;
    private final ProductMediaRepository productMediaRepository;
    private final ProductVariantRepository productVariantRepository;
    private final CartItemRepository cartItemRepository;

    // ... các repository khác
    private final RecentlyViewedRepository recentlyViewedRepository;
    private final com.website.backend.repository.UserRepository userRepository;

    @Value("${app.upload.path:uploads}")
    private String uploadPath;

    @Value("${app.base-url:http://localhost:9090}")
    private String baseUrl;

    @Override
    public Page<ProductResponse> getAllProducts(Pageable pageable) {
        return productRepository.findAll(pageable).map(this::mapToResponse);
    }

    @Override
    public Page<ProductResponse> getAllProductsAdmin(Pageable pageable) {
        return productRepository.findAll(pageable).map(this::mapToResponseAdmin);
    }

    @Override
    public ProductResponse getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> CustomException.notFound("Sản phẩm không tìm thấy"));
        return mapToResponse(product);
    }

    @Override
    public Page<ProductResponse> getProductsByCategory(Long categoryId, Pageable pageable) {
        return productRepository.findByCategoryId(categoryId, pageable).map(this::mapToResponse);
    }

    @Override
    public Page<ProductResponse> getFeaturedProducts(Pageable pageable) {
        return productRepository.findByIsFeaturedTrue(pageable).map(this::mapToResponse);
    }

    @Override
    public Page<ProductResponse> getNewProducts(Pageable pageable) {
        return productRepository.findByIsNewTrue(pageable).map(this::mapToResponse);
    }

    @Override
    public Page<ProductResponse> searchProducts(String keyword, Pageable pageable) {
        return productRepository.findByNameContainingIgnoreCase(keyword, pageable).map(this::mapToResponse);
    }

    @Override
    public List<ProductResponse> getTopSellingProducts(int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        return productRepository.findTopSellingProducts(pageable).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<ProductResponse> getTopRatedProducts(int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        return productRepository.findTopRatedProducts(pageable).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<ProductResponse> getRecommendedProducts(Long userId) {
        // Simple recommendation: top rated products
        return getTopRatedProducts(10);
    }

    @Override
    @Transactional
    public ProductResponse createProduct(ProductRequest request) {
        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> CustomException.notFound("Danh mục không tìm thấy"));
        }

        PricingSnapshot pricingSnapshot = resolvePricingSnapshot(request);

        Product product = Product.builder()
                .name(request.getName())
                .description(request.getDescription())
            .price(pricingSnapshot.salePrice())
                .discount(request.getDiscount() != null ? request.getDiscount() : 0)
            .stock(pricingSnapshot.stock())
                .category(category)
                .ingredients(request.getIngredients())
                .isAvailable(request.getIsAvailable() != null ? request.getIsAvailable() : true)
                .isFeatured(request.getIsFeatured() != null ? request.getIsFeatured() : false)
                .isNew(request.getIsNew() != null ? request.getIsNew() : false)
                .build();

        product = productRepository.save(product);

        // Save images if provided
        if (request.getImages() != null && !request.getImages().isEmpty()) {
            saveProductImages(product, request.getImages());
        }

        if (request.getVariants() != null && !request.getVariants().isEmpty()) {
            saveProductVariants(product, request.getVariants());
        }

        return mapToResponse(product);
    }

    @Override
    @Transactional
    public ProductResponse updateProduct(Long id, ProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> CustomException.notFound("Sản phẩm không tìm thấy"));

        PricingSnapshot pricingSnapshot = resolvePricingSnapshot(request);

        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setPrice(pricingSnapshot.salePrice());
        product.setDiscount(request.getDiscount() != null ? request.getDiscount() : 0);
        product.setStock(pricingSnapshot.stock());
        product.setIngredients(request.getIngredients());
        product.setIsAvailable(request.getIsAvailable());
        product.setIsFeatured(request.getIsFeatured());
        product.setIsNew(request.getIsNew());

        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> CustomException.notFound("Danh mục không tìm thấy"));
            product.setCategory(category);
        }

        product = productRepository.save(product);

        // Update images if provided
        if (request.getImages() != null && !request.getImages().isEmpty()) {
            // Delete old images
            productMediaRepository.deleteByProductId(product.getId());
            // Save new images
            saveProductImages(product, request.getImages());
        }

        if (request.getVariants() != null) {
            // Existing cart items may still reference old variants by ID.
            // Clear those references before deleting/recreating variants.
            cartItemRepository.clearVariantReferencesByProductId(product.getId());
            productVariantRepository.deleteByProductId(product.getId());
            if (!request.getVariants().isEmpty()) {
                saveProductVariants(product, request.getVariants());
            }
        }

        return mapToResponse(product);
    }

    @Override
    @Transactional
    public void deleteProduct(Long id) {
        if (!productRepository.existsById(id)) {
            throw CustomException.notFound("Sản phẩm không tìm thấy");
        }
        productRepository.deleteById(id);
    }

    private ProductResponse mapToResponse(Product product) {
        List<Review> reviews = reviewRepository.findByProductId(product.getId(), PageRequest.of(0, 5)).getContent();
        Long reviewCount = reviewRepository.countByProductId(product.getId());
        List<ProductVariant> variants = productVariantRepository.findByProductIdOrderBySortOrderAsc(product.getId());

        // Get rating and soldCount from related tables
        Double avgRating = productRepository.getAverageRating(product.getId());
        Integer soldCount = productRepository.getSoldCount(product.getId());

        // Get image from ProductMedia
        String imageUrl = getProductImageUrl(product.getId());

        // Get all images
        List<ProductMedia> mediaList = productMediaRepository.findByProductIdOrderByDisplayOrderAsc(product.getId());
        List<ProductImageResponse> images = mediaList.stream()
                .map(m -> ProductImageResponse.builder()
                        .id(m.getId())
                        .url(m.getMediaUrl())
                        .isPrimary(m.getIsPrimary())
                        .type(m.getMediaType().name())
                        .build())
                .collect(Collectors.toList());

            BigDecimal originalPrice = variants.stream()
                .filter(v -> Boolean.TRUE.equals(v.getIsDefault()))
                .findFirst()
                .or(() -> variants.stream().findFirst())
                .map(ProductVariant::getOriginalPrice)
                .orElse(product.getPrice());

            List<ProductVariantResponse> variantResponses = variants.stream()
                .map(this::mapVariantToResponse)
                .collect(Collectors.toList());

        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .description(product.getDescription())
                .originalPrice(originalPrice)
                .price(product.getPrice())
                .discount(product.getDiscount() != null ? product.getDiscount() : 0)
                .stock(product.getStock() != null ? product.getStock() : 0)
                .imageUrl(imageUrl)
                .categoryId(product.getCategory() != null ? product.getCategory().getId() : null)
                .categoryName(product.getCategory() != null ? product.getCategory().getName() : null)
                .ingredients(product.getIngredients())
                .isAvailable(product.getIsAvailable())
                .isFeatured(product.getIsFeatured())
                .isNew(product.getIsNew())
                .rating(avgRating != null ? java.math.BigDecimal.valueOf(avgRating) : java.math.BigDecimal.ZERO)
                .soldCount(soldCount != null ? soldCount : 0)
                .createdAt(product.getCreatedAt())
                .reviewCount(reviewCount.intValue())
                .reviews(reviews.stream().map(this::mapReviewToResponse).collect(Collectors.toList()))
                .images(images)
                .variants(variantResponses)
                .build();
    }

    private void saveProductVariants(Product product, List<ProductVariantRequest> variants) {
        int order = 0;
        for (ProductVariantRequest variantReq : variants) {
            if (variantReq == null || variantReq.getSalePrice() == null || variantReq.getOriginalPrice() == null) {
                continue;
            }

            ProductVariant variant = ProductVariant.builder()
                    .product(product)
                    .name(variantReq.getName())
                    .sku(variantReq.getSku())
                    .originalPrice(variantReq.getOriginalPrice())
                    .salePrice(variantReq.getSalePrice())
                    .stock(variantReq.getStock() != null ? variantReq.getStock() : 0)
                    .isDefault(variantReq.getIsDefault() != null ? variantReq.getIsDefault() : false)
                    .sortOrder(order++)
                    .build();

            ProductVariant savedVariant = productVariantRepository.save(variant);

            if (variantReq.getAttributes() != null && !variantReq.getAttributes().isEmpty()) {
                List<ProductVariantAttribute> attrs = variantReq.getAttributes().stream()
                        .filter(attr -> attr != null
                                && attr.getName() != null && !attr.getName().trim().isEmpty()
                                && attr.getValue() != null && !attr.getValue().trim().isEmpty())
                        .map(attr -> ProductVariantAttribute.builder()
                                .variant(savedVariant)
                                .attributeName(attr.getName().trim())
                                .attributeValue(attr.getValue().trim())
                                .build())
                        .collect(Collectors.toList());
                savedVariant.setAttributes(attrs);
                productVariantRepository.save(savedVariant);
            }
        }
    }

    private void saveProductImages(Product product, List<com.website.backend.dto.request.ProductImageRequest> images) {
        if (images == null || images.isEmpty()) {
            return;
        }

        int order = 0;
        for (com.website.backend.dto.request.ProductImageRequest imgReq : images) {
            ProductMedia media = ProductMedia.builder()
                    .product(product)
                    .mediaUrl(imgReq.getUrl())
                    .mediaType(imgReq.getType() != null && "VIDEO".equals(imgReq.getType()) ?
                            ProductMedia.MediaType.VIDEO : ProductMedia.MediaType.IMAGE)
                    .isPrimary(imgReq.getIsPrimary() != null ? imgReq.getIsPrimary() : false)
                    .displayOrder(order++)
                    .build();
            productMediaRepository.save(media);
        }
    }

    private String getProductImageUrl(Long productId) {
        List<ProductMedia> primaryMedia = productMediaRepository.findByProductIdAndIsPrimaryTrue(productId);
        if (!primaryMedia.isEmpty()) {
            return primaryMedia.get(0).getMediaUrl();
        }
        List<ProductMedia> allMedia = productMediaRepository.findByProductIdOrderByDisplayOrderAsc(productId);
        if (!allMedia.isEmpty()) {
            return allMedia.get(0).getMediaUrl();
        }
        return null;
    }

    @Override
    public String uploadFile(MultipartFile file, String type) {
        try {
            Path uploadDir = Paths.get(uploadPath);
            if (!Files.exists(uploadDir)) {
                Files.createDirectories(uploadDir);
            }

            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }

            String filename = UUID.randomUUID().toString() + extension;
            Path filePath = uploadDir.resolve(filename);
            Files.copy(file.getInputStream(), filePath);

            // Return relative URL - proxy will handle it
            return "/uploads/" + filename;
        } catch (IOException e) {
            throw new RuntimeException("Failed to upload file: " + e.getMessage());
        }
    }

    private ProductResponse mapToResponseAdmin(Product product) {
        List<ProductVariant> variants = productVariantRepository.findByProductIdOrderBySortOrderAsc(product.getId());

        BigDecimal originalPrice = variants.stream()
            .filter(v -> Boolean.TRUE.equals(v.getIsDefault()))
            .findFirst()
            .or(() -> variants.stream().findFirst())
            .map(ProductVariant::getOriginalPrice)
            .orElse(product.getPrice());

        // Get image from ProductMedia
        String imageUrl = getProductImageUrl(product.getId());

        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .description(product.getDescription())
            .originalPrice(originalPrice)
                .price(product.getPrice())
                .discount(product.getDiscount() != null ? product.getDiscount() : 0)
                .stock(product.getStock() != null ? product.getStock() : 0)
                .imageUrl(imageUrl)
                .categoryId(product.getCategory() != null ? product.getCategory().getId() : null)
                .categoryName(product.getCategory() != null ? product.getCategory().getName() : null)
                .ingredients(product.getIngredients())
                .isAvailable(product.getIsAvailable())
                .isFeatured(product.getIsFeatured())
                .isNew(product.getIsNew())
                .rating(java.math.BigDecimal.ZERO)
                .soldCount(0)
                .createdAt(product.getCreatedAt())
                .reviewCount(0)
                .variants(variants.stream().map(this::mapVariantToResponse).collect(Collectors.toList()))
                .build();
    }

    private ProductVariantResponse mapVariantToResponse(ProductVariant variant) {
        return ProductVariantResponse.builder()
                .id(variant.getId())
                .name(variant.getName())
                .sku(variant.getSku())
                .originalPrice(variant.getOriginalPrice())
                .salePrice(variant.getSalePrice())
                .stock(variant.getStock())
                .isDefault(variant.getIsDefault())
                .attributes(variant.getAttributes() == null ? List.of() : variant.getAttributes().stream()
                        .map(attr -> ProductVariantAttributeResponse.builder()
                                .name(attr.getAttributeName())
                                .value(attr.getAttributeValue())
                                .build())
                        .collect(Collectors.toList()))
                .build();
    }

    private PricingSnapshot resolvePricingSnapshot(ProductRequest request) {
        List<ProductVariantRequest> variants = request.getVariants() == null
                ? List.of()
                : request.getVariants().stream().filter(Objects::nonNull).collect(Collectors.toList());

        if (!variants.isEmpty()) {
            ProductVariantRequest defaultVariant = variants.stream()
                    .filter(v -> Boolean.TRUE.equals(v.getIsDefault()))
                    .findFirst()
                    .orElse(variants.get(0));

            if (defaultVariant.getSalePrice() == null || defaultVariant.getSalePrice().compareTo(BigDecimal.ZERO) <= 0) {
                throw CustomException.badRequest("Giá bán của biến thể mặc định phải lớn hơn 0");
            }

            if (defaultVariant.getOriginalPrice() == null || defaultVariant.getOriginalPrice().compareTo(BigDecimal.ZERO) <= 0) {
                throw CustomException.badRequest("Giá gốc của biến thể mặc định phải lớn hơn 0");
            }

            int totalStock = variants.stream().map(v -> v.getStock() == null ? 0 : Math.max(v.getStock(), 0)).reduce(0, Integer::sum);
            return new PricingSnapshot(defaultVariant.getSalePrice(), totalStock);
        }

        if (request.getPrice() == null || request.getPrice().compareTo(BigDecimal.ZERO) <= 0) {
            throw CustomException.badRequest("Giá sản phẩm phải lớn hơn 0");
        }

        return new PricingSnapshot(request.getPrice(), request.getStock() != null ? request.getStock() : 0);
    }

    private record PricingSnapshot(BigDecimal salePrice, Integer stock) {}

    private ReviewResponse mapReviewToResponse(Review review) {
        return ReviewResponse.builder()
                .id(review.getId())
                .productId(review.getProduct().getId())
                .userId(review.getUser().getId())
                .userName(review.getUser().getFullName())
                .rating(review.getRating())
                .comment(review.getComment())
                .createdAt(review.getCreatedAt())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProductResponse> getRecentlyViewed(Long userId, Pageable pageable) {
        return recentlyViewedRepository.findByUserIdOrderByViewedAtDesc(userId, pageable)
                .map(history -> mapToResponse(history.getProduct()));
    }

    @Override
    @Transactional
    public void saveToRecentlyViewed(Long userId, Long productId) {
        RecentlyViewed history = recentlyViewedRepository
                .findByUserIdAndProductId(userId, productId)
                .orElseGet(() -> RecentlyViewed.builder()
                        .user(userRepository.getReferenceById(userId))
                        .product(productRepository.getReferenceById(productId))
                        .build());

        history.setViewedAt(java.time.LocalDateTime.now());
        recentlyViewedRepository.save(history);
    }
}
