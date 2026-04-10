package com.website.backend.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageRequest {
    private Long senderId;
    private String content;
    private String attachmentUrl;
    private Boolean isFromAdmin;
}
