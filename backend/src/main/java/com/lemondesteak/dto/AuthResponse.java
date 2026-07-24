package com.lemondesteak.dto;

public record AuthResponse(
        String token,
        String userId,
        String customerId,
        String fullName,
        String phone,
        String role
) {}
