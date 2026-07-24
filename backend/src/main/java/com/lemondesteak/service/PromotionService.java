package com.lemondesteak.service;

import com.lemondesteak.dto.PromotionResponse;
import com.lemondesteak.entity.Promotion;
import com.lemondesteak.repository.CustomerPromotionRepository;
import com.lemondesteak.repository.PromotionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PromotionService {
    private final PromotionRepository promotionRepository;
    private final CustomerPromotionRepository customerPromotionRepository;

    public List<PromotionResponse> availablePromotions(String customerId) {
        OffsetDateTime now = OffsetDateTime.now();
        return promotionRepository.findActiveUsable(now)
                .stream()
                .filter(p -> customerId == null || customerId.isBlank()
                        || !customerPromotionRepository.existsByCustomer_IdAndPromotion_IdAndIsUsedTrue(customerId, p.getId()))
                .map(this::toPromotionResponse)
                .toList();
    }

    private PromotionResponse toPromotionResponse(Promotion p) {
        return new PromotionResponse(
                p.getId(), p.getName(), p.getType(), p.getValue(), p.getMinOrderAmount(), p.getMaxDiscount(),
                p.getDescription(), p.getStartDate(), p.getEndDate(), p.getUsageLimit(), p.getUsedCount()
        );
    }
}
