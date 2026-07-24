package com.lemondesteak.controller;

import com.lemondesteak.dto.AdminTableCreateRequest;
import com.lemondesteak.dto.AdminTableUpdateRequest;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.sql.Timestamp;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/tables")
@RequiredArgsConstructor
public class AdminTableController {

    private static final Set<String> ALLOWED_STATUS = Set.of(
            "EMPTY",
            "USING",
            "RESERVED",
            "CLEANING",
            "MAINTENANCE"
    );

    private final EntityManager entityManager;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public List<AdminTableResponse> getTables() {
        List<Object[]> rows = entityManager
                .createNativeQuery("""
                        select
                            t.id,
                            t."tableNumber",
                            t.capacity,
                            t.status,
                            t."isActive",
                            t."createdAt",
                            t."updatedAt"
                        from tables t
                        where t."isActive" = true
                        order by
                            regexp_replace(t."tableNumber", '\\D', '', 'g')::int nulls last,
                            t."tableNumber"
                        """)
                .getResultList();

        return rows.stream()
                .map(this::toResponse)
                .toList();
    }

    @PostMapping
    @Transactional
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public AdminTableResponse createTable(@RequestBody AdminTableCreateRequest request) {
        TableData data = validateData(
                request.tableNumber(),
                request.capacity(),
                request.status(),
                request.isActive(),
                null
        );

        String id = UUID.randomUUID().toString();

        entityManager
                .createNativeQuery("""
                        insert into tables (
                            id,
                            "tableNumber",
                            capacity,
                            status,
                            "isActive",
                            "createdAt",
                            "updatedAt"
                        )
                        values (
                            :id,
                            :tableNumber,
                            :capacity,
                            :status,
                            :isActive,
                            now(),
                            now()
                        )
                        """)
                .setParameter("id", id)
                .setParameter("tableNumber", data.tableNumber())
                .setParameter("capacity", data.capacity())
                .setParameter("status", data.status())
                .setParameter("isActive", data.isActive())
                .executeUpdate();

        return findTableById(id);
    }

    @PutMapping("/{id}")
    @Transactional
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public AdminTableResponse updateTable(
            @PathVariable String id,
            @RequestBody AdminTableUpdateRequest request
    ) {
        AdminTableResponse current = findTableById(id);

        TableData data = validateData(
                request.tableNumber(),
                request.capacity(),
                request.status(),
                request.isActive(),
                id
        );

        if ("USING".equals(current.status()) && "EMPTY".equals(data.status())) {
            boolean hasActiveOrder = hasActiveOrder(id);

            if (hasActiveOrder) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Không thể chuyển bàn đang dùng về Trống khi còn đơn chưa hoàn tất"
                );
            }
        }

        entityManager
                .createNativeQuery("""
                        update tables
                        set "tableNumber" = :tableNumber,
                            capacity = :capacity,
                            status = :status,
                            "isActive" = :isActive,
                            "updatedAt" = now()
                        where id = :id
                        """)
                .setParameter("id", id)
                .setParameter("tableNumber", data.tableNumber())
                .setParameter("capacity", data.capacity())
                .setParameter("status", data.status())
                .setParameter("isActive", data.isActive())
                .executeUpdate();

        return findTableById(id);
    }

    @DeleteMapping("/{id}")
    @Transactional
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public DeleteTableResponse deleteTable(@PathVariable String id) {
        AdminTableResponse table = findTableById(id);

        if (!"EMPTY".equals(table.status())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Chỉ được xóa bàn đang ở trạng thái Trống"
            );
        }

        if (hasActiveOrder(id)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Không thể xóa bàn đang có đơn chưa hoàn tất"
            );
        }

        entityManager
                .createNativeQuery("""
                        update tables
                        set "isActive" = false,
                            "updatedAt" = now()
                        where id = :id
                        """)
                .setParameter("id", id)
                .executeUpdate();

        return new DeleteTableResponse(id, "Đã xóa bàn khỏi danh sách");
    }

    private AdminTableResponse findTableById(String id) {
        List<Object[]> rows = entityManager
                .createNativeQuery("""
                        select
                            t.id,
                            t."tableNumber",
                            t.capacity,
                            t.status,
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
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Không tìm thấy bàn"
            );
        }

        return toResponse(rows.get(0));
    }

    private TableData validateData(
            String rawTableNumber,
            Integer rawCapacity,
            String rawStatus,
            Boolean rawIsActive,
            String updatingId
    ) {
        String tableNumber = cleanText(rawTableNumber);

        if (tableNumber.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Số bàn không được bỏ trống"
            );
        }

        if (tableNumber.length() > 10) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Số bàn tối đa 10 ký tự"
            );
        }

        ensureTableNumberUnique(tableNumber, updatingId);

        Integer capacity = rawCapacity == null ? 0 : rawCapacity;

        if (capacity <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Sức chứa phải là số nguyên lớn hơn 0"
            );
        }

        if (capacity > 999999999) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Sức chứa không hợp lệ"
            );
        }

        String status = cleanText(rawStatus).toUpperCase();

        if (status.isBlank()) {
            status = "EMPTY";
        }

        if (!ALLOWED_STATUS.contains(status)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Trạng thái bàn không hợp lệ"
            );
        }

        Boolean isActive = rawIsActive == null || rawIsActive;

        return new TableData(
                tableNumber,
                capacity,
                status,
                isActive
        );
    }

    private void ensureTableNumberUnique(String tableNumber, String updatingId) {
        Number count;

        if (updatingId == null) {
            count = (Number) entityManager
                    .createNativeQuery("""
                            select count(*)
                            from tables
                            where lower("tableNumber") = lower(:tableNumber)
                              and "isActive" = true
                            """)
                    .setParameter("tableNumber", tableNumber)
                    .getSingleResult();
        } else {
            count = (Number) entityManager
                    .createNativeQuery("""
                            select count(*)
                            from tables
                            where lower("tableNumber") = lower(:tableNumber)
                              and id <> :id
                              and "isActive" = true
                            """)
                    .setParameter("tableNumber", tableNumber)
                    .setParameter("id", updatingId)
                    .getSingleResult();
        }

        if (count.longValue() > 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Số bàn đã tồn tại"
            );
        }
    }

    private boolean hasActiveOrder(String tableId) {
        Number count = (Number) entityManager
                .createNativeQuery("""
                        select count(*)
                        from orders
                        where "tableId" = :tableId
                          and upper("orderStatus") not in (
                              'COMPLETED',
                              'CANCELLED',
                              'PAID',
                              'DONE'
                          )
                        """)
                .setParameter("tableId", tableId)
                .getSingleResult();

        return count.longValue() > 0;
    }

    private AdminTableResponse toResponse(Object[] row) {
        return new AdminTableResponse(
                stringValue(row[0]),
                stringValue(row[1]),
                intValue(row[2]),
                stringValue(row[3]),
                booleanValue(row[4]),
                offsetDateTimeValue(row[5]),
                offsetDateTimeValue(row[6])
        );
    }

    private String cleanText(String value) {
        return value == null ? "" : value.trim();
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

    private record TableData(
            String tableNumber,
            Integer capacity,
            String status,
            Boolean isActive
    ) {
    }

    public record AdminTableResponse(
            String id,
            String tableNumber,
            Integer capacity,
            String status,
            Boolean isActive,
            OffsetDateTime createdAt,
            OffsetDateTime updatedAt
    ) {
    }

    public record DeleteTableResponse(
            String id,
            String message
    ) {
    }
}