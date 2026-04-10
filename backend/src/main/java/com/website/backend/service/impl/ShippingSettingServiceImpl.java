package com.website.backend.service.impl;

import com.website.backend.dto.request.ShippingSettingRequest;
import com.website.backend.dto.response.ShippingSettingResponse;
import com.website.backend.entity.ShippingSetting;
import com.website.backend.repository.ShippingSettingRepository;
import com.website.backend.service.ShippingSettingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class ShippingSettingServiceImpl implements ShippingSettingService {

    private static final BigDecimal DEFAULT_BASE_FEE = BigDecimal.valueOf(15000);
    private static final BigDecimal DEFAULT_FREE_SHIPPING_THRESHOLD = BigDecimal.valueOf(100000);

    private final ShippingSettingRepository shippingSettingRepository;

    @Override
    public ShippingSettingResponse getCurrent() {
        return mapToResponse(getOrCreateDefault());
    }

    @Override
    @Transactional
    public ShippingSettingResponse update(ShippingSettingRequest request) {
        ShippingSetting setting = getOrCreateDefault();
        setting.setBaseFee(request.getBaseFee());
        setting.setFreeShippingThreshold(request.getFreeShippingThreshold());
        setting.setFreeShippingEnabled(request.getFreeShippingEnabled());
        return mapToResponse(shippingSettingRepository.save(setting));
    }

    @Override
    public BigDecimal calculateShippingFee(BigDecimal subtotal) {
        ShippingSetting setting = getOrCreateDefault();
        if (Boolean.TRUE.equals(setting.getFreeShippingEnabled())
                && setting.getFreeShippingThreshold() != null
                && subtotal.compareTo(setting.getFreeShippingThreshold()) >= 0) {
            return BigDecimal.ZERO;
        }
        return setting.getBaseFee();
    }

    private ShippingSetting getOrCreateDefault() {
        return shippingSettingRepository.findAll().stream().findFirst()
                .orElseGet(() -> shippingSettingRepository.save(ShippingSetting.builder()
                        .baseFee(DEFAULT_BASE_FEE)
                        .freeShippingThreshold(DEFAULT_FREE_SHIPPING_THRESHOLD)
                        .freeShippingEnabled(true)
                        .build()));
    }

    private ShippingSettingResponse mapToResponse(ShippingSetting setting) {
        return ShippingSettingResponse.builder()
                .id(setting.getId())
                .baseFee(setting.getBaseFee())
                .freeShippingThreshold(setting.getFreeShippingThreshold())
                .freeShippingEnabled(setting.getFreeShippingEnabled())
                .build();
    }
}
