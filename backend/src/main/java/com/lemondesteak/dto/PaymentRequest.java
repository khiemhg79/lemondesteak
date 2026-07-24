package com.lemondesteak.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;

public record PaymentRequest(
        @NotBlank(message = "Thiếu phương thức thanh toán")
        String paymentMethod,

        @DecimalMin(value = "0", inclusive = true, message = "Số tiền khách đưa không hợp lệ")
        BigDecimal paidAmount,

        String transactionCode
) {}
