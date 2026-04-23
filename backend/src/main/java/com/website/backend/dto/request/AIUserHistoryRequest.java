package com.website.backend.dto.request;

import lombok.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AIUserHistoryRequest {
    private Long id;   // Đây là product_id
    private int score; // Trọng số sở thích (ví dụ: món đã xem cho 5 điểm)
}