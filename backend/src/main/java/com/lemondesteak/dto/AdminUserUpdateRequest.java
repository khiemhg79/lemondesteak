package com.lemondesteak.dto;

public record AdminUserUpdateRequest(
        String username,
        String phone,
        String email,
        String password,
        String role,
        Boolean isActive
) {
}