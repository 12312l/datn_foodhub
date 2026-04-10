package com.website.backend.repository;

import com.website.backend.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    List<CartItem> findByUserId(Long userId);

    Optional<CartItem> findByUserIdAndProductIdAndVariantId(Long userId, Long productId, Long variantId);

    @Query("SELECT c FROM CartItem c WHERE c.user.id = :userId AND c.product.id = :productId AND c.variant IS NULL")
    Optional<CartItem> findByUserIdAndProductIdWithoutVariant(@Param("userId") Long userId, @Param("productId") Long productId);

    Optional<CartItem> findByIdAndUserId(Long cartItemId, Long userId);

    @Query("SELECT COALESCE(SUM(c.quantity * COALESCE(v.salePrice, p.price)), 0) " +
            "FROM CartItem c LEFT JOIN c.variant v JOIN c.product p WHERE c.user.id = :userId")
    Double getCartTotalByUserId(@Param("userId") Long userId);

    @Modifying
    @Query("UPDATE CartItem c SET c.variant = NULL WHERE c.product.id = :productId")
    void clearVariantReferencesByProductId(@Param("productId") Long productId);

    void deleteByUserId(Long userId);
}
