package com.website.backend.controller;

import com.website.backend.entity.SupportTicket;
import com.website.backend.entity.SupportMessage;
import com.website.backend.entity.User;
import com.website.backend.repository.SupportTicketRepository;
import com.website.backend.repository.SupportMessageRepository;
import com.website.backend.repository.UserRepository;
import com.website.backend.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/support")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminSupportController {

    private final SupportTicketRepository ticketRepository;
    private final SupportMessageRepository messageRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    @GetMapping("/tickets")
    public ResponseEntity<Page<Map<String, Object>>> getAllTickets(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        PageRequest pageRequest = PageRequest.of(page, size);
        Page<SupportTicket> tickets = ticketRepository.findAllByOrderByCreatedAtDesc(pageRequest);

        Page<Map<String, Object>> response = tickets.map(ticket -> {
            String userName = ticket.getUser() != null ? ticket.getUser().getFullName() : ticket.getFullName();
            Long userId = ticket.getUser() != null ? ticket.getUser().getId() : null;
            String email = ticket.getUser() != null ? ticket.getUser().getEmail() : ticket.getEmail();

            return Map.of(
                "id", ticket.getId(),
                "userId", userId != null ? userId : "",
                "userName", userName != null ? userName : "",
                "userEmail", email != null ? email : "",
                "subject", ticket.getSubject(),
                "description", ticket.getDescription() != null ? ticket.getDescription() : "",
                "status", ticket.getStatus().name(),
                "priority", ticket.getPriority().name(),
                "createdAt", ticket.getCreatedAt(),
                "updatedAt", ticket.getUpdatedAt()
            );
        });

        return ResponseEntity.ok(response);
    }

    @GetMapping("/tickets/{ticketId}")
    public ResponseEntity<Map<String, Object>> getTicket(@PathVariable Long ticketId) {
        SupportTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        String userName = ticket.getUser() != null ? ticket.getUser().getFullName() : ticket.getFullName();
        String userEmail = ticket.getUser() != null ? ticket.getUser().getEmail() : ticket.getEmail();
        Long userId = ticket.getUser() != null ? ticket.getUser().getId() : null;

        return ResponseEntity.ok(Map.of(
                "id", ticket.getId(),
                "userId", userId != null ? userId : "",
                "userName", userName != null ? userName : "",
                "userEmail", userEmail != null ? userEmail : "",
                "subject", ticket.getSubject(),
                "description", ticket.getDescription() != null ? ticket.getDescription() : "",
                "status", ticket.getStatus().name(),
                "priority", ticket.getPriority().name(),
                "createdAt", ticket.getCreatedAt(),
                "updatedAt", ticket.getUpdatedAt()
        ));
    }

    @PostMapping("/tickets/{ticketId}/messages")
    public ResponseEntity<Map<String, Object>> addMessage(
            @PathVariable Long ticketId,
            @RequestBody Map<String, String> request) {

        SupportTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        // For admin, we need to get admin user
        User sender = userRepository.findById(1L)
                .orElseThrow(() -> new RuntimeException("User not found"));

        SupportMessage message = SupportMessage.builder()
                .ticket(ticket)
                .user(sender)
                .message(request.get("message"))
                .attachmentUrl(request.get("attachmentUrl"))
                .isFromAdmin(true)
                .build();

        message = messageRepository.save(message);

        // Update ticket timestamp
        ticket.setUpdatedAt(LocalDateTime.now());
        ticketRepository.save(ticket);

        // Send email to user
        String userEmail = ticket.getUser() != null ? ticket.getUser().getEmail() : ticket.getEmail();
        if (userEmail != null && !userEmail.isEmpty()) {
            try {
                emailService.sendSupportReplyEmail(userEmail, ticket.getSubject(), request.get("message"));
            } catch (Exception e) {
                // Log but don't fail the request
            }
        }

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
