package com.website.backend.dto.request;

import lombok.*;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AIRecommendationRequest {
    private List<AIUserHistoryRequest> history_prefs;
    private List<AIProductRequest> all_products;
}