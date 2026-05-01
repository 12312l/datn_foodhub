package com.website.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ProductVariantResponse {
    private Long id;
    private String name;
    private String sku;
    private BigDecimal originalPrice;
    private BigDecimal salePrice;
    private Integer stock;
    private Boolean isDefault;
    private Integer preparationTime;
    private List<ProductVariantAttributeResponse> attributes;
}
