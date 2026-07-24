package com.lemondesteak.dto;

public record AdminTableUpdateRequest(
        String tableNumber,
        Integer capacity,
        String status,
        Boolean isActive
) {
}