package com.lemondesteak.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "categories")
public class Category extends BaseEntity {
    @Column(name = "\"categoryName\"", nullable = false)
    private String categoryName;

    @Column(name = "description")
    private String description;

    @Column(name = "image")
    private String image;

    @Column(name = "\"sortOrder\"", nullable = false)
    private Integer sortOrder = 0;

    @Column(name = "\"isActive\"", nullable = false)
    private Boolean isActive = true;
}
