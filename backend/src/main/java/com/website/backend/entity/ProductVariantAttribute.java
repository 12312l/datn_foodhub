package com.website.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "product_variant_attributes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductVariantAttribute {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variant_id", nullable = false)
    private ProductVariant variant;

    @Column(name = "attribute_name", nullable = false, length = 100)
    private String attributeName;

    @Column(name = "attribute_value", nullable = false, length = 255)
    private String attributeValue;
}
