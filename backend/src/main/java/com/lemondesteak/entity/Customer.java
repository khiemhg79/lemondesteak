package com.lemondesteak.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "customers")
public class Customer {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private String id;

    @Column(name = "\"fullName\"", nullable = false)
    private String fullName;

    @Column(name = "\"dateOfBirth\"")
    private LocalDate dateOfBirth;

    @Column(name = "address")
    private String address;

    @Column(name = "city")
    private String city;

    @Column(name = "district")
    private String district;

    @Column(name = "\"customerType\"", nullable = false)
    private String customerType = "GUEST";

    @Column(name = "\"loyaltyPoints\"", nullable = false)
    private Integer loyaltyPoints = 0;

    @Column(name = "\"totalSpent\"", nullable = false)
    private BigDecimal totalSpent = BigDecimal.ZERO;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "\"userId\"")
    private User user;

    @Column(name = "\"isActive\"", nullable = false)
    private Boolean isActive = true;

    @Column(name = "phone")
    private String phone;

    @Column(name = "email")
    private String email;

    @PrePersist
    public void prePersist() {
        if (id == null || id.isBlank()) {
            id = UUID.randomUUID().toString();
        }

        if (customerType == null) {
            customerType = "GUEST";
        }

        if (loyaltyPoints == null) {
            loyaltyPoints = 0;
        }

        if (totalSpent == null) {
            totalSpent = BigDecimal.ZERO;
        }

        if (isActive == null) {
            isActive = true;
        }
    }
}