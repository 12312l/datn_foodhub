package com.website.backend.service.impl;

import com.website.backend.dto.request.RegisterRequest;
import com.website.backend.dto.response.AuthResponse;
import com.website.backend.entity.User;
import com.website.backend.exception.CustomException;
import com.website.backend.repository.UserRepository;
import com.website.backend.security.JwtService;
import com.website.backend.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements com.website.backend.service.AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final EmailService emailService;

    private final SecureRandom random = new SecureRandom();

    @Override
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw CustomException.badRequest("Email đã được sử dụng");
        }

        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw CustomException.badRequest("Mật khẩu không khớp");
        }

        if (request.getPassword().length() < 6) {
            throw CustomException.badRequest("Mật khẩu phải có ít nhất 6 ký tự");
        }

        // Generate verification code
        String verificationCode = String.format("%06d", random.nextInt(1000000));

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(User.Role.USER)
                .isActive(true)
                .isEmailVerified(false)
                .verificationCode(verificationCode)
                .verificationExpiresAt(LocalDateTime.now().plusMinutes(5))
                .build();

        userRepository.save(user);

        // Send verification email
        try {
            emailService.sendVerificationEmail(user.getEmail(), verificationCode);
        } catch (Exception e) {
            // Log error but don't block registration
        }

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String token = jwtService.generateToken(userDetails);

        return AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .userId(user.getId())
                .build();
    }

    @Override
    public AuthResponse login(String email, String password) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, password)
        );

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> CustomException.notFound("Người dùng không tìm thấy"));

        if (!user.getIsActive()) {
            throw CustomException.unauthorized("Tài khoản đã bị vô hiệu hóa");
        }

        UserDetails userDetails = userDetailsService.loadUserByUsername(email);
        String token = jwtService.generateToken(userDetails);

        return AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .userId(user.getId())
                .build();
    }

    @Override
    public void sendVerificationCode(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> CustomException.notFound("Email không tồn tại"));

        String verificationCode = String.format("%06d", random.nextInt(1000000));

        user.setVerificationCode(verificationCode);
        user.setVerificationExpiresAt(LocalDateTime.now().plusMinutes(5));
        userRepository.save(user);

        emailService.sendVerificationEmail(email, verificationCode);
    }

    @Override
    public boolean verifyCode(String email, String code) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> CustomException.notFound("Email không tồn tại"));

        if (user.getVerificationCode() == null || !user.getVerificationCode().equals(code)) {
            throw CustomException.badRequest("Mã xác thực không đúng");
        }

        if (user.getVerificationExpiresAt() == null || user.getVerificationExpiresAt().isBefore(LocalDateTime.now())) {
            throw CustomException.badRequest("Mã xác thực đã hết hạn");
        }

        user.setIsEmailVerified(true);
        user.setVerificationCode(null);
        user.setVerificationExpiresAt(null);
        userRepository.save(user);

        return true;
    }
}
