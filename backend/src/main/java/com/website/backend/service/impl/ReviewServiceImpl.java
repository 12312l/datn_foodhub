package com.website.backend.service.impl;

import com.website.backend.dto.request.ReviewRequest;
import com.website.backend.dto.response.ReviewResponse;
import com.website.backend.entity.Product;
import com.website.backend.entity.Review;
import com.website.backend.entity.User;
import com.website.backend.exception.CustomException;
import com.website.backend.repository.ProductRepository;
import com.website.backend.repository.ReviewRepository;
import com.website.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements com.website.backend.service.ReviewService {
    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public ReviewResponse createReview(Long userId, Long productId, ReviewRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> CustomException.notFound("Người dùng không tìm thấy"));

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> CustomException.notFound("Sản phẩm không tìm thấy"));

        // Check if user already reviewed this product
        if (reviewRepository.findByProductIdAndUserId(productId, userId).isPresent()) {
            throw CustomException.badRequest("Bạn đã đánh giá sản phẩm này");
        }

        Review review = Review.builder()
                .user(user)
                .product(product)
                .rating(request.getRating())
                .comment(request.getComment())
                .build();

        review = reviewRepository.save(review);
        reviewRepository.flush();
        // Rating is now calculated from product_ratings table
        // No need to update product directly

        return mapToResponse(review);
    }

    @Override
    public Page<ReviewResponse> getAllReviews(Pageable pageable) {
        return reviewRepository.findAll(pageable).map(this::mapToResponse);
    }

    @Override
    public Page<ReviewResponse> getProductReviews(Long productId, Pageable pageable) {
        return reviewRepository.findByProductId(productId, pageable).map(this::mapToResponse);
    }

    @Override
    public ReviewResponse getReviewById(Long id) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> CustomException.notFound("Đánh giá không tìm thấy"));
        return mapToResponse(review);
    }

    @Override
    @Transactional
    public ReviewResponse replyReview(Long reviewId, String reply) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> CustomException.notFound("Đánh giá không tìm thấy"));

        review.setAdminReply(reply.trim());
        review.setRepliedAt(java.time.LocalDateTime.now());

        return mapToResponse(reviewRepository.save(review));
    }

    @Override
    @Transactional
    public void deleteReview(Long id) {
        if (!reviewRepository.existsById(id)) {
            throw CustomException.notFound("Đánh giá không tìm thấy");
        }
        reviewRepository.deleteById(id);
    }

    private ReviewResponse mapToResponse(Review review) {
        User reviewer = review.getUser();
        return ReviewResponse.builder()
                .id(review.getId())
                .productId(review.getProduct().getId())
            .productName(review.getProduct().getName())
                .userId(review.getUser().getId())
                .userName(reviewer.getFullName())
                .rating(review.getRating())
                .userAvatar(reviewer.getAvatar())
                .comment(review.getComment())
                .adminReply(review.getAdminReply())
                .repliedAt(review.getRepliedAt())
                .createdAt(review.getCreatedAt())
                .build();
    }
}
