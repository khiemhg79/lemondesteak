package com.lemondesteak.repository;

import com.lemondesteak.entity.Combo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ComboRepository extends JpaRepository<Combo, String> {
    List<Combo> findByIsActiveTrueOrderByNameAsc();
}
