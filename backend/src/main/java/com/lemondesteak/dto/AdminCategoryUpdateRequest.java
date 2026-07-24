package com.lemondesteak.dto;

public record AdminCategoryUpdateRequest(
        String categoryName,
        String description,
        String image,
        Integer sortOrder,
        Boolean isActive
) {
}