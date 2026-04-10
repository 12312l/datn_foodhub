package com.website.backend.controller;

import com.website.backend.entity.ChatMessage;
import com.website.backend.repository.ChatMessageRepository;
import com.website.backend.repository.ChatConversationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.time.LocalDateTime;

@Controller
@RequiredArgsConstructor
@Slf4j
public class ChatWebSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final ChatMessageRepository chatMessageRepository;
    private final ChatConversationRepository chatConversationRepository;

    @MessageMapping("/chat.sendMessage")
    @SendTo("/topic/public")
    public ChatMessage sendMessage(@Payload ChatMessage message) {
        log.info("Received message: {}", message.getMessage());
        message.setCreatedAt(LocalDateTime.now());
        chatMessageRepository.save(message);

        // Broadcast to all subscribers
        messagingTemplate.convertAndSend("/topic/chat/" + message.getConversation().getId(), message);

        return message;
    }

    @MessageMapping("/chat.addUser")
    @SendTo("/topic/public")
    public ChatMessage addUser(@Payload ChatMessage message) {
        log.info("User joined: {}", message.getSender().getId());
        return message;
    }
}
