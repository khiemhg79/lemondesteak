package com.lemondesteak.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Getter
@Setter
@Entity
@Table(name = "promotions")
public class Promotion extends BaseEntity {
    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "type", nullable = false)
    private String type;

    @Column(name = "value", nullable = false)
    private BigDecimal value = BigDecimal.ZERO;

    @Column(name = "\"minOrderAmount\"", nullable = false)
    private BigDecimal minOrderAmount = BigDecimal.ZERO;

    @Column(name = "\"maxDiscount\"")
    private BigDecimal maxDiscount;

    @Column(name = "description")
    private String description;

    @Column(name = "\"startDate\"", nullable = false)
    private OffsetDateTime startDate;

    @Column(name = "\"endDate\"", nullable = false)
    private OffsetDateTime endDate;

    @Column(name = "\"usageLimit\"")
    private Integer usageLimit;

    @Column(name = "\"usedCount\"", nullable = false)
    private Integer usedCount = 0;

    @Column(name = "\"isActive\"", nullable = false)
    private Boolean isActive = true;

    public boolean hasRemainingUses() {
        return usageLimit == null || usedCount < usageLimit;
    }
}
