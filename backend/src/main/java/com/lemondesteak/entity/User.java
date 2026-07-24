package com.lemondesteak.entity;

import com.lemondesteak.enums.UserRole;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcType;
import org.hibernate.dialect.PostgreSQLEnumJdbcType;

import java.time.OffsetDateTime;

@Getter
@Setter
@Entity
@Table(name = "users")
public class User extends BaseEntity {
    @Column(name = "username", nullable = false)
    private String username;

    @Column(name = "phone", nullable = false, unique = true)
    private String phone;

    @Column(name = "email")
    private String email;

    @Column(name = "password", nullable = false)
    private String password;

    @Column(name = "\"isActive\"", nullable = false)
    private Boolean isActive = true;

    @Column(name = "\"lastLoginAt\"")
    private OffsetDateTime lastLoginAt;

    @Enumerated(EnumType.STRING)
    @JdbcType(PostgreSQLEnumJdbcType.class)
    @Column(name = "role", nullable = false, columnDefinition = "\"Role\"")
    private UserRole role = UserRole.CUSTOMER;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "\"roleId\"")
    private RoleEntity roleEntity;
}
