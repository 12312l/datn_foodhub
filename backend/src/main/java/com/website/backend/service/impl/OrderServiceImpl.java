package com.website.backend.service.impl;

import com.website.backend.dto.request.OrderRequest;
import com.website.backend.dto.response.OrderItemResponse;
import com.website.backend.dto.response.OrderResponse;
import com.website.backend.entity.*;
import com.website.backend.exception.CustomException;
import com.website.backend.repository.*;
import com.website.backend.service.EmailService;
import com.website.backend.service.NotificationService;
import com.website.backend.service.ShippingSettingService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TimeZone;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements com.website.backend.service.OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final CartItemRepository cartItemRepository;
    private final CouponRepository couponRepository;
    private final CouponUsageRepository couponUsageRepository;
    private final UserRepository userRepository;
    private final ProductMediaRepository productMediaRepository;
    private final EmailService emailService;
    private final NotificationService notificationService;
    private final ShippingSettingService shippingSettingService;

    @Value("${vnpay.tmncode}")
    private String vnpayTmnCode;

    @Value("${vnpay.hashsecret}")
    private String vnpayHashSecret;

    @Value("${vnpay.url}")
    private String vnpayUrl;

    @Value("${vnpay.returnurl}")
    private String vnpayReturnUrl;

    @Override
    @Transactional
    public OrderResponse createOrder(Long userId, OrderRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> CustomException.notFound("User not found"));

        List<CartItem> cartItems = cartItemRepository.findByUserId(userId);
        if (cartItems.isEmpty()) {
            throw CustomException.badRequest("Giỏ hàng trống");
        }

        // Calculate total
        BigDecimal subtotal = cartItems.stream()
            .map(item -> getItemUnitPrice(item).multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Apply coupon
        BigDecimal discountAmount = BigDecimal.ZERO;
        Coupon coupon = null;
        if (request.getCouponCode() != null && !request.getCouponCode().isEmpty()) {
            coupon = couponRepository.findByCodeAndIsActiveTrueAndExpiryDateAfter(
                    request.getCouponCode(),
                    java.time.LocalDate.now()
            ).orElseThrow(() -> CustomException.badRequest("Mã giảm giá không hợp lệ hoặc đã hết hạn"));

            if (coupon.getStartDate() != null && java.time.LocalDate.now().isBefore(coupon.getStartDate())) {
                throw CustomException.badRequest("Mã giảm giá chưa đến ngày áp dụng");
            }

            if (subtotal.compareTo(coupon.getMinOrderAmount()) < 0) {
                throw CustomException.badRequest("Đơn hàng chưa đạt giá trị tối thiểu để áp dụng mã giảm giá");
            }

            if (coupon.getUsageLimit() != null && coupon.getUsageLimit() > 0) {
                long usedCount = couponUsageRepository.countByCouponId(coupon.getId());
                if (usedCount >= coupon.getUsageLimit()) {
                    throw CustomException.badRequest("Mã giảm giá đã hết lượt sử dụng");
                }
            }

            BigDecimal discountBase = subtotal;
            if (coupon.getApplicableProducts() != null && !coupon.getApplicableProducts().isEmpty()) {
                Set<Long> applicableProductIds = coupon.getApplicableProducts().stream()
                        .map(Product::getId)
                        .collect(Collectors.toSet());

                discountBase = cartItems.stream()
                        .filter(item -> applicableProductIds.contains(item.getProduct().getId()))
                        .map(item -> getItemUnitPrice(item).multiply(BigDecimal.valueOf(item.getQuantity())))
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                if (discountBase.compareTo(BigDecimal.ZERO) <= 0) {
                    throw CustomException.badRequest("Mã giảm giá không áp dụng cho sản phẩm trong giỏ hàng");
                }
            }

            if (discountBase.compareTo(coupon.getMinOrderAmount()) < 0) {
                throw CustomException.badRequest("Đơn hàng chưa đạt giá trị tối thiểu để áp dụng mã giảm giá");
            }

            discountAmount = discountBase.multiply(BigDecimal.valueOf(coupon.getDiscountPercent()))
                    .divide(BigDecimal.valueOf(100));
            if (coupon.getMaxDiscount() != null && discountAmount.compareTo(coupon.getMaxDiscount()) > 0) {
                discountAmount = coupon.getMaxDiscount();
            }
        }

        BigDecimal shippingFee = shippingSettingService.calculateShippingFee(subtotal);
        BigDecimal totalAmount = subtotal.add(shippingFee).subtract(discountAmount);

        Order order = Order.builder()
                .user(user)
                .totalAmount(totalAmount)
                .shippingFee(shippingFee)
                .shippingAddress(request.getShippingAddress())
                .shippingPhone(request.getShippingPhone())
                .recipientName(request.getRecipientName() != null ? request.getRecipientName() : user.getFullName())
                .paymentMethod(Order.PaymentMethod.valueOf(request.getPaymentMethod()))
                .paymentStatus(Order.PaymentStatus.PENDING)
                .orderStatus(Order.OrderStatus.PENDING)
                .couponCode(request.getCouponCode())
                .discountAmount(discountAmount)
                .build();

        order = orderRepository.save(order);

        // Create order items
        for (CartItem cartItem : cartItems) {
            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .product(cartItem.getProduct())
                    .variantId(cartItem.getVariant() != null ? cartItem.getVariant().getId() : null)
                    .variantName(cartItem.getVariant() != null ? cartItem.getVariant().getName() : null)
                    .variantAttributes(getVariantAttributesText(cartItem.getVariant()))
                    .originalPrice(cartItem.getVariant() != null ? cartItem.getVariant().getOriginalPrice() : cartItem.getProduct().getPrice())
                    .quantity(cartItem.getQuantity())
                    .unitPrice(getItemUnitPrice(cartItem))
                    .subtotal(getItemUnitPrice(cartItem).multiply(BigDecimal.valueOf(cartItem.getQuantity())))
                    .build();
            orderItemRepository.save(orderItem);
        }

        if (coupon != null && discountAmount.compareTo(BigDecimal.ZERO) > 0) {
            CouponUsage couponUsage = CouponUsage.builder()
                    .coupon(coupon)
                    .order(order)
                    .user(user)
                    .discountAmount(discountAmount)
                    .build();
            couponUsageRepository.save(couponUsage);
        }

        // Clear cart
        cartItemRepository.deleteByUserId(userId);

        // Send confirmation email
        try {
            String orderDetails = buildOrderDetails(order, cartItems);
            emailService.sendOrderConfirmation(user.getEmail(), order.getId(), orderDetails);
        } catch (Exception e) {
            // Log error but don't fail the order
        }

        // Create notification
        try {
            notificationService.createNotification(
                    userId,
                    "Đơn hàng mới",
                    "Đơn hàng #" + order.getId() + " đã được đặt thành công",
                    "ORDER"
            );
        } catch (Exception e) {
            // Log error but don't fail the order
        }

        return mapToResponse(order);
    }

    private String buildOrderDetails(Order order, List<CartItem> cartItems) {
        StringBuilder sb = new StringBuilder();
        sb.append("Mã đơn hàng: #").append(order.getId()).append("\n");
        sb.append("Tổng tiền: ").append(order.getTotalAmount()).append(" VND\n");
        sb.append("Địa chỉ giao hàng: ").append(order.getShippingAddress()).append("\n");
        sb.append("Sản phẩm:\n");
        for (CartItem item : cartItems) {
                        BigDecimal unitPrice = getItemUnitPrice(item);
            sb.append("- ").append(item.getProduct().getName())
                            .append(item.getVariant() != null ? " (" + item.getVariant().getName() + ")" : "")
              .append(" x").append(item.getQuantity())
                            .append(": ").append(unitPrice.multiply(BigDecimal.valueOf(item.getQuantity())))
              .append(" VND\n");
        }
        return sb.toString();
    }

    @Override
    public OrderResponse getOrderById(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> CustomException.notFound("Đơn hàng không tìm thấy"));
        return mapToResponse(order);
    }

    @Override
    public List<OrderResponse> getUserOrders(Long userId) {
        return orderRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public Page<OrderResponse> getAllOrders(Pageable pageable) {
        return orderRepository.findAllOrders(pageable).map(this::mapToResponse);
    }

    @Override
    @Transactional
    public OrderResponse updateOrderStatus(Long orderId, String status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> CustomException.notFound("Đơn hàng không tìm thấy"));

        Order.OrderStatus nextStatus = Order.OrderStatus.valueOf(status.toUpperCase());
        order.setOrderStatus(nextStatus);

        // Auto-complete payment when order has been delivered.
        if (nextStatus == Order.OrderStatus.DELIVERED) {
            order.setPaymentStatus(Order.PaymentStatus.PAID);
        }

        return mapToResponse(orderRepository.save(order));
    }

    @Override
    @Transactional
    public OrderResponse updateOrder(Long orderId, OrderRequest request) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> CustomException.notFound("�ơn hàng không tìm thấy"));

        order.setShippingAddress(request.getShippingAddress());
        order.setShippingPhone(request.getShippingPhone());
        if (request.getRecipientName() != null) {
            order.setRecipientName(request.getRecipientName());
        }

        return mapToResponse(orderRepository.save(order));
    }

    @Override
    @Transactional
    public void deleteOrder(Long orderId) {
        if (!orderRepository.existsById(orderId)) {
            throw CustomException.notFound("Đơn hàng không tìm thấy");
        }
        orderRepository.deleteById(orderId);
    }

    @Override
    @Transactional
    public OrderResponse cancelOrder(Long orderId, Long userId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> CustomException.notFound("Đơn hàng không tìm thấy"));

        if (!order.getUser().getId().equals(userId)) {
            throw CustomException.unauthorized("Bạn không có quyền hủy đơn hàng này");
        }

        if (order.getOrderStatus() == Order.OrderStatus.DELIVERED || order.getOrderStatus() == Order.OrderStatus.CANCELLED) {
            throw CustomException.badRequest("Không thể hủy đơn hàng đã giao hoặc đã hủy");
        }

        order.setOrderStatus(Order.OrderStatus.CANCELLED);
        return mapToResponse(orderRepository.save(order));
    }

    @Override
    public String createVNPayUrl(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> CustomException.notFound("Đơn hàng không tìm thấy"));

        if (order.getPaymentMethod() != Order.PaymentMethod.VNPAY) {
            throw CustomException.badRequest("Đơn hàng không sử dụng phương thức VNPay");
        }

        long amount = order.getTotalAmount()
                .multiply(BigDecimal.valueOf(100))
                .longValue();

        // VNPay expects Vietnam local time (GMT+7).
        TimeZone tz = TimeZone.getTimeZone("Asia/Ho_Chi_Minh");
        SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
        formatter.setTimeZone(tz);
        Date createDate = new Date();

        java.util.Calendar calendar = java.util.Calendar.getInstance(tz);
        calendar.setTime(createDate);
        calendar.add(java.util.Calendar.MINUTE, 30);
        Date expireDate = calendar.getTime();

        String txnRef = String.valueOf(order.getId()) + System.currentTimeMillis();
        if (txnRef.length() > 34) {
            txnRef = txnRef.substring(0, 34);
        }

        Map<String, String> params = new HashMap<>();
        params.put("vnp_Version", "2.1.0");
        params.put("vnp_Command", "pay");
        params.put("vnp_TmnCode", vnpayTmnCode);
        params.put("vnp_Amount", String.valueOf(amount));
        params.put("vnp_CurrCode", "VND");
        params.put("vnp_TxnRef", txnRef);
        params.put("vnp_OrderInfo", "Thanh toan don hang #" + order.getId());
        params.put("vnp_OrderType", "other");
        params.put("vnp_Locale", "vn");
        params.put("vnp_ReturnUrl", vnpayReturnUrl);
        params.put("vnp_IpAddr", "127.0.0.1");
        params.put("vnp_CreateDate", formatter.format(createDate));
        params.put("vnp_ExpireDate", formatter.format(expireDate));

        List<Map.Entry<String, String>> sortedParams = new ArrayList<>(params.entrySet());
        sortedParams.sort(Comparator.comparing(Map.Entry::getKey));

        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();

        for (int i = 0; i < sortedParams.size(); i++) {
            Map.Entry<String, String> entry = sortedParams.get(i);
            String encodedKey = URLEncoder.encode(entry.getKey(), StandardCharsets.US_ASCII);
            String encodedValue = URLEncoder.encode(entry.getValue(), StandardCharsets.US_ASCII);

            hashData.append(encodedKey).append('=').append(encodedValue);
            query.append(encodedKey).append('=').append(encodedValue);

            if (i < sortedParams.size() - 1) {
                hashData.append('&');
                query.append('&');
            }
        }

        String secureHash = hmacSha512(vnpayHashSecret, hashData.toString());
        query.append("&vnp_SecureHash=").append(secureHash);

        return vnpayUrl + "?" + query;
    }

    private String hmacSha512(String key, String data) {
        try {
            Mac hmac512 = Mac.getInstance("HmacSHA512");
            SecretKeySpec secretKeySpec = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512");
            hmac512.init(secretKeySpec);
            byte[] bytes = hmac512.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder hash = new StringBuilder();
            for (byte aByte : bytes) {
                hash.append(String.format("%02x", aByte));
            }
            return hash.toString();
        } catch (Exception ex) {
            throw CustomException.internalServerError("Không thể tạo chữ ký VNPay");
        }
    }

    private OrderResponse mapToResponse(Order order) {
        List<OrderItem> orderItems = orderItemRepository.findByOrderId(order.getId());

        return OrderResponse.builder()
                .id(order.getId())
                .userId(order.getUser().getId())
                .userName(order.getUser().getFullName())
                .userEmail(order.getUser().getEmail())
                .recipientName(order.getRecipientName())
                .totalAmount(order.getTotalAmount())
                .shippingFee(order.getShippingFee())
                .shippingAddress(order.getShippingAddress())
                .shippingPhone(order.getShippingPhone())
                .paymentMethod(order.getPaymentMethod().name())
                .paymentStatus(order.getPaymentStatus().name())
                .status(order.getOrderStatus().name())
                .couponCode(order.getCouponCode())
                .discountAmount(order.getDiscountAmount())
                .createdAt(order.getCreatedAt())
                .items(orderItems.stream().map(this::mapItemToResponse).collect(Collectors.toList()))
                .build();
    }

    private OrderItemResponse mapItemToResponse(OrderItem item) {
        Product product = item.getProduct();
        String imageUrl = getProductImageUrl(product.getId());

        return OrderItemResponse.builder()
                .id(item.getId())
                .productId(product.getId())
                .variantId(item.getVariantId())
                .variantName(item.getVariantName())
                .variantAttributes(item.getVariantAttributes())
                .originalPrice(item.getOriginalPrice())
                .productName(product.getName())
                .productImage(imageUrl)
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .subtotal(item.getSubtotal())
                .build();
    }

    private BigDecimal getItemUnitPrice(CartItem item) {
        if (item.getVariant() != null && item.getVariant().getSalePrice() != null) {
            return item.getVariant().getSalePrice();
        }
        return item.getProduct().getPrice();
    }

    private String getVariantAttributesText(ProductVariant variant) {
        if (variant == null || variant.getAttributes() == null || variant.getAttributes().isEmpty()) {
            return null;
        }

        return variant.getAttributes().stream()
                .map(attr -> attr.getAttributeName() + ": " + attr.getAttributeValue())
                .collect(Collectors.joining(", "));
    }

    private String getProductImageUrl(Long productId) {
        List<ProductMedia> primaryMedia = productMediaRepository.findByProductIdAndIsPrimaryTrue(productId);
        if (!primaryMedia.isEmpty()) {
            return primaryMedia.get(0).getMediaUrl();
        }
        List<ProductMedia> allMedia = productMediaRepository.findByProductIdOrderByDisplayOrderAsc(productId);
        if (!allMedia.isEmpty()) {
            return allMedia.get(0).getMediaUrl();
        }
        return null;
    }
}
