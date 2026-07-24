package com.lemondesteak.dto;

public record AdminCategoryCreateRequest(
        String categoryName,
        String description,
        String image,
        Integer sortOrder,
        Boolean isActive
) {
}