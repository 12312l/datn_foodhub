package com.website.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConversationResponse {
    private Long id;
    private Long userId;
    private String userName;
    private String userEmail;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
