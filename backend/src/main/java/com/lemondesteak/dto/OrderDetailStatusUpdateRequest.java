package com.lemondesteak.dto;

public record OrderDetailStatusUpdateRequest(
        String status,
        String action
) {
}