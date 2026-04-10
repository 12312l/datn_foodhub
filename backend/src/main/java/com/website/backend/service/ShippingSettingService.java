package com.website.backend.service;

import com.website.backend.dto.request.ShippingSettingRequest;
import com.website.backend.dto.response.ShippingSettingResponse;

import java.math.BigDecimal;

public interface ShippingSettingService {
    ShippingSettingResponse getCurrent();

    ShippingSettingResponse update(ShippingSettingRequest request);

    BigDecimal calculateShippingFee(BigDecimal subtotal);
}
