package com.lemondesteak.repository;

import com.lemondesteak.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CustomerRepository extends JpaRepository<Customer, String> {
    Optional<Customer> findByUser_Id(String userId);
    Optional<Customer> findByPhone(String phone);
}
