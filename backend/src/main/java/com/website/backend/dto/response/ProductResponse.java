package com.website.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ProductResponse {
    private Long id;
    private String name;
    private String description;
    private BigDecimal originalPrice;
    private BigDecimal price;
    private Integer discount;
    private String imageUrl;
    private Long categoryId;

    private Integer preparationTime;
    private String categoryName;
    private String ingredients;
    private Boolean isAvailable;
    private Boolean isFeatured;
    private Boolean isNew;
    private BigDecimal rating;
    private Integer soldCount;
    private Integer stock;
    private LocalDateTime createdAt;
    private Integer reviewCount;
    private List<ReviewResponse> reviews;
    private List<ProductImageResponse> images;
    private List<ProductVariantResponse> variants;
}
