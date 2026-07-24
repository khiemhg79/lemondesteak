package com.lemondesteak.service;

import com.lemondesteak.dto.AuthResponse;
import com.lemondesteak.dto.LoginRequest;
import com.lemondesteak.dto.RegisterRequest;
import com.lemondesteak.entity.Customer;
import com.lemondesteak.entity.User;
import com.lemondesteak.enums.UserRole;
import com.lemondesteak.exception.BadRequestException;
import com.lemondesteak.repository.CustomerRepository;
import com.lemondesteak.repository.UserRepository;
import com.lemondesteak.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (!request.password().equals(request.confirmPassword())) {
            throw new BadRequestException("Mật khẩu nhập lại không trùng khớp");
        }
        if (userRepository.existsByPhone(request.phone())) {
            throw new BadRequestException("Số điện thoại đã tồn tại trên hệ thống");
        }

        User user = new User();
        user.setUsername(request.fullName().trim());
        user.setPhone(request.phone().trim());
        user.setEmail(request.email());
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setRole(UserRole.CUSTOMER);
        user.setIsActive(true);
        userRepository.save(user);

        Customer customer = new Customer();
        customer.setFullName(request.fullName().trim());
        customer.setPhone(request.phone().trim());
        customer.setEmail(request.email());
        customer.setUser(user);
        customerRepository.save(customer);

        String token = jwtService.generateToken(user, customer.getId());
        return new AuthResponse(token, user.getId(), customer.getId(), customer.getFullName(), user.getPhone(), user.getRole().name());
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(request.phone(), request.password()));
        User user = userRepository.findByPhone(request.phone())
                .orElseThrow(() -> new BadRequestException("Sai số điện thoại hoặc mật khẩu"));
        if (!Boolean.TRUE.equals(user.getIsActive())) {
            throw new BadRequestException("Tài khoản đã bị khóa hoặc ngừng hoạt động");
        }
        user.setLastLoginAt(OffsetDateTime.now());
        Customer customer = customerRepository.findByUser_Id(user.getId()).orElse(null);
        String customerId = customer == null ? null : customer.getId();
        String fullName = customer == null ? user.getUsername() : customer.getFullName();
        String token = jwtService.generateToken(user, customerId);
        return new AuthResponse(token, user.getId(), customerId, fullName, user.getPhone(), user.getRole().name());
    }
}
