package com.lemondesteak.dto;

import java.math.BigDecimal;
import java.util.List;

public record AdminComboUpdateRequest(
        String name,
        BigDecimal price,
        String description,
        String image,
        Boolean isActive,
        List<AdminComboItemRequest> items
) {
}