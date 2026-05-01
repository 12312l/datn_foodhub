package com.website.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalTime;

@Entity
@Table(name = "order_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "variant_id")
    private Long variantId;

    @Column(name = "variant_name", length = 150)
    private String variantName;

    @Column(name = "variant_attributes", columnDefinition = "TEXT")
    private String variantAttributes;

    @Column(name = "original_price", precision = 10, scale = 2)
    private BigDecimal originalPrice;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "unit_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal unitPrice;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal subtotal;

    public void validateOrderTime() {
        LocalTime now = LocalTime.now();
        LocalTime openTime = LocalTime.of(8, 0);  // 8h sáng
        LocalTime closeTime = LocalTime.of(22, 0); // 10h tối

        if (now.isBefore(openTime) || now.isAfter(closeTime)) {
            throw new RuntimeException("Cửa hàng hiện đã đóng cửa. Vui lòng đặt lại vào 8h sáng mai!");
        }
    }
}
