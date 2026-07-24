package com.lemondesteak.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record LoginRequest(
        @NotBlank(message = "Số điện thoại không được để trống")
        @Pattern(regexp = "^0\\d{9}$", message = "Số điện thoại phải gồm 10 số và bắt đầu bằng 0")
        String phone,

        @NotBlank(message = "Mật khẩu không được để trống")
        String password
) {}
