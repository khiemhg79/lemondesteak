package com.lemondesteak.dto;

import java.math.BigDecimal;

public record ItemResponse(
        String id,
        String name,
        String description,
        BigDecimal price,
        String image,
        Boolean isAvailable,
        String categoryId,
        String categoryName
) {}
