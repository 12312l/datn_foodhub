package com.website.backend.repository;

import com.website.backend.entity.ProductMedia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductMediaRepository extends JpaRepository<ProductMedia, Long> {
    List<ProductMedia> findByProductIdOrderByDisplayOrderAsc(Long productId);
    List<ProductMedia> findByProductIdAndIsPrimaryTrue(Long productId);

    @Modifying
    void deleteByProductId(Long productId);
}
