package com.website.backend.controller;

import com.website.backend.entity.SupportTicket;
import com.website.backend.entity.SupportMessage;
import com.website.backend.entity.User;
import com.website.backend.repository.SupportTicketRepository;
import com.website.backend.repository.SupportMessageRepository;
import com.website.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/support")
@RequiredArgsConstructor
public class SupportController {

    private final SupportTicketRepository ticketRepository;
    private final SupportMessageRepository messageRepository;
    private final UserRepository userRepository;

    @PostMapping("/tickets")
    public ResponseEntity<Map<String, Object>> createTicket(
            @RequestBody Map<String, String> request,
            @RequestParam(required = false) Long userId) {

        User user = null;
        if (userId != null) {
            user = userRepository.findById(userId).orElse(null);
        }

        SupportTicket ticket = SupportTicket.builder()
                .user(user)
                .email(request.get("email"))
                .fullName(request.get("fullName"))
                .phone(request.get("phone"))
                .subject(request.get("subject"))
                .description(request.get("description"))
                .status(SupportTicket.TicketStatus.OPEN)
                .priority(SupportTicket.TicketPriority.valueOf(
                        request.getOrDefault("priority", "MEDIUM")))
                .build();

        ticket = ticketRepository.save(ticket);

        return ResponseEntity.ok(Map.of(
                "id", ticket.getId(),
                "subject", ticket.getSubject(),
                "status", ticket.getStatus().name()
        ));
    }

    @GetMapping("/tickets")
    public ResponseEntity<Page<Map<String, Object>>> getTickets(
            @RequestParam(required = false) Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        PageRequest pageRequest = PageRequest.of(page, size);
        Page<SupportTicket> tickets;

        if (userId != null) {
            tickets = ticketRepository.findByUserIdOrderByCreatedAtDesc(userId, pageRequest);
        } else {
            tickets = ticketRepository.findAllByOrderByCreatedAtDesc(pageRequest);
        }

        Page<Map<String, Object>> response = tickets.map(ticket -> {
            Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", ticket.getId());
            if (ticket.getUser() != null) {
                map.put("userId", ticket.getUser().getId());
                map.put("userName", ticket.getUser().getFullName());
            }
            map.put("email", ticket.getEmail());
            map.put("fullName", ticket.getFullName());
            map.put("phone", ticket.getPhone());
            map.put("subject", ticket.getSubject());
            map.put("status", ticket.getStatus().name());
            map.put("priority", ticket.getPriority().name());
            map.put("createdAt", ticket.getCreatedAt());
            map.put("updatedAt", ticket.getUpdatedAt());
            return map;
        });

        return ResponseEntity.ok(response);
    }

    @GetMapping("/tickets/{ticketId}")
    public ResponseEntity<Map<String, Object>> getTicket(@PathVariable Long ticketId) {
        SupportTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        Map<String, Object> map = new java.util.HashMap<>();
        map.put("id", ticket.getId());
        if (ticket.getUser() != null) {
            map.put("userId", ticket.getUser().getId());
            map.put("userName", ticket.getUser().getFullName());
            map.put("userEmail", ticket.getUser().getEmail());
        }
        map.put("email", ticket.getEmail());
        map.put("fullName", ticket.getFullName());
        map.put("phone", ticket.getPhone());
        map.put("subject", ticket.getSubject());
        map.put("description", ticket.getDescription());
        map.put("status", ticket.getStatus().name());
        map.put("priority", ticket.getPriority().name());
        map.put("createdAt", ticket.getCreatedAt());
        map.put("updatedAt", ticket.getUpdatedAt());
        return ResponseEntity.ok(map);
    }

    @PostMapping("/tickets/{ticketId}/messages")
    public ResponseEntity<Map<String, Object>> addMessage(
            @PathVariable Long ticketId,
            @RequestBody Map<String, String> request) {

        SupportTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        User sender = userRepository.findById(Long.parseLong(request.get("userId")))
                .orElseThrow(() -> new RuntimeException("User not found"));

        SupportMessage message = SupportMessage.builder()
                .ticket(ticket)
                .user(sender)
                .message(request.get("message"))
                .attachmentUrl(request.get("attachmentUrl"))
                .isFromAdmin(Boolean.parseBoolean(request.getOrDefault("isFromAdmin", "false")))
                .build();

        message = messageRepository.save(message);

        // Update ticket timestamp
        ticket.setUpdatedAt(LocalDateTime.now());
        ticketRepository.save(ticket);

        return ResponseEntity.ok(Map.of(
                "id", message.getId(),
                "message", message.getMessage()
        ));
    }

    @GetMapping("/tickets/{ticketId}/messages")
    public ResponseEntity<Page<Map<String, Object>>> getMessages(
            @PathVariable Long ticketId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {

        PageRequest pageRequest = PageRequest.of(page, size);
        Page<SupportMessage> messages = messageRepository.findByTicketIdOrderByCreatedAtAsc(ticketId, pageRequest);

        Page<Map<String, Object>> response = messages.map(msg -> Map.of(
                "id", msg.getId(),
                "userId", msg.getUser().getId(),
                "userName", msg.getUser().getFullName(),
                "message", msg.getMessage() != null ? msg.getMessage() : "",
                "attachmentUrl", msg.getAttachmentUrl() != null ? msg.getAttachmentUrl() : "",
                "isFromAdmin", msg.getIsFromAdmin(),
                "createdAt", msg.getCreatedAt()
        ));

        return ResponseEntity.ok(response);
    }

    @PutMapping("/tickets/{ticketId}/status")
    public ResponseEntity<Void> updateStatus(
            @PathVariable Long ticketId,
            @RequestBody Map<String, String> request) {

        SupportTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        ticket.setStatus(SupportTicket.TicketStatus.valueOf(request.get("status")));
        ticketRepository.save(ticket);

        return ResponseEntity.ok().build();
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> getStats() {
        long open = ticketRepository.countByStatus(SupportTicket.TicketStatus.OPEN);
        long inProgress = ticketRepository.countByStatus(SupportTicket.TicketStatus.IN_PROGRESS);
        long resolved = ticketRepository.countByStatus(SupportTicket.TicketStatus.RESOLVED);

        return ResponseEntity.ok(Map.of(
                "open", open,
                "inProgress", inProgress,
                "resolved", resolved,
                "total", open + inProgress + resolved
        ));
    }
}
