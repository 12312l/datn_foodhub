package com.website.backend.service;

public interface EmailService {
    void sendVerificationEmail(String email, String code);
    void sendOrderConfirmation(String email, Long orderId, String orderDetails);
    void sendOrderStatusUpdate(String email, Long orderId, String status);
    void sendSupportReplyEmail(String email, String subject, String replyMessage);
}
