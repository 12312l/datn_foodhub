package com.website.backend.service.impl;

import com.website.backend.dto.response.CartItemResponse;
import com.website.backend.entity.CartItem;
import com.website.backend.entity.Product;
import com.website.backend.entity.ProductMedia;
import com.website.backend.entity.ProductVariant;
import com.website.backend.entity.User;
import com.website.backend.exception.CustomException;
import com.website.backend.repository.CartItemRepository;
import com.website.backend.repository.ProductMediaRepository;
import com.website.backend.repository.ProductRepository;
import com.website.backend.repository.ProductVariantRepository;
import com.website.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Stream;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CartServiceImpl implements com.website.backend.service.CartService {

    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final ProductMediaRepository productMediaRepository;
    private final ProductVariantRepository productVariantRepository;
    private final UserRepository userRepository;

    @Override
    public List<CartItemResponse> getCartItems(Long userId) {
        return cartItemRepository.findByUserId(userId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public CartItemResponse addToCart(Long userId, Long productId, Long variantId, int quantity) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> CustomException.notFound("Người dùng không tìm thấy"));

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> CustomException.notFound("Sản phẩm không tìm thấy"));

        if (!product.getIsAvailable()) {
            throw CustomException.badRequest("Sản phẩm không còn hàng");
        }

        ProductVariant variant = null;
        if (variantId != null) {
            variant = productVariantRepository.findById(variantId)
                    .orElseThrow(() -> CustomException.notFound("Biến thể sản phẩm không tìm thấy"));
            if (!variant.getProduct().getId().equals(productId)) {
                throw CustomException.badRequest("Biến thể không thuộc sản phẩm đã chọn");
            }
        }

        CartItem cartItem = variant != null
                ? cartItemRepository.findByUserIdAndProductIdAndVariantId(userId, productId, variant.getId()).orElse(null)
                : cartItemRepository.findByUserIdAndProductIdWithoutVariant(userId, productId).orElse(null);

        if (cartItem != null) {
            cartItem.setQuantity(cartItem.getQuantity() + quantity);
        } else {
            cartItem = CartItem.builder()
                    .user(user)
                    .product(product)
                    .variant(variant)
                    .quantity(quantity)
                    .build();
        }

        return mapToResponse(cartItemRepository.save(cartItem));
    }

    @Override
    @Transactional
    public CartItemResponse updateCartItem(Long userId, Long cartItemId, int quantity) {
        CartItem cartItem = cartItemRepository.findByIdAndUserId(cartItemId, userId)
                .orElseThrow(() -> CustomException.notFound("Sản phẩm không có trong giỏ hàng"));

        if (quantity <= 0) {
            cartItemRepository.delete(cartItem);
            return null;
        }

        cartItem.setQuantity(quantity);
        return mapToResponse(cartItemRepository.save(cartItem));
    }

    @Override
    @Transactional
    public void removeFromCart(Long userId, Long cartItemId) {
        CartItem cartItem = cartItemRepository.findByIdAndUserId(cartItemId, userId)
                .orElseThrow(() -> CustomException.notFound("Sản phẩm không có trong giỏ hàng"));
        cartItemRepository.delete(cartItem);
    }

    @Override
    @Transactional
    public void clearCart(Long userId) {
        cartItemRepository.deleteByUserId(userId);
    }

    @Override
    public Double getCartTotal(Long userId) {
        return cartItemRepository.getCartTotalByUserId(userId);
    }

    private CartItemResponse mapToResponse(CartItem cartItem) {
        Product product = cartItem.getProduct();
        ProductVariant variant = cartItem.getVariant();
        String imageUrl = getProductImageUrl(product.getId());
        BigDecimal salePrice = variant != null ? variant.getSalePrice() : product.getPrice();
        BigDecimal originalPrice = variant != null ? variant.getOriginalPrice() : product.getPrice();

        String variantAttributes = variant == null || variant.getAttributes() == null
            ? null
            : variant.getAttributes().stream()
            .flatMap(attr -> Stream.of(attr.getAttributeName() + ": " + attr.getAttributeValue()))
            .collect(Collectors.joining(", "));

        return CartItemResponse.builder()
                .id(cartItem.getId())
                .productId(product.getId())
            .variantId(variant != null ? variant.getId() : null)
            .variantName(variant != null ? variant.getName() : null)
            .variantAttributes(variantAttributes)
            .originalPrice(originalPrice)
                .productName(product.getName())
                .productImage(imageUrl)
            .productPrice(salePrice)
                .quantity(cartItem.getQuantity())
            .subtotal(salePrice.multiply(BigDecimal.valueOf(cartItem.getQuantity())))
                .build();
    }

    private String getProductImageUrl(Long productId) {
        List<ProductMedia> mediaList = productMediaRepository.findByProductIdAndIsPrimaryTrue(productId);
        if (!mediaList.isEmpty()) {
            return mediaList.get(0).getMediaUrl();
        }
        mediaList = productMediaRepository.findByProductIdOrderByDisplayOrderAsc(productId);
        if (!mediaList.isEmpty()) {
            return mediaList.get(0).getMediaUrl();
        }
        return null;
    }
}
