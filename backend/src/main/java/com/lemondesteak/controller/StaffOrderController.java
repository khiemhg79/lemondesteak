package com.lemondesteak.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.*;

@RestController
@RequestMapping("/api/staff")
@RequiredArgsConstructor
public class StaffOrderController {

    private final JdbcTemplate jdbcTemplate;

    @GetMapping("/orders")
    @PreAuthorize("hasAnyAuthority('STAFF', 'ROLE_STAFF', 'ADMIN', 'ROLE_ADMIN')")
    public List<StaffOrderResponse> getOrdersByTable() {
        String sql = """
                select
                    o.id as order_id,
                    o."orderNumber" as order_number,
                    o."createdAt" as order_created_at,
                    o."orderStatus"::text as order_status,
                    o."tableId" as table_id,

                    t."tableNumber" as table_number,
                    t.status as table_status,

                    od.id as detail_id,
                    od.quantity as detail_quantity,
                    od.price as detail_price,
                    od.status::text as detail_status,

                    i.id as item_id,
                    i.name as item_name,
                    i.image as item_image,

                    c.id as combo_id,
                    c.name as combo_name,
                    c.image as combo_image

                from orders o
                left join tables t on t.id = o."tableId"
                left join orderdetails od on od."orderId" = o.id
                left join items i on i.id = od."itemId"
                left join combos c on c.id = od."comboId"
                where coalesce(o."orderStatus"::text, 'PENDING') not in ('CANCELLED', 'COMPLETED', 'PAID')
                  and coalesce(t.status, 'EMPTY') <> 'EMPTY'
                order by o."createdAt" asc, o."orderNumber" asc
                """;

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql);
        Map<String, StaffOrderResponse> orderMap = new LinkedHashMap<>();

        for (Map<String, Object> row : rows) {
            String orderId = stringValue(row.get("order_id"));

            if (orderId == null || orderId.isBlank()) {
                continue;
            }

            StaffOrderResponse order = orderMap.computeIfAbsent(orderId, id -> {
                StaffOrderResponse response = new StaffOrderResponse();

                response.setId(orderId);
                response.setOrderNumber(intValue(row.get("order_number")));
                response.setCreatedAt(stringValue(row.get("order_created_at")));
                response.setOrderStatus(normalizeOrderStatus(stringValue(row.get("order_status"))));
                response.setTableId(stringValue(row.get("table_id")));

                String tableNumber = stringValue(row.get("table_number"));
                if (tableNumber == null || tableNumber.isBlank()) {
                    tableNumber = "N/A";
                }

                response.setTableNumber(tableNumber);
                response.setDetails(new ArrayList<>());

                return response;
            });

            String detailId = stringValue(row.get("detail_id"));

            if (detailId == null || detailId.isBlank()) {
                continue;
            }

            boolean isCombo = row.get("combo_id") != null;

            StaffOrderDetailResponse detail = new StaffOrderDetailResponse();

            detail.setId(detailId);
            detail.setType(isCombo ? "COMBO" : "ITEM");
            detail.setFoodId(isCombo ? stringValue(row.get("combo_id")) : stringValue(row.get("item_id")));
            detail.setFoodName(isCombo ? stringValue(row.get("combo_name")) : stringValue(row.get("item_name")));
            detail.setImage(isCombo ? stringValue(row.get("combo_image")) : stringValue(row.get("item_image")));
            detail.setQuantity(intValue(row.get("detail_quantity")));
            detail.setPrice(bigDecimalValue(row.get("detail_price")));
            detail.setStatus(normalizeStatus(stringValue(row.get("detail_status"))));

            order.getDetails().add(detail);
        }

        return new ArrayList<>(orderMap.values());
    }

    @GetMapping("/order-items")
    @PreAuthorize("hasAnyAuthority('STAFF', 'ROLE_STAFF', 'ADMIN', 'ROLE_ADMIN')")
    public List<StaffOrderItemResponse> getOrdersByItem() {
        List<StaffOrderResponse> orders = getOrdersByTable();
        List<StaffOrderItemResponse> items = new ArrayList<>();

        for (StaffOrderResponse order : orders) {
            for (StaffOrderDetailResponse detail : order.getDetails()) {
                StaffOrderItemResponse item = new StaffOrderItemResponse();

                item.setOrderId(order.getId());
                item.setOrderNumber(order.getOrderNumber());
                item.setCreatedAt(order.getCreatedAt());
                item.setTableId(order.getTableId());
                item.setTableNumber(order.getTableNumber());

                item.setDetailId(detail.getId());
                item.setType(detail.getType());
                item.setFoodId(detail.getFoodId());
                item.setFoodName(detail.getFoodName());
                item.setImage(detail.getImage());
                item.setQuantity(detail.getQuantity());
                item.setPrice(detail.getPrice());
                item.setStatus(detail.getStatus());

                items.add(item);
            }
        }

        items.sort(
                Comparator
                        .comparing(StaffOrderItemResponse::getStatus, Comparator.nullsLast(String::compareToIgnoreCase))
                        .thenComparing(StaffOrderItemResponse::getCreatedAt, Comparator.nullsLast(String::compareToIgnoreCase))
        );

        return items;
    }

    @PatchMapping("/order-details/{detailId}/status")
    @Transactional
    @PreAuthorize("hasAnyAuthority('STAFF', 'ROLE_STAFF', 'ADMIN', 'ROLE_ADMIN')")
    public Map<String, Object> updateOrderDetailStatus(
            @PathVariable String detailId,
            @RequestBody UpdateOrderDetailStatusRequest request
    ) {
        String status = normalizeStatus(request.getStatus());

        int updated = jdbcTemplate.update(
                """
                update orderdetails
                set status = ?::"OrderDetailStatus"
                where id = ?
                """,
                status,
                detailId
        );

        if (updated == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy món trong đơn hàng.");
        }

        updateOrderIfAllServed(detailId);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("detailId", detailId);
        response.put("status", status);

        return response;
    }

    @PatchMapping({
            "/orders/{orderId}/request-payment",
            "/orders/{orderId}/payment-request"
    })
    @Transactional
    @PreAuthorize("hasAnyAuthority('STAFF', 'ROLE_STAFF', 'ADMIN', 'ROLE_ADMIN')")
    public Map<String, Object> requestPayment(@PathVariable String orderId) {
        Map<String, Object> order = findOrder(orderId);
        String tableId = stringValue(order.get("tableId"));

        jdbcTemplate.update(
                """
                update orders
                set "orderStatus" = 'REQUEST_PAYMENT',
                    "updatedAt" = now()
                where id = ?
                """,
                orderId
        );

        if (tableId != null && !tableId.isBlank()) {
            setTableStatus(tableId, "REQUEST_PAYMENT");
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("orderId", orderId);
        response.put("tableId", tableId);
        response.put("orderStatus", "REQUEST_PAYMENT");
        response.put("tableStatus", "REQUEST_PAYMENT");
        response.put("message", "Đã chuyển bàn sang trạng thái yêu cầu thanh toán.");

        return response;
    }

    private void updateOrderIfAllServed(String detailId) {
        String orderId = jdbcTemplate.queryForObject(
                """
                select "orderId"
                from orderdetails
                where id = ?
                """,
                String.class,
                detailId
        );

        if (orderId == null || orderId.isBlank()) {
            return;
        }

        Integer notServedCount = jdbcTemplate.queryForObject(
                """
                select count(*)
                from orderdetails
                where "orderId" = ?
                  and status::text <> 'SERVED'
                """,
                Integer.class,
                orderId
        );

        if (notServedCount != null && notServedCount == 0) {
            jdbcTemplate.update(
                    """
                    update orders
                    set "orderStatus" = 'SERVED',
                        "updatedAt" = now()
                    where id = ?
                    """,
                    orderId
            );
        }
    }

    private Map<String, Object> findOrder(String orderId) {
        try {
            return jdbcTemplate.queryForMap(
                    """
                    select
                        id,
                        "orderNumber",
                        "orderStatus"::text,
                        "tableId",
                        "totalAmount"
                    from orders
                    where id = ?
                    """,
                    orderId
            );
        } catch (EmptyResultDataAccessException ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn hàng.");
        }
    }

    private void setTableStatus(String tableId, String status) {
        jdbcTemplate.update(
                """
                update tables
                set status = ?,
                    "updatedAt" = now()
                where id = ?
                """,
                status,
                tableId
        );
    }

    private String normalizeOrderStatus(String status) {
        if (status == null || status.isBlank()) {
            return "PENDING";
        }

        return status.trim().toUpperCase();
    }

    private String normalizeStatus(String status) {
        if (status == null || status.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Trạng thái không hợp lệ.");
        }

        String value = status.trim().toUpperCase();

        List<String> allowed = List.of("WAITING", "COOKING", "DONE", "SERVED");

        if (!allowed.contains(value)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Trạng thái không hợp lệ: " + status);
        }

        return value;
    }

    private String stringValue(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private Integer intValue(Object value) {
        if (value == null) {
            return 0;
        }

        if (value instanceof Number number) {
            return number.intValue();
        }

        return Integer.parseInt(String.valueOf(value));
    }

    private BigDecimal bigDecimalValue(Object value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }

        if (value instanceof BigDecimal decimal) {
            return decimal;
        }

        if (value instanceof Number number) {
            return BigDecimal.valueOf(number.doubleValue());
        }

        return new BigDecimal(String.valueOf(value));
    }

    public static class UpdateOrderDetailStatusRequest {
        private String status;

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }
    }

    public static class StaffOrderResponse {
        private String id;
        private Integer orderNumber;
        private String createdAt;
        private String orderStatus;
        private String tableId;
        private String tableNumber;
        private List<StaffOrderDetailResponse> details;

        public String getId() {
            return id;
        }

        public void setId(String id) {
            this.id = id;
        }

        public Integer getOrderNumber() {
            return orderNumber;
        }

        public void setOrderNumber(Integer orderNumber) {
            this.orderNumber = orderNumber;
        }

        public String getCreatedAt() {
            return createdAt;
        }

        public void setCreatedAt(String createdAt) {
            this.createdAt = createdAt;
        }

        public String getOrderStatus() {
            return orderStatus;
        }

        public void setOrderStatus(String orderStatus) {
            this.orderStatus = orderStatus;
        }

        public String getTableId() {
            return tableId;
        }

        public void setTableId(String tableId) {
            this.tableId = tableId;
        }

        public String getTableNumber() {
            return tableNumber;
        }

        public void setTableNumber(String tableNumber) {
            this.tableNumber = tableNumber;
        }

        public List<StaffOrderDetailResponse> getDetails() {
            return details;
        }

        public void setDetails(List<StaffOrderDetailResponse> details) {
            this.details = details;
        }
    }

    public static class StaffOrderDetailResponse {
        private String id;
        private String type;
        private String foodId;
        private String foodName;
        private String image;
        private Integer quantity;
        private BigDecimal price;
        private String status;

        public String getId() {
            return id;
        }

        public void setId(String id) {
            this.id = id;
        }

        public String getType() {
            return type;
        }

        public void setType(String type) {
            this.type = type;
        }

        public String getFoodId() {
            return foodId;
        }

        public void setFoodId(String foodId) {
            this.foodId = foodId;
        }

        public String getFoodName() {
            return foodName;
        }

        public void setFoodName(String foodName) {
            this.foodName = foodName;
        }

        public String getImage() {
            return image;
        }

        public void setImage(String image) {
            this.image = image;
        }

        public Integer getQuantity() {
            return quantity;
        }

        public void setQuantity(Integer quantity) {
            this.quantity = quantity;
        }

        public BigDecimal getPrice() {
            return price;
        }

        public void setPrice(BigDecimal price) {
            this.price = price;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }
    }

    public static class StaffOrderItemResponse {
        private String orderId;
        private Integer orderNumber;
        private String createdAt;
        private String tableId;
        private String tableNumber;

        private String detailId;
        private String type;
        private String foodId;
        private String foodName;
        private String image;
        private Integer quantity;
        private BigDecimal price;
        private String status;

        public String getOrderId() {
            return orderId;
        }

        public void setOrderId(String orderId) {
            this.orderId = orderId;
        }

        public Integer getOrderNumber() {
            return orderNumber;
        }

        public void setOrderNumber(Integer orderNumber) {
            this.orderNumber = orderNumber;
        }

        public String getCreatedAt() {
            return createdAt;
        }

        public void setCreatedAt(String createdAt) {
            this.createdAt = createdAt;
        }

        public String getTableId() {
            return tableId;
        }

        public void setTableId(String tableId) {
            this.tableId = tableId;
        }

        public String getTableNumber() {
            return tableNumber;
        }

        public void setTableNumber(String tableNumber) {
            this.tableNumber = tableNumber;
        }

        public String getDetailId() {
            return detailId;
        }

        public void setDetailId(String detailId) {
            this.detailId = detailId;
        }

        public String getType() {
            return type;
        }

        public void setType(String type) {
            this.type = type;
        }

        public String getFoodId() {
            return foodId;
        }

        public void setFoodId(String foodId) {
            this.foodId = foodId;
        }

        public String getFoodName() {
            return foodName;
        }

        public void setFoodName(String foodName) {
            this.foodName = foodName;
        }

        public String getImage() {
            return image;
        }

        public void setImage(String image) {
            this.image = image;
        }

        public Integer getQuantity() {
            return quantity;
        }

        public void setQuantity(Integer quantity) {
            this.quantity = quantity;
        }

        public BigDecimal getPrice() {
            return price;
        }

        public void setPrice(BigDecimal price) {
            this.price = price;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }
    }
}