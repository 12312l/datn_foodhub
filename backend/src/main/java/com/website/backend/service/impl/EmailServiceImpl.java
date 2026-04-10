package com.website.backend.service.impl;

import com.website.backend.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@foodhub.com}")
    private String fromEmail;

    @Override
    @Async
    public void sendVerificationEmail(String email, String code) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(email);
            message.setSubject("Xác thực email - FoodHub");
            message.setText(
                "Xin chào,\n\n" +
                "Mã xác thực email của bạn là: " + code + "\n\n" +
                "Mã này sẽ hết hạn sau 5 phút.\n\n" +
                "Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.\n\n" +
                "Trân trọng,\n" +
                "FoodHub Team"
            );
            mailSender.send(message);
            log.info("Verification email sent to: {}", email);
        } catch (Exception e) {
            log.error("Failed to send verification email to: {}", email, e);
        }
    }

    @Override
    @Async
    public void sendOrderConfirmation(String email, Long orderId, String orderDetails) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(email);
            message.setSubject("Xác nhận đơn hàng #" + orderId + " - FoodHub");
            message.setText(
                "Xin chào,\n\n" +
                "Đơn hàng #" + orderId + " của bạn đã được đặt thành công!\n\n" +
                "Chi tiết đơn hàng:\n" + orderDetails + "\n\n" +
                "Chúng tôi sẽ thông báo cho bạn khi đơn hàng được xác nhận và giao hàng.\n\n" +
                "Trân trọng,\n" +
                "FoodHub Team"
            );
            mailSender.send(message);
            log.info("Order confirmation email sent to: {}", email);
        } catch (Exception e) {
            log.error("Failed to send order confirmation email to: {}", email, e);
        }
    }

    @Override
    @Async
    public void sendOrderStatusUpdate(String email, Long orderId, String status) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(email);
            message.setSubject("Cập nhật trạng thái đơn hàng #" + orderId + " - FoodHub");
            message.setText(
                "Xin chào,\n\n" +
                "Đơn hàng #" + orderId + " của bạn đã được cập nhật:\n\n" +
                "Trạng thái: " + status + "\n\n" +
                "Cảm ơn bạn đã sử dụng dịch vụ của FoodHub!\n\n" +
                "Trân trọng,\n" +
                "FoodHub Team"
            );
            mailSender.send(message);
            log.info("Order status update email sent to: {}", email);
        } catch (Exception e) {
            log.error("Failed to send order status update email to: {}", email, e);
        }
    }

    @Override
    public void sendSupportReplyEmail(String email, String subject, String replyMessage) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(email);
            message.setSubject("Phản hồi yêu cầu hỗ trợ: " + subject + " - FoodHub");
            message.setText(
                "Xin chào,\n\n" +
                "Chúng tôi đã phản hồi yêu cầu hỗ trợ của bạn với tiêu đề: " + subject + "\n\n" +
                "Nội dung phản hồi:\n" + replyMessage + "\n\n" +
                "Nếu bạn cần thêm hỗ trợ, vui lòng liên hệ lại với chúng tôi.\n\n" +
                "Cảm ơn bạn đã sử dụng dịch vụ của FoodHub!\n\n" +
                "Trân trọng,\n" +
                "FoodHub Team"
            );
            mailSender.send(message);
            log.info("Support reply email sent to: {}", email);
        } catch (Exception e) {
            log.error("Failed to send support reply email to: {}", email, e);
        }
    }
}
