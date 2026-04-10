package com.website.backend.controller;

import com.website.backend.dto.request.LoginRequest;
import com.website.backend.dto.request.RegisterRequest;
import com.website.backend.dto.response.AuthResponse;
import com.website.backend.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request.getEmail(), request.getPassword()));
    }

    @PostMapping("/send-verification")
    public ResponseEntity<Map<String, String>> sendVerification(@RequestBody Map<String, String> request) {
        authService.sendVerificationCode(request.get("email"));
        return ResponseEntity.ok(Map.of("message", "Mã xác thực đã được gửi"));
    }

    @PostMapping("/verify")
    public ResponseEntity<Map<String, String>> verify(@RequestBody Map<String, String> request) {
        boolean verified = authService.verifyCode(request.get("email"), request.get("code"));
        if (verified) {
            return ResponseEntity.ok(Map.of("message", "Xác thực thành công"));
        }
        return ResponseEntity.badRequest().body(Map.of("message", "Xác thực thất bại"));
    }
}
