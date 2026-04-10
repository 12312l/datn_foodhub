package com.website.backend.service.impl;

import com.website.backend.dto.response.NotificationResponse;
import com.website.backend.entity.Notification;
import com.website.backend.entity.User;
import com.website.backend.exception.CustomException;
import com.website.backend.repository.NotificationRepository;
import com.website.backend.repository.UserRepository;
import com.website.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Override
    public List<NotificationResponse> getUserNotifications(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> CustomException.notFound("Người dùng không tìm thấy"));

        return notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId(), PageRequest.of(0, 50))
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public Long getUnreadCount(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> CustomException.notFound("Người dùng không tìm thấy"));
        return notificationRepository.countByUserIdAndIsReadFalse(user.getId());
    }

    @Override
    @Transactional
    public void markAsRead(String email, Long notificationId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> CustomException.notFound("Người dùng không tìm thấy"));

        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> CustomException.notFound("Thông báo không tìm thấy"));

        if (!notification.getUser().getId().equals(user.getId())) {
            throw CustomException.unauthorized("Bạn không có quyền truy cập thông báo này");
        }

        notification.setIsRead(true);
        notificationRepository.save(notification);
    }

    @Override
    @Transactional
    public void markAllAsRead(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> CustomException.notFound("Người dùng không tìm thấy"));

        List<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(
                user.getId(), PageRequest.of(0, Integer.MAX_VALUE)).getContent();

        notifications.forEach(n -> n.setIsRead(true));
        notificationRepository.saveAll(notifications);
    }

    @Override
    @Transactional
    public void deleteNotification(String email, Long notificationId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> CustomException.notFound("Người dùng không tìm thấy"));

        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> CustomException.notFound("Thông báo không tìm thấy"));

        if (!notification.getUser().getId().equals(user.getId())) {
            throw CustomException.unauthorized("Bạn không có quyền xóa thông báo này");
        }

        notificationRepository.delete(notification);
    }

    @Override
    @Transactional
    public void createNotification(Long userId, String title, String content, String type) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> CustomException.notFound("Người dùng không tìm thấy"));

        Notification notification = Notification.builder()
                .user(user)
                .title(title)
                .content(content)
                .type(Notification.NotificationType.valueOf(type))
                .isRead(false)
                .build();

        notificationRepository.save(notification);
    }

    @Override
    public List<NotificationResponse> getAllNotifications(Long userId, int page, int size) {
        if (userId != null) {
            return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, org.springframework.data.domain.PageRequest.of(page, size))
                    .stream()
                    .map(this::mapToResponse)
                    .collect(Collectors.toList());
        }
        return notificationRepository.findAll(org.springframework.data.domain.PageRequest.of(page, size))
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void sendNotificationToUser(Long userId, String title, String content, String type) {
        createNotification(userId, title, content, type);
    }

    @Override
    @Transactional
    public void broadcastNotification(String title, String content, String type) {
        List<User> users = userRepository.findAll();
        for (User user : users) {
            Notification notification = Notification.builder()
                    .user(user)
                    .title(title)
                    .content(content)
                    .type(Notification.NotificationType.valueOf(type))
                    .isRead(false)
                    .build();
            notificationRepository.save(notification);
        }
    }

    private NotificationResponse mapToResponse(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .userId(notification.getUser().getId())
                .userName(notification.getUser().getFullName())
                .userEmail(notification.getUser().getEmail())
                .title(notification.getTitle())
                .content(notification.getContent())
                .type(notification.getType().name())
                .isRead(notification.getIsRead())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
