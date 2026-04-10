package com.website.backend.repository;

import com.website.backend.entity.Coupon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface CouponRepository extends JpaRepository<Coupon, Long> {
    Optional<Coupon> findByCode(String code);

    boolean existsByCode(String code);

    Optional<Coupon> findByCodeAndIsActiveTrueAndExpiryDateAfter(String code, LocalDate date);
}
