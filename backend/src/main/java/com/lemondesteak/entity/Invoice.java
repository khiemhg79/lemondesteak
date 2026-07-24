package com.lemondesteak.entity;

import com.lemondesteak.enums.InvoiceStatus;
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

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Getter
@Setter
@Entity
@Table(name = "invoices")
public class Invoice extends BaseEntity {
    @Column(name = "\"invoiceNumber\"", nullable = false, unique = true)
    private String invoiceNumber;

    @Column(name = "\"subTotal\"", nullable = false)
    private BigDecimal subTotal = BigDecimal.ZERO;

    @Column(name = "\"customerName\"")
    private String customerName;

    @Column(name = "\"customerTaxCode\"")
    private String customerTaxCode;

    @Column(name = "\"taxAmount\"", nullable = false)
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Column(name = "\"totalAmount\"", nullable = false)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(name = "\"paymentMethod\"")
    private String paymentMethod;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "\"orderId\"")
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "\"customerId\"")
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "\"tableId\"")
    private RestaurantTable table;

    @Enumerated(EnumType.STRING)
    @JdbcType(PostgreSQLEnumJdbcType.class)
    @Column(name = "status", nullable = false, columnDefinition = "\"InvoiceStatus\"")
    private InvoiceStatus status = InvoiceStatus.UNPAID;

    @Column(name = "\"paidAt\"")
    private OffsetDateTime paidAt;

    @Column(name = "note")
    private String note;
}
