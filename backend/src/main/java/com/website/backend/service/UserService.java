package com.website.backend.service;

import com.website.backend.dto.request.ChangePasswordRequest;
import com.website.backend.dto.request.CreateUserRequest;
import com.website.backend.dto.request.UpdateUserRequest;
import com.website.backend.dto.response.UserResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface UserService {
    UserResponse getUserById(Long id);
    UserResponse getUserByEmail(String email);
    UserResponse updateProfile(Long id, UpdateUserRequest request);
    UserResponse updateUser(Long id, UpdateUserRequest request); // Admin update with role
    void changePassword(Long id, ChangePasswordRequest request);
    String uploadAvatar(Long userId, MultipartFile file);
    List<UserResponse> getAllUsers();
    UserResponse createUser(CreateUserRequest request);
    void deactivateUser(Long id);
    void activateUser(Long id);
    void deleteUser(Long id);
}
