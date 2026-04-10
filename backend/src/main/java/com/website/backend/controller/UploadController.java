package com.website.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/uploads")
@CrossOrigin(origins = "*")
public class UploadController {

    private static final String UPLOAD_DIR = "uploads/chat/";

    @PostMapping("/chat")
    public ResponseEntity<List<String>> uploadChatFiles(@RequestParam("files") MultipartFile[] files) {
        List<String> urls = new ArrayList<>();

        try {
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            for (MultipartFile file : files) {
                if (file != null && !file.isEmpty()) {
                    String originalFilename = file.getOriginalFilename();
                    String extension = "";
                    if (originalFilename != null && originalFilename.contains(".")) {
                        extension = originalFilename.substring(originalFilename.lastIndexOf("."));
                    }

                    String newFilename = UUID.randomUUID().toString() + extension;
                    Path filePath = uploadPath.resolve(newFilename);
                    Files.copy(file.getInputStream(), filePath);

                    String url = "/uploads/chat/" + newFilename;
                    urls.add(url);
                }
            }

            return ResponseEntity.ok(urls);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
