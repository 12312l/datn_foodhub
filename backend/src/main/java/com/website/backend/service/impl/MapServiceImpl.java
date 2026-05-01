package com.website.backend.service.impl;

import com.website.backend.dto.response.MapResponse;
import com.website.backend.service.MapService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Service
public class MapServiceImpl implements MapService {
    @Value("${google.maps.api.key}")
    private String apiKey;

    private final RestTemplate restTemplate;

    public MapServiceImpl(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    // Địa chỉ quán cụ thể tại Lĩnh Nam
    private final String origin = "123, Đường Lĩnh Nam, Hoàng Mai, Hà Nội";

    @Override
    public double getDistance(String destination) {
        // 1. Kiểm tra nhanh: Địa chỉ phải chứa chữ "Hà Nội"
        String addressLower = destination.toLowerCase();
        if (!addressLower.contains("hà nội") && !addressLower.contains("ha noi")) {
            System.out.println("⚠️ Địa chỉ nằm ngoài Hà Nội: " + destination);
            return -1.0; // Quy ước -1 là lỗi địa chỉ không thuộc khu vực kinh doanh
        }

        try {
            String encodedOrigin = URLEncoder.encode(origin, StandardCharsets.UTF_8);
            String encodedDestination = URLEncoder.encode(destination, StandardCharsets.UTF_8);

            String url = String.format(
                    "https://maps.googleapis.com/maps/api/distancematrix/json?origins=%s&destinations=%s&key=%s",
                    encodedOrigin, encodedDestination, apiKey
            );

            MapResponse response = restTemplate.getForObject(url, MapResponse.class);

            if (response != null && "OK".equals(response.getStatus())) {
                MapResponse.Element element = response.getRows().get(0).getElements().get(0);

                if ("OK".equals(element.getStatus())) {
                    long meters = element.getDistance().getValue();
                    double km = Math.round((meters / 1000.0) * 10.0) / 10.0;

                    // 2. Giới hạn khoảng cách: Đồ ăn không nên giao quá 30km
                    if (km > 30.0) {
                        System.out.println("⚠️ Khoảng cách quá xa (" + km + "km). Không thể giao đồ ăn.");
                        return -2.0; // Quy ước -2 là lỗi quá xa
                    }

                    return km;
                }
            }

            // Chế độ dự phòng khi lỗi API (chỉ dùng để demo nếu Billing gặp sự cố)
            return (double) (destination.length() % 5) + 3.0;

        } catch (Exception e) {
            System.err.println("❌ Lỗi MapService: " + e.getMessage());
            return 5.0;
        }
    }
}