package com.website.backend.service;

import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface UploadService {
    String uploadImage(MultipartFile file);
    String uploadVideo(MultipartFile file);
    List<String> uploadMultipleImages(List<MultipartFile> files);
    void deleteFile(String fileName);
}
