package com.lemondesteak.controller;

import com.lemondesteak.dto.PromotionResponse;
import com.lemondesteak.service.PromotionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/promotions")
@RequiredArgsConstructor
public class PromotionController {
    private final PromotionService promotionService;

    @GetMapping("/available")
    public List<PromotionResponse> available(@RequestParam(required = false) String customerId) {
        return promotionService.availablePromotions(customerId);
    }
}
