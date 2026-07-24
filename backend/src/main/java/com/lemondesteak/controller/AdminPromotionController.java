package com.lemondesteak.controller;

import com.lemondesteak.dto.AdminPromotionCreateRequest;
import com.lemondesteak.dto.AdminPromotionUpdateRequest;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/promotions")
@RequiredArgsConstructor
public class AdminPromotionController {

    private static final Set<String> ALLOWED_TYPES = Set.of(
            "PERCENT",
            "FIXED"
    );

    private final EntityManager entityManager;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public List<AdminPromotionResponse> getPromotions() {
        List<Object[]> rows = entityManager
                .createNativeQuery("""
                        select
                            p.id,
                            p.name,
                            p.type,
                            p.value,
                            p."minOrderAmount",
                            p."maxDiscount",
                            p.description,
                            p."startDate",
                            p."endDate",
                            p."usageLimit",
                            p."usedCount",
                            p."isActive",
                            p."createdAt",
                            p."updatedAt"
                        from promotions p
                        order by p."createdAt" desc
                        """)
                .getResultList();

        return rows.stream()
                .map(this::toResponse)
                .toList();
    }

    @PostMapping
    @Transactional
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public AdminPromotionResponse createPromotion(
            @RequestBody AdminPromotionCreateRequest request
    ) {
        PromotionData data = validateCreateRequest(request);

        String id = UUID.randomUUID().toString();

        entityManager
                .createNativeQuery("""
                        insert into promotions (
                            id,
                            name,
                            type,
                            value,
                            "minOrderAmount",
                            "maxDiscount",
                            description,
                            "startDate",
                            "endDate",
                            "usageLimit",
                            "usedCount",
                            "isActive",
                            "createdAt",
                            "updatedAt"
                        )
                        values (
                            :id,
                            :name,
                            :type,
                            :value,
                            :minOrderAmount,
                            :maxDiscount,
                            :description,
                            :startDate,
                            :endDate,
                            :usageLimit,
                            0,
                            :isActive,
                            now(),
                            now()
                        )
                        """)
                .setParameter("id", id)
                .setParameter("name", data.name())
                .setParameter("type", data.type())
                .setParameter("value", data.value())
                .setParameter("minOrderAmount", data.minOrderAmount())
                .setParameter("maxDiscount", data.maxDiscount())
                .setParameter("description", data.description())
                .setParameter("startDate", data.startDate())
                .setParameter("endDate", data.endDate())
                .setParameter("usageLimit", data.usageLimit())
                .setParameter("isActive", data.isActive())
                .executeUpdate();

        return findPromotionById(id);
    }

    @PutMapping("/{id}")
    @Transactional
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public AdminPromotionResponse updatePromotion(
            @PathVariable String id,
            @RequestBody AdminPromotionUpdateRequest request
    ) {
        findPromotionById(id);

        PromotionData data = validateUpdateRequest(request);

        entityManager
                .createNativeQuery("""
                        update promotions
                        set name = :name,
                            type = :type,
                            value = :value,
                            "minOrderAmount" = :minOrderAmount,
                            "maxDiscount" = :maxDiscount,
                            description = :description,
                            "startDate" = :startDate,
                            "endDate" = :endDate,
                            "usageLimit" = :usageLimit,
                            "isActive" = :isActive,
                            "updatedAt" = now()
                        where id = :id
                        """)
                .setParameter("id", id)
                .setParameter("name", data.name())
                .setParameter("type", data.type())
                .setParameter("value", data.value())
                .setParameter("minOrderAmount", data.minOrderAmount())
                .setParameter("maxDiscount", data.maxDiscount())
                .setParameter("description", data.description())
                .setParameter("startDate", data.startDate())
                .setParameter("endDate", data.endDate())
                .setParameter("usageLimit", data.usageLimit())
                .setParameter("isActive", data.isActive())
                .executeUpdate();

        return findPromotionById(id);
    }

    @DeleteMapping("/{id}")
    @Transactional
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public DeletePromotionResponse deletePromotion(@PathVariable String id) {
        findPromotionById(id);

        entityManager
                .createNativeQuery("""
                        delete from customerpromotions
                        where "promotionId" = :id
                        """)
                .setParameter("id", id)
                .executeUpdate();

        entityManager
                .createNativeQuery("""
                        delete from promotions
                        where id = :id
                        """)
                .setParameter("id", id)
                .executeUpdate();

        return new DeletePromotionResponse(id, "Đã xóa chương trình khuyến mãi");
    }

    private AdminPromotionResponse findPromotionById(String id) {
        List<Object[]> rows = entityManager
                .createNativeQuery("""
                        select
                            p.id,
                            p.name,
                            p.type,
                            p.value,
                            p."minOrderAmount",
                            p."maxDiscount",
                            p.description,
                            p."startDate",
                            p."endDate",
                            p."usageLimit",
                            p."usedCount",
                            p."isActive",
                            p."createdAt",
                            p."updatedAt"
                        from promotions p
                        where p.id = :id
                        limit 1
                        """)
                .setParameter("id", id)
                .getResultList();

        if (rows.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Không tìm thấy chương trình khuyến mãi"
            );
        }

        return toResponse(rows.get(0));
    }

    private PromotionData validateCreateRequest(AdminPromotionCreateRequest request) {
        return validatePromotionData(
                request.name(),
                request.type(),
                request.value(),
                request.minOrderAmount(),
                request.maxDiscount(),
                request.description(),
                request.startDate(),
                request.endDate(),
                request.usageLimit(),
                request.isActive()
        );
    }

    private PromotionData validateUpdateRequest(AdminPromotionUpdateRequest request) {
        return validatePromotionData(
                request.name(),
                request.type(),
                request.value(),
                request.minOrderAmount(),
                request.maxDiscount(),
                request.description(),
                request.startDate(),
                request.endDate(),
                request.usageLimit(),
                request.isActive()
        );
    }

    private PromotionData validatePromotionData(
            String rawName,
            String rawType,
            BigDecimal rawValue,
            BigDecimal rawMinOrderAmount,
            BigDecimal rawMaxDiscount,
            String rawDescription,
            OffsetDateTime rawStartDate,
            OffsetDateTime rawEndDate,
            Integer rawUsageLimit,
            Boolean rawIsActive
    ) {
        String name = cleanText(rawName);

        if (name.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Tên khuyến mãi không được bỏ trống"
            );
        }

        if (name.length() > 50) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Tên khuyến mãi tối đa 50 ký tự"
            );
        }

        String type = cleanText(rawType).toUpperCase();

        if (!ALLOWED_TYPES.contains(type)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Loại khuyến mãi không hợp lệ"
            );
        }

        BigDecimal value = rawValue == null ? BigDecimal.ZERO : rawValue;

        if (value.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Giá trị khuyến mãi phải lớn hơn 0"
            );
        }

        if ("PERCENT".equals(type) && value.compareTo(BigDecimal.valueOf(100)) > 0) {
            value = BigDecimal.valueOf(100);
        }

        BigDecimal minOrderAmount = rawMinOrderAmount == null
                ? BigDecimal.ZERO
                : rawMinOrderAmount;

        if (minOrderAmount.compareTo(BigDecimal.ZERO) < 0) {
            minOrderAmount = BigDecimal.ZERO;
        }

        BigDecimal maxDiscount = rawMaxDiscount;

        if (maxDiscount != null && maxDiscount.compareTo(BigDecimal.ZERO) < 0) {
            maxDiscount = BigDecimal.ZERO;
        }

        OffsetDateTime startDate = rawStartDate;

        if (startDate == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Ngày bắt đầu không được bỏ trống"
            );
        }

        OffsetDateTime endDate = rawEndDate;

        if (endDate == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Ngày kết thúc không được bỏ trống"
            );
        }

        if (!endDate.isAfter(startDate)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Ngày kết thúc phải sau ngày bắt đầu"
            );
        }

        Integer usageLimit = rawUsageLimit;

        if (usageLimit != null && usageLimit <= 0) {
            usageLimit = null;
        }

        Boolean isActive = rawIsActive == null || rawIsActive;

        return new PromotionData(
                name,
                type,
                value,
                minOrderAmount,
                maxDiscount,
                cleanNullableText(rawDescription),
                startDate,
                endDate,
                usageLimit,
                isActive
        );
    }

    private String cleanText(String value) {
        return value == null ? "" : value.trim();
    }

    private String cleanNullableText(String value) {
        String cleaned = cleanText(value);
        return cleaned.isBlank() ? null : cleaned;
    }

    private AdminPromotionResponse toResponse(Object[] row) {
        return new AdminPromotionResponse(
                stringValue(row[0]),
                stringValue(row[1]),
                stringValue(row[2]),
                bigDecimalValue(row[3]),
                bigDecimalValue(row[4]),
                nullableBigDecimalValue(row[5]),
                stringValue(row[6]),
                offsetDateTimeValue(row[7]),
                offsetDateTimeValue(row[8]),
                integerNullableValue(row[9]),
                intValue(row[10]),
                booleanValue(row[11]),
                offsetDateTimeValue(row[12]),
                offsetDateTimeValue(row[13])
        );
    }

    private String stringValue(Object value) {
        return value == null ? "" : String.valueOf(value);
    }

    private Integer intValue(Object value) {
        if (value == null) return 0;
        if (value instanceof Number number) return number.intValue();
        return Integer.parseInt(String.valueOf(value));
    }

    private Integer integerNullableValue(Object value) {
        if (value == null) return null;
        if (value instanceof Number number) return number.intValue();
        return Integer.parseInt(String.valueOf(value));
    }

    private BigDecimal bigDecimalValue(Object value) {
        if (value == null) return BigDecimal.ZERO;
        if (value instanceof BigDecimal decimal) return decimal;
        if (value instanceof Number number) return BigDecimal.valueOf(number.doubleValue());
        return new BigDecimal(String.valueOf(value));
    }

    private BigDecimal nullableBigDecimalValue(Object value) {
        if (value == null) return null;
        return bigDecimalValue(value);
    }

    private Boolean booleanValue(Object value) {
        if (value == null) return false;
        if (value instanceof Boolean bool) return bool;
        return Boolean.parseBoolean(String.valueOf(value));
    }

    private OffsetDateTime offsetDateTimeValue(Object value) {
        if (value == null) return null;

        if (value instanceof OffsetDateTime offsetDateTime) {
            return offsetDateTime;
        }

        if (value instanceof Timestamp timestamp) {
            return timestamp.toInstant()
                    .atZone(ZoneId.systemDefault())
                    .toOffsetDateTime();
        }

        return null;
    }

    private record PromotionData(
            String name,
            String type,
            BigDecimal value,
            BigDecimal minOrderAmount,
            BigDecimal maxDiscount,
            String description,
            OffsetDateTime startDate,
            OffsetDateTime endDate,
            Integer usageLimit,
            Boolean isActive
    ) {
    }

    public record AdminPromotionResponse(
            String id,
            String name,
            String type,
            BigDecimal value,
            BigDecimal minOrderAmount,
            BigDecimal maxDiscount,
            String description,
            OffsetDateTime startDate,
            OffsetDateTime endDate,
            Integer usageLimit,
            Integer usedCount,
            Boolean isActive,
            OffsetDateTime createdAt,
            OffsetDateTime updatedAt
    ) {
    }

    public record DeletePromotionResponse(
            String id,
            String message
    ) {
    }
}