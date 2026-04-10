package com.website.backend.service;

import com.website.backend.dto.response.NotificationResponse;

import java.util.List;

public interface NotificationService {
    List<NotificationResponse> getUserNotifications(String email);
    Long getUnreadCount(String email);
    void markAsRead(String email, Long notificationId);
    void markAllAsRead(String email);
    void deleteNotification(String email, Long notificationId);
    void createNotification(Long userId, String title, String content, String type);
    List<NotificationResponse> getAllNotifications(Long userId, int page, int size);
    void sendNotificationToUser(Long userId, String title, String content, String type);
    void broadcastNotification(String title, String content, String type);
}
