package com.lemondesteak.dto;

public record AdminComboItemRequest(
        String itemId,
        Integer quantity
) {
}