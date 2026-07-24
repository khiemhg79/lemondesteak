package com.lemondesteak.controller;

import com.lemondesteak.dto.TableResponse;
import com.lemondesteak.entity.RestaurantTable;
import com.lemondesteak.exception.NotFoundException;
import com.lemondesteak.repository.RestaurantTableRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/tables")
@RequiredArgsConstructor
public class PublicTableController {
    private final RestaurantTableRepository tableRepository;

    @GetMapping("/{code}")
    public TableResponse findByQrCode(@PathVariable String code) {
        RestaurantTable table = tableRepository.findById(code)
                .or(() -> tableRepository.findByTableNumber(code))
                .orElseThrow(() -> new NotFoundException("Không tìm thấy bàn từ mã QR: " + code));
        return new TableResponse(table.getId(), table.getTableNumber(), table.getCapacity(), table.getStatus(), table.getIsActive());
    }
}
