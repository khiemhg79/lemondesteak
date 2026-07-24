package com.lemondesteak.controller;

import com.lemondesteak.dto.InvoiceResponse;
import com.lemondesteak.dto.OrderCreateRequest;
import com.lemondesteak.dto.OrderResponse;
import com.lemondesteak.dto.PaymentRequest;
import com.lemondesteak.enums.OrderDetailStatus;
import com.lemondesteak.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {
    private final OrderService orderService;

    @PostMapping
    @PreAuthorize("hasAnyRole('CUSTOMER', 'STAFF', 'ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public OrderResponse create(@Valid @RequestBody OrderCreateRequest request) {
        return orderService.createOrder(request);
    }

    @GetMapping("/table/{tableId}/current")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public List<OrderResponse> currentByTable(@PathVariable String tableId) {
        return orderService.getCurrentOrdersByTable(tableId);
    }

    @GetMapping("/customer/{customerId}/history")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'STAFF', 'ADMIN')")
    public List<OrderResponse> historyByCustomer(@PathVariable String customerId) {
        return orderService.getHistoryByCustomer(customerId);
    }

    @PatchMapping("/details/{detailId}/status")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public OrderResponse updateDetailStatus(@PathVariable String detailId,
                                            @RequestParam OrderDetailStatus status) {
        return orderService.updateDetailStatus(detailId, status);
    }

    @PostMapping("/{orderId}/request-payment")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public InvoiceResponse requestPayment(@PathVariable String orderId) {
        return orderService.requestPayment(orderId);
    }

    @PostMapping("/{orderId}/pay")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public InvoiceResponse pay(@PathVariable String orderId,
                               @Valid @RequestBody PaymentRequest request) {
        return orderService.pay(orderId, request);
    }
}
