package com.website.backend.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.util.List;

@Data
public class MapResponse {
    private String status;

    @JsonProperty("origin_addresses")
    private List<String> originAddresses;

    @JsonProperty("destination_addresses")
    private List<String> destinationAddresses;

    private List<Row> rows;

    @Data
    public static class Row {
        private List<Element> elements;
    }

    @Data
    public static class Element {
        private String status;
        private Distance distance;
        private Duration duration;
    }

    @Data
    public static class Distance {
        private String text; // Ví dụ: "5.2 km"
        private Long value; // Ví dụ: 5200 (mét)
    }

    @Data
    public static class Duration {
        private String text; // Ví dụ: "15 mins"
        private Long value; // Ví dụ: 900 (giây)
    }
}