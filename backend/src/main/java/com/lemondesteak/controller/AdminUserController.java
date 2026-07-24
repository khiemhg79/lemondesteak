package com.lemondesteak.controller;

import com.lemondesteak.dto.AdminUserCreateRequest;
import com.lemondesteak.dto.AdminUserUpdateRequest;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.sql.Timestamp;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private static final Set<String> ALLOWED_ROLES = Set.of(
            "ADMIN",
            "STAFF",
            "CUSTOMER"
    );

    private final EntityManager entityManager;
    private final PasswordEncoder passwordEncoder;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public List<AdminUserResponse> getUsers() {
        List<Object[]> rows = entityManager
                .createNativeQuery("""
                        select
                            u.id,
                            u.username,
                            u.phone,
                            u.email,
                            u.role::text,
                            u."isActive",
                            u."createdAt",
                            u."updatedAt",
                            u."lastLoginAt"
                        from users u
                        order by u."createdAt" desc
                        """)
                .getResultList();

        return rows.stream()
                .map(this::toResponse)
                .toList();
    }

    @PostMapping
    @Transactional
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public AdminUserResponse createUser(@RequestBody AdminUserCreateRequest request) {
        String username = cleanText(request.username());
        String phone = cleanPhone(request.phone());
        String email = cleanNullableText(request.email());
        String password = request.password() == null ? "" : request.password();
        String role = cleanRole(request.role());
        Boolean isActive = request.isActive() == null || request.isActive();

        validateUsername(username);
        validatePhone(phone);
        validateCreatePassword(password);
        ensurePhoneNotExists(phone, null);

        String id = UUID.randomUUID().toString();
        String encodedPassword = passwordEncoder.encode(password);

        entityManager
                .createNativeQuery("""
                        insert into users (
                            id,
                            username,
                            phone,
                            email,
                            password,
                            "isActive",
                            "createdAt",
                            "updatedAt",
                            role,
                            "roleId"
                        )
                        values (
                            :id,
                            :username,
                            :phone,
                            :email,
                            :password,
                            :isActive,
                            now(),
                            now(),
                            cast(:role as "Role"),
                            (select r.id from roles r where r."roleName" = :role limit 1)
                        )
                        """)
                .setParameter("id", id)
                .setParameter("username", username)
                .setParameter("phone", phone)
                .setParameter("email", email)
                .setParameter("password", encodedPassword)
                .setParameter("isActive", isActive)
                .setParameter("role", role)
                .executeUpdate();

        if ("CUSTOMER".equals(role)) {
            createCustomerIfMissing(id, username, phone, email);
        }

        return findUserById(id);
    }

    @PutMapping("/{id}")
    @Transactional
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public AdminUserResponse updateUser(
            @PathVariable String id,
            @RequestBody AdminUserUpdateRequest request
    ) {
        AdminUserResponse currentUser = findUserById(id);

        String username = cleanText(request.username());
        String phone = cleanPhone(request.phone());
        String email = cleanNullableText(request.email());
        String role = cleanRole(request.role());
        Boolean isActive = request.isActive() == null || request.isActive();
        String password = request.password() == null ? "" : request.password();

        validateUsername(username);
        validatePhone(phone);
        ensurePhoneNotExists(phone, id);

        if (!password.isBlank()) {
            validateUpdatePassword(password);

            entityManager
                    .createNativeQuery("""
                            update users
                            set username = :username,
                                phone = :phone,
                                email = :email,
                                password = :password,
                                "isActive" = :isActive,
                                role = cast(:role as "Role"),
                                "roleId" = (select r.id from roles r where r."roleName" = :role limit 1),
                                "updatedAt" = now()
                            where id = :id
                            """)
                    .setParameter("id", id)
                    .setParameter("username", username)
                    .setParameter("phone", phone)
                    .setParameter("email", email)
                    .setParameter("password", passwordEncoder.encode(password))
                    .setParameter("isActive", isActive)
                    .setParameter("role", role)
                    .executeUpdate();
        } else {
            entityManager
                    .createNativeQuery("""
                            update users
                            set username = :username,
                                phone = :phone,
                                email = :email,
                                "isActive" = :isActive,
                                role = cast(:role as "Role"),
                                "roleId" = (select r.id from roles r where r."roleName" = :role limit 1),
                                "updatedAt" = now()
                            where id = :id
                            """)
                    .setParameter("id", id)
                    .setParameter("username", username)
                    .setParameter("phone", phone)
                    .setParameter("email", email)
                    .setParameter("isActive", isActive)
                    .setParameter("role", role)
                    .executeUpdate();
        }

        if ("CUSTOMER".equals(role)) {
            createCustomerIfMissing(id, username, phone, email);
        }

        return findUserById(id);
    }

    @DeleteMapping("/{id}")
    @Transactional
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public DeleteUserResponse deleteUser(@PathVariable String id) {
        AdminUserResponse user = findUserById(id);

        if ("ADMIN".equalsIgnoreCase(user.role())) {
            long activeAdminCount = countActiveAdmins();

            if (activeAdminCount <= 1) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Không thể xóa admin cuối cùng trong hệ thống"
                );
            }
        }

        entityManager
                .createNativeQuery("""
                        update users
                        set "isActive" = false,
                            "updatedAt" = now()
                        where id = :id
                        """)
                .setParameter("id", id)
                .executeUpdate();

        return new DeleteUserResponse(id, "Đã khóa tài khoản người dùng");
    }

    private AdminUserResponse findUserById(String id) {
        List<Object[]> rows = entityManager
                .createNativeQuery("""
                        select
                            u.id,
                            u.username,
                            u.phone,
                            u.email,
                            u.role::text,
                            u."isActive",
                            u."createdAt",
                            u."updatedAt",
                            u."lastLoginAt"
                        from users u
                        where u.id = :id
                        limit 1
                        """)
                .setParameter("id", id)
                .getResultList();

        if (rows.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Không tìm thấy người dùng"
            );
        }

        return toResponse(rows.get(0));
    }

    private void createCustomerIfMissing(
            String userId,
            String username,
            String phone,
            String email
    ) {
        Number count = (Number) entityManager
                .createNativeQuery("""
                        select count(*)
                        from customers
                        where "userId" = :userId
                        """)
                .setParameter("userId", userId)
                .getSingleResult();

        if (count.longValue() > 0) return;

        entityManager
                .createNativeQuery("""
                        insert into customers (
                            id,
                            "fullName",
                            "customerType",
                            "loyaltyPoints",
                            "totalSpent",
                            "userId",
                            "isActive",
                            phone,
                            email
                        )
                        values (
                            :id,
                            :fullName,
                            'MEMBER',
                            0,
                            0,
                            :userId,
                            true,
                            :phone,
                            :email
                        )
                        """)
                .setParameter("id", UUID.randomUUID().toString())
                .setParameter("fullName", username)
                .setParameter("userId", userId)
                .setParameter("phone", phone)
                .setParameter("email", email)
                .executeUpdate();
    }

    private void ensurePhoneNotExists(String phone, String excludedUserId) {
        String sql = """
                select count(*)
                from users
                where phone = :phone
                """;

        if (excludedUserId != null) {
            sql += """
                   and id <> :excludedUserId
                   """;
        }

        var query = entityManager
                .createNativeQuery(sql)
                .setParameter("phone", phone);

        if (excludedUserId != null) {
            query.setParameter("excludedUserId", excludedUserId);
        }

        Number count = (Number) query.getSingleResult();

        if (count.longValue() > 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Số điện thoại đã tồn tại"
            );
        }
    }

    private long countActiveAdmins() {
        Number count = (Number) entityManager
                .createNativeQuery("""
                        select count(*)
                        from users
                        where role::text = 'ADMIN'
                          and "isActive" = true
                        """)
                .getSingleResult();

        return count.longValue();
    }

    private String cleanText(String value) {
        return value == null ? "" : value.trim();
    }

    private String cleanNullableText(String value) {
        String cleaned = cleanText(value);
        return cleaned.isBlank() ? null : cleaned;
    }

    private String cleanPhone(String value) {
        return value == null ? "" : value.replaceAll("\\D", "").trim();
    }

    private String cleanRole(String value) {
        String role = value == null ? "CUSTOMER" : value.trim().toUpperCase();

        if (!ALLOWED_ROLES.contains(role)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Vai trò không hợp lệ"
            );
        }

        return role;
    }

    private void validateUsername(String username) {
        if (username.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Tên đăng nhập không được bỏ trống"
            );
        }

        if (username.length() > 50) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Tên đăng nhập tối đa 50 ký tự"
            );
        }
    }

    private void validatePhone(String phone) {
        if (!phone.matches("^\\d{10}$")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Số điện thoại phải gồm đúng 10 chữ số"
            );
        }
    }

    private void validateCreatePassword(String password) {
        if (password.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Mật khẩu không được bỏ trống"
            );
        }

        validatePasswordRule(password);
    }

    private void validateUpdatePassword(String password) {
        validatePasswordRule(password);
    }

    private void validatePasswordRule(String password) {
        if (password.length() < 8 || password.length() > 20) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Mật khẩu phải từ 8 đến 20 ký tự"
            );
        }
    }

    private AdminUserResponse toResponse(Object[] row) {
        return new AdminUserResponse(
                stringValue(row[0]),
                stringValue(row[1]),
                stringValue(row[2]),
                stringValue(row[3]),
                stringValue(row[4]),
                booleanValue(row[5]),
                offsetDateTimeValue(row[6]),
                offsetDateTimeValue(row[7]),
                offsetDateTimeValue(row[8])
        );
    }

    private String stringValue(Object value) {
        return value == null ? "" : String.valueOf(value);
    }

    private Boolean booleanValue(Object value) {
        if (value == null) return false;
        if (value instanceof Boolean bool) return bool;
        return Boolean.parseBoolean(String.valueOf(value));
    }

    private OffsetDateTime offsetDateTimeValue(Object value) {
        if (value == null) return null;

        if (value instanceof OffsetDateTime offsetDateTime) {
            return offsetDateTime;
        }

        if (value instanceof Timestamp timestamp) {
            return timestamp.toInstant()
                    .atZone(ZoneId.systemDefault())
                    .toOffsetDateTime();
        }

        return null;
    }

    public record AdminUserResponse(
            String id,
            String username,
            String phone,
            String email,
            String role,
            Boolean isActive,
            OffsetDateTime createdAt,
            OffsetDateTime updatedAt,
            OffsetDateTime lastLoginAt
    ) {
    }

    public record DeleteUserResponse(
            String id,
            String message
    ) {
    }
}