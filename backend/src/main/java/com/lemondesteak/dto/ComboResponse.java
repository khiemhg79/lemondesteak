package com.lemondesteak.dto;

import java.math.BigDecimal;

public record ComboResponse(
        String id,
        String name,
        String description,
        BigDecimal price,
        String image
) {}
