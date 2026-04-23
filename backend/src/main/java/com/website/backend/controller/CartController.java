package com.website.backend.controller;

import com.website.backend.dto.response.CartItemResponse;
import com.website.backend.entity.User;
import com.website.backend.exception.CustomException;
import com.website.backend.repository.UserRepository;
import com.website.backend.service.CartService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<CartItemResponse>> getCartItems(@AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        return ResponseEntity.ok(cartService.getCartItems(userId));
    }

    @PostMapping("/add")
    public ResponseEntity<CartItemResponse> addToCart(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam Long productId,
            @RequestParam(required = false) Long variantId,
            @RequestParam(defaultValue = "1") int quantity
    ) {
        Long userId = getUserId(userDetails);
        return ResponseEntity.ok(cartService.addToCart(userId, productId, variantId, quantity));
    }

    @PutMapping("/update")
    public ResponseEntity<CartItemResponse> updateCartItem(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam Long cartItemId,
            @RequestParam int quantity
    ) {
        Long userId = getUserId(userDetails);
        return ResponseEntity.ok(cartService.updateCartItem(userId, cartItemId, quantity));
    }

    @DeleteMapping("/remove")
    public ResponseEntity<Void> removeFromCart(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam Long cartItemId
    ) {
        Long userId = getUserId(userDetails);
        cartService.removeFromCart(userId, cartItemId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/clear")
    public ResponseEntity<Void> clearCart(@AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        cartService.clearCart(userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/total")
    public ResponseEntity<Map<String, Double>> getCartTotal(@AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        Double total = cartService.getCartTotal(userId);
        return ResponseEntity.ok(Map.of("total", total != null ? total : 0.0));
    }

//    private Long getUserId(UserDetails userDetails) {
//        // Extract user ID from UserDetails - would need to implement a custom UserDetails
//        // For now, we'll use email to get user ID
//        return 1L; // Default for now - will be fixed with proper implementation
//    }
private Long getUserId(UserDetails userDetails) {
    if (userDetails == null) return null;
    return userRepository.findByEmail(userDetails.getUsername())
            .map(User::getId)
            .orElseThrow(() -> CustomException.notFound("User not found"));
}

}
