package com.website.backend.dto.request;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class ProductVariantRequest {
    private String name;
    private String sku;
    private BigDecimal originalPrice;
    private BigDecimal salePrice;
    private Integer stock = 0;
    private Boolean isDefault = false;
    private List<ProductVariantAttributeRequest> attributes;
}
