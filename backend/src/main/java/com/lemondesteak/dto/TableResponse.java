package com.lemondesteak.dto;

public record TableResponse(
        String id,
        String tableNumber,
        Integer capacity,
        String status,
        Boolean isActive
) {}
