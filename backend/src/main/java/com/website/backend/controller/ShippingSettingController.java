package com.website.backend.controller;

import com.website.backend.dto.response.ShippingSettingResponse;
import com.website.backend.service.ShippingSettingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/shipping-settings")
@RequiredArgsConstructor
public class ShippingSettingController {

    private final ShippingSettingService shippingSettingService;

    @GetMapping
    public ResponseEntity<ShippingSettingResponse> getCurrent() {
        return ResponseEntity.ok(shippingSettingService.getCurrent());
    }
}
