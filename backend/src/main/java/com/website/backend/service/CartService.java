package com.website.backend.service;

import com.website.backend.dto.response.CartItemResponse;

import java.util.List;

public interface CartService {
    List<CartItemResponse> getCartItems(Long userId);
    CartItemResponse addToCart(Long userId, Long productId, Long variantId, int quantity);
    CartItemResponse updateCartItem(Long userId, Long cartItemId, int quantity);
    void removeFromCart(Long userId, Long cartItemId);
    void clearCart(Long userId);
    Double getCartTotal(Long userId);
}
