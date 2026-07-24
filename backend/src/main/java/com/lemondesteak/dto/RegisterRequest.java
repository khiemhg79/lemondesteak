package com.lemondesteak.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "Họ tên không được để trống")
        @Size(max = 100, message = "Họ tên tối đa 100 ký tự")
        String fullName,

        @NotBlank(message = "Số điện thoại không được để trống")
        @Pattern(regexp = "^0\\d{9}$", message = "Số điện thoại phải gồm 10 số và bắt đầu bằng 0")
        String phone,

        @Email(message = "Email không hợp lệ")
        String email,

        @NotBlank(message = "Mật khẩu không được để trống")
        @Size(min = 8, max = 50, message = "Mật khẩu phải từ 8 đến 50 ký tự")
        String password,

        @NotBlank(message = "Nhập lại mật khẩu không được để trống")
        String confirmPassword
) {}
