package com.website.backend.repository;

import com.website.backend.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    Page<Product> findByCategoryId(Long categoryId, Pageable pageable);

    Page<Product> findByIsFeaturedTrue(Pageable pageable);

    Page<Product> findByIsNewTrue(Pageable pageable);

    Page<Product> findByNameContainingIgnoreCase(String name, Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.isAvailable = true ORDER BY " +
           "(SELECT COALESCE(SUM(oi.quantity), 0) FROM OrderItem oi WHERE oi.product = p) DESC")
    List<Product> findTopSellingProducts(Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.isAvailable = true ORDER BY " +
           "(SELECT COALESCE(AVG(pr.rating), 0) FROM ProductRating pr WHERE pr.product = p) DESC")
    List<Product> findTopRatedProducts(Pageable pageable);

    @Query("SELECT COALESCE(AVG(pr.rating), 0) FROM ProductRating pr WHERE pr.product.id = :productId")
    Double getAverageRating(@Param("productId") Long productId);

    @Query("SELECT COALESCE(SUM(oi.quantity), 0) FROM OrderItem oi WHERE oi.product.id = :productId")
    Integer getSoldCount(@Param("productId") Long productId);
}
