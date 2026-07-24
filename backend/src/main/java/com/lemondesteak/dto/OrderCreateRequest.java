package com.lemondesteak.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record OrderCreateRequest(
        @NotBlank(message = "Thiếu mã bàn")
        String tableId,

        String userId,
        String customerId,
        String promotionId,
        String customerNotes,

        List<@Valid OrderLineItemRequest> items,
        List<@Valid OrderLineComboRequest> combos
) {
    public boolean hasNoLines() {
        return (items == null || items.isEmpty()) && (combos == null || combos.isEmpty());
    }

    public record OrderLineItemRequest(
            @NotBlank(message = "Thiếu mã món")
            String itemId,
            @Min(value = 1, message = "Số lượng món phải >= 1")
            Integer quantity
    ) {}

    public record OrderLineComboRequest(
            @NotBlank(message = "Thiếu mã combo")
            String comboId,
            @Min(value = 1, message = "Số lượng combo phải >= 1")
            Integer quantity
    ) {}
}
