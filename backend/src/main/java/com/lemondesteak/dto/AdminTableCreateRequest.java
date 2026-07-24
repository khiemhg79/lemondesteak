package com.lemondesteak.dto;

public record AdminTableCreateRequest(
        String tableNumber,
        Integer capacity,
        String status,
        Boolean isActive
) {
}