package com.lemondesteak.dto;

import java.math.BigDecimal;

public record AdminItemCreateRequest(
        String name,
        BigDecimal price,
        String categoryId,
        String description,
        String image,
        Boolean isAvailable
) {
}