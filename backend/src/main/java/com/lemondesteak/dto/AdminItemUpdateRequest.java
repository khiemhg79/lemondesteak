package com.lemondesteak.dto;

import java.math.BigDecimal;

public record AdminItemUpdateRequest(
        String name,
        BigDecimal price,
        String categoryId,
        String description,
        String image,
        Boolean isAvailable
) {
}