package com.lemondesteak.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record PromotionResponse(
        String id,
        String name,
        String type,
        BigDecimal value,
        BigDecimal minOrderAmount,
        BigDecimal maxDiscount,
        String description,
        OffsetDateTime startDate,
        OffsetDateTime endDate,
        Integer usageLimit,
        Integer usedCount
) {}
