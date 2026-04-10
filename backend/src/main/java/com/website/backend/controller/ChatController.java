package com.website.backend.controller;

import com.website.backend.dto.request.MessageRequest;
import com.website.backend.dto.response.ConversationResponse;
import com.website.backend.dto.response.MessageResponse;
import com.website.backend.dto.response.PagedResponse;
import com.website.backend.entity.ChatConversation;
import com.website.backend.entity.ChatMessage;
import com.website.backend.entity.User;
import com.website.backend.repository.ChatConversationRepository;
import com.website.backend.repository.ChatMessageRepository;
import com.website.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatConversationRepository conversationRepository;
    private final ChatMessageRepository messageRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @PostMapping("/start")
    public ResponseEntity<ConversationResponse> startConversation(@RequestParam Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        ChatConversation conversation = ChatConversation.builder()
                .user(user)
                .status(ChatConversation.ConversationStatus.ACTIVE)
                .build();

        conversation = conversationRepository.save(conversation);

        ConversationResponse response = ConversationResponse.builder()
                .id(conversation.getId())
                .userId(user.getId())
                .userName(user.getFullName())
                .userEmail(user.getEmail())
                .status(conversation.getStatus().name())
                .createdAt(conversation.getCreatedAt())
                .updatedAt(conversation.getUpdatedAt())
                .build();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/conversations")
    public ResponseEntity<PagedResponse<ConversationResponse>> getConversations(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long userId) {

        PageRequest pageRequest = PageRequest.of(page, size);
        Page<ChatConversation> conversations;

        if (userId != null) {
            // Get conversations for a specific user
            if (status != null) {
                conversations = conversationRepository.findByUserIdAndStatus(userId,
                        ChatConversation.ConversationStatus.valueOf(status), pageRequest);
            } else {
                conversations = conversationRepository.findByUserId(userId, pageRequest);
            }
        } else if (status != null) {
            conversations = conversationRepository.findByStatusOrderByUpdatedAtDesc(
                    ChatConversation.ConversationStatus.valueOf(status), pageRequest);
        } else {
            conversations = conversationRepository.findAll(pageRequest);
        }

        Page<ConversationResponse> response = conversations.map(conv -> ConversationResponse.builder()
                .id(conv.getId())
                .userId(conv.getUser().getId())
                .userName(conv.getUser().getFullName())
                .userEmail(conv.getUser().getEmail())
                .status(conv.getStatus().name())
                .createdAt(conv.getCreatedAt())
                .updatedAt(conv.getUpdatedAt())
                .build());

        return ResponseEntity.ok(PagedResponse.from(response));
    }

    @GetMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<PagedResponse<MessageResponse>> getMessages(
            @PathVariable Long conversationId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {

        PageRequest pageRequest = PageRequest.of(page, size);
        Page<ChatMessage> messages = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId, pageRequest);

        Page<MessageResponse> response = messages.map(msg -> MessageResponse.builder()
                .id(msg.getId())
                .senderId(msg.getSender().getId())
                .senderName(msg.getSender().getFullName())
                .content(msg.getMessage() != null ? msg.getMessage() : "")
                .attachmentUrl(msg.getAttachmentUrl() != null ? msg.getAttachmentUrl() : "")
                .isFromAdmin(msg.getIsFromAdmin())
                .createdAt(msg.getCreatedAt())
                .build());

        return ResponseEntity.ok(PagedResponse.from(response));
    }

    @PostMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<MessageResponse> sendMessage(
            @PathVariable Long conversationId,
            @RequestBody MessageRequest request) {

        ChatConversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));

        User sender = userRepository.findById(request.getSenderId())
                .orElseThrow(() -> new RuntimeException("Sender not found"));

        ChatMessage message = ChatMessage.builder()
                .conversation(conversation)
                .sender(sender)
                .message(request.getContent())
                .attachmentUrl(request.getAttachmentUrl())
                .isFromAdmin(request.getIsFromAdmin() != null ? request.getIsFromAdmin() : false)
                .build();

        message = messageRepository.save(message);

        // Update conversation timestamp
        conversation.setUpdatedAt(LocalDateTime.now());
        conversationRepository.save(conversation);

        // Broadcast via WebSocket
        messagingTemplate.convertAndSend("/topic/chat/" + conversationId, message);

        MessageResponse response = MessageResponse.builder()
                .id(message.getId())
                .senderId(sender.getId())
                .senderName(sender.getFullName())
                .content(message.getMessage())
                .attachmentUrl(message.getAttachmentUrl())
                .isFromAdmin(message.getIsFromAdmin())
                .createdAt(message.getCreatedAt())
                .build();

        return ResponseEntity.ok(response);
    }

    @PutMapping("/conversations/{conversationId}/close")
    public ResponseEntity<Void> closeConversation(@PathVariable Long conversationId) {
        ChatConversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));

        conversation.setStatus(ChatConversation.ConversationStatus.CLOSED);
        conversationRepository.save(conversation);

        return ResponseEntity.ok().build();
    }
}
