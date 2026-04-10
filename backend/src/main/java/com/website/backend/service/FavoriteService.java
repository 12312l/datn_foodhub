package com.website.backend.service;

import com.website.backend.dto.response.FavoriteResponse;
import com.website.backend.dto.response.ProductResponse;

import java.util.List;

public interface FavoriteService {
    List<FavoriteResponse> getUserFavorites(String email);
    FavoriteResponse addFavorite(String email, Long productId);
    void removeFavorite(String email, Long productId);
    boolean isFavorite(String email, Long productId);
}
