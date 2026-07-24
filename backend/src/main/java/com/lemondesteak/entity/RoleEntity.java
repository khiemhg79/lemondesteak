package com.lemondesteak.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "roles")
public class RoleEntity extends BaseEntity {
    @Column(name = "\"roleName\"", nullable = false, unique = true)
    private String roleName;

    @Column(name = "description")
    private String description;
}
