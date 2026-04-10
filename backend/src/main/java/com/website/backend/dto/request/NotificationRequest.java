package com.website.backend.dto.request;

import lombok.Data;

@Data
public class NotificationRequest {
    private Long userId;
    private String title;
    private String content;
    private String type;
}
