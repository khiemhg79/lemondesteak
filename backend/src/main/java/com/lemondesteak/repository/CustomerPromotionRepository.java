package com.lemondesteak.repository;

import com.lemondesteak.entity.CustomerPromotion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

public interface CustomerPromotionRepository extends JpaRepository<CustomerPromotion, String> {
    boolean existsByCustomer_IdAndPromotion_IdAndIsUsedTrue(String customerId, String promotionId);
    Optional<CustomerPromotion> findByCustomer_IdAndPromotion_Id(String customerId, String promotionId);

    @Query("""
        select cp from CustomerPromotion cp
        join fetch cp.promotion p
        where cp.customer.id = :customerId
          and cp.isUsed = false
          and p.isActive = true
          and p.startDate <= :now
          and p.endDate >= :now
          and (p.usageLimit is null or p.usedCount < p.usageLimit)
        order by p.endDate asc
    """)
    List<CustomerPromotion> findAvailableForCustomer(@Param("customerId") String customerId,
                                                      @Param("now") OffsetDateTime now);
}
