package com.lemondesteak.controller;

import com.lemondesteak.dto.TableResponse;
import com.lemondesteak.entity.RestaurantTable;
import com.lemondesteak.exception.NotFoundException;
import com.lemondesteak.repository.RestaurantTableRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/tables")
@RequiredArgsConstructor
public class TableController {
    private final RestaurantTableRepository tableRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public List<TableResponse> list() {
        return tableRepository.findByIsActiveTrueOrderByTableNumberAsc().stream().map(this::toResponse).toList();
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public TableResponse updateStatus(@PathVariable String id, @RequestParam String status) {
        RestaurantTable table = tableRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy bàn"));
        table.setStatus(status);
        return toResponse(tableRepository.save(table));
    }

    private TableResponse toResponse(RestaurantTable table) {
        return new TableResponse(table.getId(), table.getTableNumber(), table.getCapacity(), table.getStatus(), table.getIsActive());
    }
}
