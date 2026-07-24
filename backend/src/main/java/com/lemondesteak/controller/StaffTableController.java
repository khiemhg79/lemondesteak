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
    @Transactional
    public List<StaffTableResponse> getTables() {
        syncTableStatus();

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
    @Transactional
    public StaffTableResponse getTableById(@PathVariable String id) {
        syncTableStatus();
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

    private void syncTableStatus() {
        entityManager
                .createNativeQuery("""
                        update tables t
                        set status = 'EMPTY',
                            "updatedAt" = now()
                        where t."isActive" = true
                          and t.status <> 'EMPTY'
                          and not exists (
                              select 1
                              from orders o
                              where o."tableId" = t.id
                                and coalesce(o."orderStatus"::text, '') not in ('PAID', 'CANCELLED', 'COMPLETED')
                          )
                        """)
                .executeUpdate();

        entityManager
                .createNativeQuery("""
                        update tables t
                        set status = 'REQUEST_PAYMENT',
                            "updatedAt" = now()
                        where t."isActive" = true
                          and exists (
                              select 1
                              from orders o
                              where o."tableId" = t.id
                                and coalesce(o."orderStatus"::text, '') = 'REQUEST_PAYMENT'
                          )
                        """)
                .executeUpdate();

        entityManager
                .createNativeQuery("""
                        update tables t
                        set status = 'USING',
                            "updatedAt" = now()
                        where t."isActive" = true
                          and t.status <> 'REQUEST_PAYMENT'
                          and exists (
                              select 1
                              from orders o
                              where o."tableId" = t.id
                                and coalesce(o."orderStatus"::text, '') not in ('PAID', 'CANCELLED', 'COMPLETED', 'REQUEST_PAYMENT')
                          )
                          and not exists (
                              select 1
                              from orders o
                              where o."tableId" = t.id
                                and coalesce(o."orderStatus"::text, '') = 'REQUEST_PAYMENT'
                          )
                        """)
                .executeUpdate();
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
                value.equals("TRỐNG") ||
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
                value.equals("ĐANG DÙNG BỮA") ||
                value.equals("DANG_DUNG_BUA")
        ) {
            return "USING";
        }

        if (
                value.equals("REQUEST_PAYMENT") ||
                value.equals("WAITING_PAYMENT") ||
                value.equals("PAYMENT_REQUESTED") ||
                value.equals("YÊU CẦU THANH TOÁN") ||
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
        if (value == null) {
            return 0;
        }

        if (value instanceof Number number) {
            return number.intValue();
        }

        String text = String.valueOf(value).trim();

        if (text.isBlank()) {
            return 0;
        }

        try {
            return Integer.parseInt(text);
        } catch (NumberFormatException ex) {
            return 0;
        }
    }

    private Boolean booleanValue(Object value) {
        if (value == null) {
            return false;
        }

        if (value instanceof Boolean bool) {
            return bool;
        }

        return Boolean.parseBoolean(String.valueOf(value));
    }

    private OffsetDateTime offsetDateTimeValue(Object value) {
        if (value == null) {
            return null;
        }

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