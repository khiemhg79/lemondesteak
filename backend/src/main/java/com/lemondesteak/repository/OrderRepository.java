package com.lemondesteak.repository;

import com.lemondesteak.entity.Order;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface OrderRepository extends JpaRepository<Order, String> {
    @EntityGraph(attributePaths = {"details", "table", "customer"})
    List<Order> findByTable_IdAndOrderStatusInOrderByCreatedAtDesc(String tableId, Collection<String> statuses);

    @EntityGraph(attributePaths = {"details", "table", "customer"})
    List<Order> findByCustomer_IdOrderByCreatedAtDesc(String customerId);
}
