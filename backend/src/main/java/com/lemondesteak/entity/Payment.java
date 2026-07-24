package com.lemondesteak.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Getter
@Setter
@Entity
@Table(name = "payments")
public class Payment extends BaseEntity {
    @Column(name = "\"paymentMethod\"", nullable = false)
    private String paymentMethod = "CASH";

    @Column(name = "amount", nullable = false)
    private BigDecimal amount = BigDecimal.ZERO;

    @Column(name = "\"paidAmount\"", nullable = false)
    private BigDecimal paidAmount = BigDecimal.ZERO;

    @Column(name = "\"changeAmount\"", nullable = false)
    private BigDecimal changeAmount = BigDecimal.ZERO;

    @Column(name = "\"paymentStatus\"", nullable = false)
    private String paymentStatus = "PENDING";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "\"invoiceId\"")
    private Invoice invoice;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "\"orderId\"")
    private Order order;

    @Column(name = "\"paidAt\"")
    private OffsetDateTime paidAt;

    @Column(name = "\"transactionCode\"")
    private String transactionCode;
}
