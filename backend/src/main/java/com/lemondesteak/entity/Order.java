package com.lemondesteak.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.Generated;
import org.hibernate.generator.EventType;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Entity
@Table(name = "orders")
public class Order extends BaseEntity {
    @Generated(event = EventType.INSERT)
    @Column(name = "\"orderNumber\"", insertable = false, updatable = false, unique = true)
    private Integer orderNumber;

    @Column(name = "\"subTotal\"", nullable = false)
    private BigDecimal subTotal = BigDecimal.ZERO;

    @Column(name = "\"taxAmount\"", nullable = false)
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Column(name = "\"serviceCharge\"", nullable = false)
    private BigDecimal serviceCharge = BigDecimal.ZERO;

    @Column(name = "\"discountAmount\"", nullable = false)
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(name = "\"totalAmount\"", nullable = false)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(name = "\"orderStatus\"", nullable = false)
    private String orderStatus = "PENDING";

    @Column(name = "\"customerNotes\"")
    private String customerNotes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "\"tableId\"")
    private RestaurantTable table;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "\"userId\"")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "\"customerId\"")
    private Customer customer;

    @Column(name = "\"promoCode\"")
    private String promoCode;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderDetail> details = new ArrayList<>();

    public void addDetail(OrderDetail detail) {
        details.add(detail);
        detail.setOrder(this);
    }
}
