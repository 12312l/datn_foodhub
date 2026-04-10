package com.website.backend.controller;

import com.website.backend.dto.response.NotificationResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
@Slf4j
public class NotificationWebSocketController {

    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/notification.send")
    public void sendNotification(@Payload NotificationResponse notification) {
        log.info("Sending notification to user: {}", notification.getId());
        messagingTemplate.convertAndSend("/queue/user/" + notification.getId(), notification);
    }
}
