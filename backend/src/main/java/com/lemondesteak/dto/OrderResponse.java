package com.lemondesteak.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

public record OrderResponse(
        String id,
        Integer orderNumber,
        String tableId,
        String tableNumber,
        String customerId,
        String customerName,
        String orderStatus,
        BigDecimal subTotal,
        BigDecimal discountAmount,
        BigDecimal taxAmount,
        BigDecimal serviceCharge,
        BigDecimal totalAmount,
        String promoCode,
        String customerNotes,
        OffsetDateTime createdAt,
        List<OrderDetailResponse> details
) {
    public record OrderDetailResponse(
            String id,
            String itemId,
            String comboId,
            String name,
            Integer quantity,
            BigDecimal price,
            String status
    ) {}
}
