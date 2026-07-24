package com.lemondesteak.dto;

public record CategoryResponse(
        String id,
        String categoryName,
        String description,
        String image,
        Integer sortOrder
) {}
