package com.website.backend.repository;

import com.website.backend.entity.RecentlyViewed;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface RecentlyViewedRepository extends JpaRepository<RecentlyViewed, Long> {
    // Lấy danh sách đã xem, món mới xem nhất lên đầu
    Page<RecentlyViewed> findByUserIdOrderByViewedAtDesc(Long userId, Pageable pageable);

    // Tìm xem đã tồn tại bản ghi xem món này chưa
    Optional<RecentlyViewed> findByUserIdAndProductId(Long userId, Long productId);
}