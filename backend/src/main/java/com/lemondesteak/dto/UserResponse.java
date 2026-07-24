package com.lemondesteak.dto;

public record UserResponse(
        String id,
        String username,
        String phone,
        String email,
        String role,
        Boolean isActive
) {}
