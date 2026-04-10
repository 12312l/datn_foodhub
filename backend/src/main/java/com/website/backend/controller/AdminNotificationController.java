package com.website.backend.controller;

import com.website.backend.dto.request.NotificationRequest;
import com.website.backend.dto.response.NotificationResponse;
import com.website.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/notifications")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminNotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getAllNotifications(
            @RequestParam(required = false) Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size
    ) {
        return ResponseEntity.ok(notificationService.getAllNotifications(userId, page, size));
    }

    @PostMapping
    public ResponseEntity<Void> sendNotification(@RequestBody NotificationRequest request) {
        notificationService.sendNotificationToUser(request.getUserId(), request.getTitle(), request.getContent(), request.getType());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/broadcast")
    public ResponseEntity<Void> broadcastNotification(@RequestBody NotificationRequest request) {
        notificationService.broadcastNotification(request.getTitle(), request.getContent(), request.getType());
        return ResponseEntity.ok().build();
    }
}
