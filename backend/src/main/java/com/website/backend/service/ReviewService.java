package com.website.backend.service;

import com.website.backend.dto.request.ReviewRequest;
import com.website.backend.dto.response.ReviewResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ReviewService {
    ReviewResponse createReview(Long userId, Long productId, ReviewRequest request);
    Page<ReviewResponse> getAllReviews(Pageable pageable);
    Page<ReviewResponse> getProductReviews(Long productId, Pageable pageable);
    ReviewResponse getReviewById(Long id);
    ReviewResponse replyReview(Long reviewId, String reply);
    void deleteReview(Long id);
}
