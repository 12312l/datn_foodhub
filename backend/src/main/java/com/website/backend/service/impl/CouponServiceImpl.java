package com.website.backend.service.impl;

import com.website.backend.dto.request.CouponRequest;
import com.website.backend.dto.response.CouponProductResponse;
import com.website.backend.dto.response.CouponResponse;
import com.website.backend.entity.Coupon;
import com.website.backend.entity.Product;
import com.website.backend.exception.CustomException;
import com.website.backend.repository.CouponRepository;
import com.website.backend.repository.CouponUsageRepository;
import com.website.backend.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CouponServiceImpl implements com.website.backend.service.CouponService {

    private final CouponRepository couponRepository;
    private final CouponUsageRepository couponUsageRepository;
    private final ProductRepository productRepository;

    @Override
    public List<CouponResponse> getAllCoupons() {
        return couponRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public CouponResponse getCouponById(Long id) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> CustomException.notFound("Mã giảm giá không tìm thấy"));
        return mapToResponse(coupon);
    }

    @Override
    @Transactional
    public CouponResponse createCoupon(CouponRequest request) {
        if (couponRepository.existsByCode(request.getCode())) {
            throw CustomException.badRequest("Mã giảm giá đã tồn tại");
        }

        Coupon coupon = Coupon.builder()
                .code(request.getCode())
                .discountPercent(request.getDiscountPercent())
                .minOrderAmount(request.getMinOrderAmount() != null ? request.getMinOrderAmount() : BigDecimal.ZERO)
                .maxDiscount(request.getMaxDiscount())
                .startDate(request.getStartDate())
                .expiryDate(request.getExpiryDate())
                .usageLimit(request.getUsageLimit())
                .isActive(true)
                .build();

            coupon.setApplicableProducts(resolveApplicableProducts(request.getProductIds()));

        return mapToResponse(couponRepository.save(coupon));
    }

    @Override
    @Transactional
    public CouponResponse updateCoupon(Long id, CouponRequest request) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> CustomException.notFound("Mã giảm giá không tìm thấy"));

        coupon.setCode(request.getCode());
        coupon.setDiscountPercent(request.getDiscountPercent());
        coupon.setMinOrderAmount(request.getMinOrderAmount() != null ? request.getMinOrderAmount() : BigDecimal.ZERO);
        coupon.setMaxDiscount(request.getMaxDiscount());
        coupon.setStartDate(request.getStartDate());
        coupon.setExpiryDate(request.getExpiryDate());
        coupon.setUsageLimit(request.getUsageLimit());
        coupon.setApplicableProducts(resolveApplicableProducts(request.getProductIds()));

        return mapToResponse(couponRepository.save(coupon));
    }

    @Override
    @Transactional
    public void deleteCoupon(Long id) {
        if (!couponRepository.existsById(id)) {
            throw CustomException.notFound("Mã giảm giá không tìm thấy");
        }
        couponRepository.deleteById(id);
    }

    @Override
    public CouponResponse validateCoupon(String code, Double orderAmount, List<Long> productIds) {
        Coupon coupon = couponRepository.findByCodeAndIsActiveTrueAndExpiryDateAfter(
                code,
                java.time.LocalDate.now()
        ).orElse(null);

        if (coupon == null) {
            throw CustomException.notFound("Mã giảm giá không hợp lệ");
        }

        if (orderAmount < coupon.getMinOrderAmount().doubleValue()) {
            throw CustomException.badRequest("Đơn hàng chưa đạt giá trị tối thiểu");
        }

        if (isCouponProductRestricted(coupon) && !isCouponApplicableForProducts(coupon, productIds)) {
            throw CustomException.badRequest("Mã giảm giá không áp dụng cho sản phẩm trong giỏ hàng");
        }

        return mapToResponse(coupon);
    }

    private CouponResponse mapToResponse(Coupon coupon) {
        long usageCount = couponUsageRepository.countByCouponId(coupon.getId());
        List<CouponProductResponse> applicableProducts = coupon.getApplicableProducts().stream()
                .map(product -> CouponProductResponse.builder()
                        .id(product.getId())
                        .name(product.getName())
                        .build())
                .collect(Collectors.toList());

        return CouponResponse.builder()
                .id(coupon.getId())
                .code(coupon.getCode())
                .discountPercent(coupon.getDiscountPercent())
                .minOrderAmount(coupon.getMinOrderAmount())
                .maxDiscount(coupon.getMaxDiscount())
                .startDate(coupon.getStartDate())
                .expiryDate(coupon.getExpiryDate())
                .isActive(coupon.getIsActive())
                .usageLimit(coupon.getUsageLimit())
                .usageCount(usageCount)
                .productIds(applicableProducts.stream().map(CouponProductResponse::getId).collect(Collectors.toList()))
                .applicableProducts(applicableProducts)
                .build();
    }

    private Set<Product> resolveApplicableProducts(List<Long> productIds) {
        if (productIds == null || productIds.isEmpty()) {
            return new HashSet<>();
        }

        List<Product> products = productRepository.findAllById(productIds);
        if (products.size() != new HashSet<>(productIds).size()) {
            throw CustomException.badRequest("Một số sản phẩm áp dụng không tồn tại");
        }

        return new HashSet<>(products);
    }

    private boolean isCouponProductRestricted(Coupon coupon) {
        return coupon.getApplicableProducts() != null && !coupon.getApplicableProducts().isEmpty();
    }

    private boolean isCouponApplicableForProducts(Coupon coupon, List<Long> productIds) {
        if (!isCouponProductRestricted(coupon)) {
            return true;
        }
        if (productIds == null || productIds.isEmpty()) {
            return false;
        }

        Set<Long> couponProductIds = coupon.getApplicableProducts().stream()
                .map(Product::getId)
                .collect(Collectors.toSet());

        return productIds.stream().anyMatch(couponProductIds::contains);
    }
}
