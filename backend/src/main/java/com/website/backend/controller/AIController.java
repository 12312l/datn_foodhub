package com.website.backend.controller;

import com.website.backend.service.AIService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AIController {

    private final AIService aiService;

    @PostMapping("/chat")
    public ResponseEntity<Map<String, String>> chat(
            @RequestParam(required = false) Long userId,
            @RequestBody Map<String, String> request
    ) {
        String message = request.get("message");
        String response = aiService.chat(userId, message);
        return ResponseEntity.ok(Map.of("response", response));
    }
}
