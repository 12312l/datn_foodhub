package com.website.backend.dto.request;

import lombok.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AIProductRequest {
    private Long id;
    private String name;
    private String description;
    private String categoryName;
}