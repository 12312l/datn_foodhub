package com.website.backend.dto.request;

import lombok.Data;

@Data
public class ProductImageRequest {
    private String url;
    private Boolean isPrimary = false;
    private String type = "IMAGE"; // IMAGE or VIDEO
}
