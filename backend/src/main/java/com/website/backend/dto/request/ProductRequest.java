package com.website.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class ProductRequest {
    @NotBlank(message = "Tên sản phẩm không được để trống")
    private String name;

    private String description;

    private BigDecimal price;

    private Integer discount = 0;

    private String imageUrl;

    private Long categoryId;

    private Integer stock = 0;

    private String ingredients;

    private Boolean isAvailable = true;

    private Boolean isFeatured = false;

    private Boolean isNew = false;

    private List<ProductImageRequest> images;

    private List<ProductVariantRequest> variants;
}
