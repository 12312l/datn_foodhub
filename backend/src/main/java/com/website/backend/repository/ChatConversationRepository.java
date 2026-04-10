package com.website.backend.repository;

import com.website.backend.entity.ChatConversation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ChatConversationRepository extends JpaRepository<ChatConversation, Long> {
    Page<ChatConversation> findByStatusOrderByUpdatedAtDesc(ChatConversation.ConversationStatus status, Pageable pageable);
    Optional<ChatConversation> findByUserIdAndStatus(Long userId, ChatConversation.ConversationStatus status);
    Page<ChatConversation> findByUserId(Long userId, Pageable pageable);
    Page<ChatConversation> findByUserIdAndStatus(Long userId, ChatConversation.ConversationStatus status, Pageable pageable);
}
