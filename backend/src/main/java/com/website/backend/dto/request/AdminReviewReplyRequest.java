package com.website.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AdminReviewReplyRequest {
    @NotBlank(message = "Nội dung phản hồi không được để trống")
    private String reply;
}
