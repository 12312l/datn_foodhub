package com.website.backend.controller;

import com.website.backend.service.MapService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/test-map")
public class TestMapController {

    @Autowired
    private MapService mapService;

    @GetMapping("/distance")
    public ResponseEntity<?> testDistance(@RequestParam String address) {
        try {
            double km = mapService.getDistance(address);
            return ResponseEntity.ok("Khoảng cách từ cửa hàng đến [" + address + "] là: " + km + " km");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Lỗi: " + e.getMessage());
        }
    }
}