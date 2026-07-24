package com.lemondesteak.controller;

import com.lemondesteak.dto.OrderDetailStatusUpdateRequest;
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
import java.util.*;

@RestController
@RequestMapping("/api/staff/order-tracking")
@RequiredArgsConstructor
public class StaffOrderTrackingController {

    private static final Set<String> ALLOWED_DETAIL_STATUSES = Set.of(
            "WAITING",
            "PREPARING",
            "DONE",
            "SERVED"
    );

    private final EntityManager entityManager;

    @GetMapping("/by-table")
    @PreAuthorize("hasAnyAuthority('STAFF', 'ADMIN', 'ROLE_STAFF', 'ROLE_ADMIN')")
    public List<StaffOrderByTableResponse> getOrdersByTable() {
        List<Object[]> rows = entityManager
                .createNativeQuery("""
                        select
                            o.id as order_id,
                            o."orderNumber" as order_number,
                            o."createdAt" as created_at,
                            o."orderStatus" as order_status,
                            t.id as table_id,
                            t."tableNumber" as table_number,
                            od.id as detail_id,
                            od.quantity as quantity,
                            od.price as price,
                            od.status::text as detail_status,
                            coalesce(i.name, c.name) as food_name,
                            coalesce(i.image, c.image) as food_image,
                            case
                                when od."comboId" is not null then 'combo'
                                else 'item'
                            end as food_type
                        from orders o
                        join tables t on t.id = o."tableId"
                        join orderdetails od on od."orderId" = o.id
                        left join items i on i.id = od."itemId"
                        left join combos c on c.id = od."comboId"
                        where o."orderStatus" not in ('COMPLETED', 'CANCELLED', 'PAID')
                        order by t."tableNumber", o."createdAt", o."orderNumber", od.id
                        """)
                .getResultList();

        Map<String, StaffOrderByTableResponse> orderMap = new LinkedHashMap<>();

        for (Object[] row : rows) {
            String orderId = stringValue(row[0]);

            StaffOrderByTableResponse order = orderMap.computeIfAbsent(
                    orderId,
                    id -> new StaffOrderByTableResponse(
                            orderId,
                            intValue(row[1]),
                            offsetDateTimeValue(row[2]),
                            stringValue(row[3]),
                            stringValue(row[4]),
                            stringValue(row[5]),
                            new ArrayList<>()
                    )
            );

            order.items().add(new StaffOrderFoodLineResponse(
                    stringValue(row[6]),
                    intValue(row[7]),
                    bigDecimalValue(row[8]),
                    stringValue(row[9]),
                    stringValue(row[10]),
                    stringValue(row[11]),
                    stringValue(row[12])
            ));
        }

        return new ArrayList<>(orderMap.values());
    }

    @GetMapping("/by-food")
    @PreAuthorize("hasAnyAuthority('STAFF', 'ADMIN', 'ROLE_STAFF', 'ROLE_ADMIN')")
    public List<StaffFoodOrderLineResponse> getFoodsOrdered() {
        List<Object[]> rows = entityManager
                .createNativeQuery("""
                        select
                            od.id as detail_id,
                            o.id as order_id,
                            o."orderNumber" as order_number,
                            o."createdAt" as created_at,
                            t.id as table_id,
                            t."tableNumber" as table_number,
                            od.quantity as quantity,
                            od.price as price,
                            od.status::text as detail_status,
                            coalesce(i.name, c.name) as food_name,
                            coalesce(i.image, c.image) as food_image,
                            case
                                when od."comboId" is not null then 'combo'
                                else 'item'
                            end as food_type
                        from orderdetails od
                        join orders o on o.id = od."orderId"
                        join tables t on t.id = o."tableId"
                        left join items i on i.id = od."itemId"
                        left join combos c on c.id = od."comboId"
                        where o."orderStatus" not in ('COMPLETED', 'CANCELLED', 'PAID')
                        order by
                            case od.status::text
                                when 'WAITING' then 1
                                when 'PREPARING' then 2
                                when 'DONE' then 3
                                when 'SERVED' then 4
                                else 5
                            end,
                            o."createdAt",
                            o."orderNumber",
                            od.id
                        """)
                .getResultList();

        return rows.stream()
                .map(this::toFoodOrderLine)
                .toList();
    }

    @PatchMapping("/details/{detailId}/status")
    @Transactional
    @PreAuthorize("hasAnyAuthority('STAFF', 'ADMIN', 'ROLE_STAFF', 'ROLE_ADMIN')")
    public StaffFoodOrderLineResponse updateDetailStatus(
            @PathVariable String detailId,
            @RequestBody OrderDetailStatusUpdateRequest request
    ) {
        Object[] currentRow = findFoodOrderLineRow(detailId);

        if (currentRow == null) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Không tìm thấy món trong đơn hàng"
            );
        }

        String currentStatus = stringValue(currentRow[8]);
        String nextStatus = resolveNextStatus(currentStatus, request);

        if (!ALLOWED_DETAIL_STATUSES.contains(nextStatus)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Trạng thái món không hợp lệ"
            );
        }

        entityManager
                .createNativeQuery("""
                        update orderdetails
                        set status = cast(:status as "OrderDetailStatus")
                        where id = :detailId
                        """)
                .setParameter("status", nextStatus)
                .setParameter("detailId", detailId)
                .executeUpdate();

        Object[] updatedRow = findFoodOrderLineRow(detailId);

        return toFoodOrderLine(updatedRow);
    }

    private Object[] findFoodOrderLineRow(String detailId) {
        List<Object[]> rows = entityManager
                .createNativeQuery("""
                        select
                            od.id as detail_id,
                            o.id as order_id,
                            o."orderNumber" as order_number,
                            o."createdAt" as created_at,
                            t.id as table_id,
                            t."tableNumber" as table_number,
                            od.quantity as quantity,
                            od.price as price,
                            od.status::text as detail_status,
                            coalesce(i.name, c.name) as food_name,
                            coalesce(i.image, c.image) as food_image,
                            case
                                when od."comboId" is not null then 'combo'
                                else 'item'
                            end as food_type
                        from orderdetails od
                        join orders o on o.id = od."orderId"
                        join tables t on t.id = o."tableId"
                        left join items i on i.id = od."itemId"
                        left join combos c on c.id = od."comboId"
                        where od.id = :detailId
                        """)
                .setParameter("detailId", detailId)
                .getResultList();

        return rows.isEmpty() ? null : rows.get(0);
    }

    private String resolveNextStatus(
            String currentStatus,
            OrderDetailStatusUpdateRequest request
    ) {
        String action = request.action() == null
                ? ""
                : request.action().trim().toUpperCase();

        if ("NEXT".equals(action)) {
            return switch (currentStatus) {
                case "WAITING" -> "PREPARING";
                case "PREPARING" -> "DONE";
                case "DONE" -> "SERVED";
                default -> currentStatus;
            };
        }

        if (request.status() == null || request.status().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Thiếu trạng thái món ăn"
            );
        }

        return request.status().trim().toUpperCase();
    }

    private StaffFoodOrderLineResponse toFoodOrderLine(Object[] row) {
        return new StaffFoodOrderLineResponse(
                stringValue(row[0]),
                stringValue(row[1]),
                intValue(row[2]),
                offsetDateTimeValue(row[3]),
                stringValue(row[4]),
                stringValue(row[5]),
                intValue(row[6]),
                bigDecimalValue(row[7]),
                stringValue(row[8]),
                stringValue(row[9]),
                stringValue(row[10]),
                stringValue(row[11])
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

    private BigDecimal bigDecimalValue(Object value) {
        if (value == null) return BigDecimal.ZERO;
        if (value instanceof BigDecimal decimal) return decimal;
        if (value instanceof Number number) return BigDecimal.valueOf(number.doubleValue());
        return new BigDecimal(String.valueOf(value));
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

    public record StaffOrderByTableResponse(
            String orderId,
            Integer orderNumber,
            OffsetDateTime createdAt,
            String orderStatus,
            String tableId,
            String tableNumber,
            List<StaffOrderFoodLineResponse> items
    ) {
    }

    public record StaffOrderFoodLineResponse(
            String detailId,
            Integer quantity,
            BigDecimal price,
            String status,
            String foodName,
            String foodImage,
            String foodType
    ) {
    }

    public record StaffFoodOrderLineResponse(
            String detailId,
            String orderId,
            Integer orderNumber,
            OffsetDateTime createdAt,
            String tableId,
            String tableNumber,
            Integer quantity,
            BigDecimal price,
            String status,
            String foodName,
            String foodImage,
            String foodType
    ) {
    }
}