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

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "customerpromotions")
public class CustomerPromotion {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "\"customerId\"", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "\"promotionId\"", nullable = false)
    private Promotion promotion;

    @Column(name = "\"isUsed\"", nullable = false)
    private Boolean isUsed = false;

    @Column(name = "\"usedAt\"")
    private OffsetDateTime usedAt;

    @Column(name = "\"assignedAt\"", nullable = false)
    private OffsetDateTime assignedAt = OffsetDateTime.now();

    @PrePersist
    public void prePersist() {
        if (id == null || id.isBlank()) {
            id = UUID.randomUUID().toString();
        }

        if (isUsed == null) {
            isUsed = false;
        }

        if (assignedAt == null) {
            assignedAt = OffsetDateTime.now();
        }
    }
}