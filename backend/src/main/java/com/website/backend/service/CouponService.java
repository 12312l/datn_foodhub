package com.website.backend.service;

import com.website.backend.dto.request.CouponRequest;
import com.website.backend.dto.response.CouponResponse;

import java.util.List;

public interface CouponService {
    List<CouponResponse> getAllCoupons();
    CouponResponse getCouponById(Long id);
    CouponResponse createCoupon(CouponRequest request);
    CouponResponse updateCoupon(Long id, CouponRequest request);
    void deleteCoupon(Long id);
    CouponResponse validateCoupon(String code, Double orderAmount, List<Long> productIds);
}
