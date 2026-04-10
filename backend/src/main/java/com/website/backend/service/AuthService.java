package com.website.backend.service;

import com.website.backend.dto.request.RegisterRequest;
import com.website.backend.dto.response.AuthResponse;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(String email, String password);
    void sendVerificationCode(String email);
    boolean verifyCode(String email, String code);
}
