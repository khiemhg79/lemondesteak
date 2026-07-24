package com.lemondesteak.repository;

import com.lemondesteak.entity.Invoice;
import com.lemondesteak.enums.InvoiceStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface InvoiceRepository extends JpaRepository<Invoice, String> {
    Optional<Invoice> findByOrder_IdAndStatus(String orderId, InvoiceStatus status);
}
