package com.lemondesteak.repository;

import com.lemondesteak.entity.RestaurantTable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RestaurantTableRepository extends JpaRepository<RestaurantTable, String> {
    Optional<RestaurantTable> findByTableNumber(String tableNumber);
    List<RestaurantTable> findByIsActiveTrueOrderByTableNumberAsc();
}
