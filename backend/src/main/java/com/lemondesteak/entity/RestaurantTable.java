package com.lemondesteak.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;

@Getter
@Setter
@Entity
@Table(name = "tables")
public class RestaurantTable {

    @Id
    @Column(name = "id")
    private String id;

    @Column(name = "\"tableNumber\"")
    private String tableNumber;

    @Column(name = "capacity")
    private Integer capacity;

    @Column(name = "status")
    private String status;

    @Column(name = "\"isActive\"")
    private Boolean isActive;

    @Column(name = "\"createdAt\"")
    private OffsetDateTime createdAt;

    @Column(name = "\"updatedAt\"")
    private OffsetDateTime updatedAt;
}