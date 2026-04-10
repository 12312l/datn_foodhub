package com.website.backend.service.impl;

import com.website.backend.dto.response.FavoriteResponse;
import com.website.backend.dto.response.ProductResponse;
import com.website.backend.entity.Favorite;
import com.website.backend.entity.Product;
import com.website.backend.entity.User;
import com.website.backend.exception.CustomException;
import com.website.backend.repository.FavoriteRepository;
import com.website.backend.repository.ProductRepository;
import com.website.backend.repository.UserRepository;
import com.website.backend.service.FavoriteService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FavoriteServiceImpl implements FavoriteService {

    private final FavoriteRepository favoriteRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    @Override
    public List<FavoriteResponse> getUserFavorites(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> CustomException.notFound("Người dùng không tìm thấy"));

        return favoriteRepository.findByUserIdOrderByCreatedAtDesc(user.getId(), PageRequest.of(0, 50))
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public FavoriteResponse addFavorite(String email, Long productId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> CustomException.notFound("Người dùng không tìm thấy"));

        if (favoriteRepository.existsByUserIdAndProductId(user.getId(), productId)) {
            throw CustomException.badRequest("Sản phẩm đã có trong danh sách yêu thích");
        }

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> CustomException.notFound("Sản phẩm không tìm thấy"));

        Favorite favorite = Favorite.builder()
                .user(user)
                .product(product)
                .build();

        favoriteRepository.save(favorite);
        return mapToResponse(favorite);
    }

    @Override
    @Transactional
    public void removeFavorite(String email, Long productId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> CustomException.notFound("Người dùng không tìm thấy"));
        favoriteRepository.deleteByUserIdAndProductId(user.getId(), productId);
    }

    @Override
    public boolean isFavorite(String email, Long productId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> CustomException.notFound("Người dùng không tìm thấy"));
        return favoriteRepository.existsByUserIdAndProductId(user.getId(), productId);
    }

    private FavoriteResponse mapToResponse(Favorite favorite) {
        Product product = favorite.getProduct();
        // Get image from ProductMedia
        String imageUrl = null;
        if (product.getMedia() != null && !product.getMedia().isEmpty()) {
            imageUrl = product.getMedia().get(0).getMediaUrl();
        }

        return FavoriteResponse.builder()
                .id(favorite.getId())
                .productId(product.getId())
                .productName(product.getName())
                .productImage(imageUrl)
                .productPrice(product.getPrice() != null ? product.getPrice().doubleValue() : 0)
                .createdAt(favorite.getCreatedAt())
                .build();
    }
}
