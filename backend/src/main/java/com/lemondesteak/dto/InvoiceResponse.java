package com.lemondesteak.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record InvoiceResponse(
        String id,
        String invoiceNumber,
        String orderId,
        String tableId,
        BigDecimal subTotal,
        BigDecimal taxAmount,
        BigDecimal totalAmount,
        String paymentMethod,
        String status,
        OffsetDateTime paidAt
) {}
