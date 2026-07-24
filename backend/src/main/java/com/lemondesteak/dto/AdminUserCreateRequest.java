package com.lemondesteak.dto;

public record AdminUserCreateRequest(
        String username,
        String phone,
        String email,
        String password,
        String role,
        Boolean isActive
) {
}