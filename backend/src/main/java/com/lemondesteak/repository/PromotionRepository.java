package com.lemondesteak.repository;

import com.lemondesteak.entity.Promotion;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

public interface PromotionRepository extends JpaRepository<Promotion, String> {
    @Query("""
        select p from Promotion p
        where p.isActive = true
          and p.startDate <= :now
          and p.endDate >= :now
          and (p.usageLimit is null or p.usedCount < p.usageLimit)
        order by p.endDate asc
    """)
    List<Promotion> findActiveUsable(@Param("now") OffsetDateTime now);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Promotion p where p.id = :id")
    Optional<Promotion> findByIdForUpdate(@Param("id") String id);
}
