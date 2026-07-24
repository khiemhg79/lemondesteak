package com.lemondesteak.dto;

import java.math.BigDecimal;

public record PaymentConfirmRequest(
        BigDecimal paidAmount,
        String paymentMethod,
        String note
) {
}