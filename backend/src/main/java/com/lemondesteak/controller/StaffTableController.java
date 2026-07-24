package com.lemondesteak.controller;

import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.sql.Timestamp;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;

@RestController
@RequestMapping("/api/staff/tables")
@RequiredArgsConstructor
public class StaffTableController {

    private final EntityManager entityManager;

    @GetMapping
    public List<StaffTableResponse> getTables() {
        List<Object[]> rows = entityManager
                .createNativeQuery("""
                        select
                            t.id,
                            t."tableNumber",
                            t.capacity,
                            t.status::text,
                            t."isActive",
                            t."createdAt",
                            t."updatedAt"
                        from tables t
                        where t."isActive" = true
                        order by
                            nullif(regexp_replace(t."tableNumber", '\\D', '', 'g'), '')::int nulls last,
                            t."tableNumber"
                        """)
                .getResultList();

        return rows.stream().map(this::toResponse).toList();
    }

    @GetMapping("/{id}")
    public StaffTableResponse getTableById(@PathVariable String id) {
        return findById(id);
    }

    @PutMapping("/{id}/status")
    @Transactional
    public StaffTableResponse updateStatus(
            @PathVariable String id,
            @RequestBody UpdateTableStatusRequest request
    ) {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Không thể tự đổi trạng thái bàn. Trạng thái bàn được hệ thống cập nhật theo đơn hàng/thanh toán."
        );
    }

    @PatchMapping("/{id}/status")
    @Transactional
    public StaffTableResponse patchStatus(
            @PathVariable String id,
            @RequestBody UpdateTableStatusRequest request
    ) {
        return updateStatus(id, request);
    }

    private StaffTableResponse findById(String id) {
        List<Object[]> rows = entityManager
                .createNativeQuery("""
                        select
                            t.id,
                            t."tableNumber",
                            t.capacity,
                            t.status::text,
                            t."isActive",
                            t."createdAt",
                            t."updatedAt"
                        from tables t
                        where t.id = :id
                        limit 1
                        """)
                .setParameter("id", id)
                .getResultList();

        if (rows.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy bàn");
        }

        return toResponse(rows.get(0));
    }

    private StaffTableResponse toResponse(Object[] row) {
        return new StaffTableResponse(
                stringValue(row[0]),
                stringValue(row[1]),
                intValue(row[2]),
                normalizeStatus(stringValue(row[3])),
                booleanValue(row[4]),
                offsetDateTimeValue(row[5]),
                offsetDateTimeValue(row[6])
        );
    }

    private String normalizeStatus(String status) {
        String value = status == null ? "" : status.trim().toUpperCase();

        if (
                value.equals("EMPTY") ||
                value.equals("TRONG") ||
                value.equals("FREE") ||
                value.equals("AVAILABLE")
        ) {
            return "EMPTY";
        }

        if (
                value.equals("USING") ||
                value.equals("OCCUPIED") ||
                value.equals("DINING") ||
                value.equals("IN_USE") ||
                value.equals("DANG_DUNG_BUA")
        ) {
            return "USING";
        }

        if (
                value.equals("REQUEST_PAYMENT") ||
                value.equals("WAITING_PAYMENT") ||
                value.equals("PAYMENT_REQUESTED") ||
                value.equals("YEU_CAU_THANH_TOAN")
        ) {
            return "REQUEST_PAYMENT";
        }

        return "EMPTY";
    }

    private String stringValue(Object value) {
        return value == null ? "" : String.valueOf(value);
    }

    private Integer intValue(Object value) {
        if (value == null) return 0;
        if (value instanceof Number number) return number.intValue();
        return Integer.parseInt(String.valueOf(value));
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

    public record UpdateTableStatusRequest(
            String status
    ) {
    }

    public record StaffTableResponse(
            String id,
            String tableNumber,
            Integer capacity,
            String status,
            Boolean isActive,
            OffsetDateTime createdAt,
            OffsetDateTime updatedAt
    ) {
    }
}