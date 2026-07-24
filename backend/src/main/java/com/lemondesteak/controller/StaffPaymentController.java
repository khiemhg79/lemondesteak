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
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/staff")
@RequiredArgsConstructor
public class StaffPaymentController {

    private final JdbcTemplate jdbcTemplate;

    @GetMapping("/payments")
    @PreAuthorize("hasAnyAuthority('STAFF', 'ROLE_STAFF', 'ADMIN', 'ROLE_ADMIN')")
    public List<Map<String, Object>> getPayments(
            @RequestParam(defaultValue = "PENDING") String status
    ) {
        String normalized = status == null ? "PENDING" : status.trim().toUpperCase();

        String whereSql;

        if ("PAID".equals(normalized)) {
            whereSql = """
                    where coalesce(o.\"orderStatus\"::text, '') = 'PAID'
                    """;
        } else {
            whereSql = """
                    where coalesce(o.\"orderStatus\"::text, '') = 'REQUEST_PAYMENT'
                    """;
        }

        String sql = """
                select
                    o.id as order_id,
                    o.\"orderNumber\" as order_number,
                    o.\"createdAt\" as created_at,
                    o.\"updatedAt\" as updated_at,
                    o.\"orderStatus\"::text as order_status,
                    o.\"tableId\" as table_id,
                    o.\"subTotal\" as sub_total,
                    o.\"taxAmount\" as tax_amount,
                    o.\"serviceCharge\" as service_charge,
                    o.\"discountAmount\" as discount_amount,
                    o.\"totalAmount\" as total_amount,
                    o.\"promoCode\" as promo_code,
                    t.\"tableNumber\" as table_number,
                    t.status as table_status,
                    p.name as promotion_name
                from orders o
                left join tables t on t.id = o.\"tableId\"
                left join promotions p on p.id = o.\"promoCode\"
                """ + whereSql + """
                order by o.\"updatedAt\" desc, o.\"createdAt\" desc
                limit 100
                """;

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql);
        List<Map<String, Object>> result = new ArrayList<>();

        for (Map<String, Object> row : rows) {
            String orderId = stringValue(row.get("order_id"));

            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", orderId);
            item.put("orderId", orderId);
            item.put("orderNumber", row.get("order_number"));
            item.put("createdAt", stringValue(row.get("created_at")));
            item.put("updatedAt", stringValue(row.get("updated_at")));
            item.put("orderStatus", stringValue(row.get("order_status")));
            item.put("tableId", stringValue(row.get("table_id")));
            item.put("tableNumber", stringValue(row.get("table_number")));
            item.put("tableStatus", stringValue(row.get("table_status")));
            item.put("subTotal", bigDecimalValue(row.get("sub_total")));
            item.put("taxAmount", bigDecimalValue(row.get("tax_amount")));
            item.put("serviceCharge", bigDecimalValue(row.get("service_charge")));
            item.put("discountAmount", bigDecimalValue(row.get("discount_amount")));
            item.put("totalAmount", bigDecimalValue(row.get("total_amount")));
            item.put("promoCode", stringValue(row.get("promo_code")));
            item.put("promotionName", stringValue(row.get("promotion_name")));
            item.put("items", findOrderItems(orderId));

            result.add(item);
        }

        return result;
    }

    @GetMapping("/payments/{orderId}/invoice")
    @PreAuthorize("hasAnyAuthority('STAFF', 'ROLE_STAFF', 'ADMIN', 'ROLE_ADMIN')")
    public Map<String, Object> getInvoice(@PathVariable String orderId) {
        Map<String, Object> order = findOrder(orderId);
        List<Map<String, Object>> items = findOrderItems(orderId);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", stringValue(order.get("id")));
        response.put("orderId", stringValue(order.get("id")));
        response.put("orderNumber", order.get("orderNumber"));
        response.put("createdAt", stringValue(order.get("createdAt")));
        response.put("updatedAt", stringValue(order.get("updatedAt")));
        response.put("orderStatus", stringValue(order.get("orderStatus")));
        response.put("tableId", stringValue(order.get("tableId")));
        response.put("tableNumber", stringValue(order.get("tableNumber")));
        response.put("subTotal", bigDecimalValue(order.get("subTotal")));
        response.put("taxAmount", bigDecimalValue(order.get("taxAmount")));
        response.put("serviceCharge", bigDecimalValue(order.get("serviceCharge")));
        response.put("discountAmount", bigDecimalValue(order.get("discountAmount")));
        response.put("totalAmount", bigDecimalValue(order.get("totalAmount")));
        response.put("promoCode", stringValue(order.get("promoCode")));
        response.put("promotionName", stringValue(order.get("promotionName")));
        response.put("items", items);

        return response;
    }

    @PostMapping({
            "/orders/{orderId}/pay",
            "/orders/{orderId}/payment",
            "/orders/{orderId}/confirm-payment"
    })
    @Transactional
    @PreAuthorize("hasAnyAuthority('STAFF', 'ROLE_STAFF', 'ADMIN', 'ROLE_ADMIN')")
    public Map<String, Object> confirmPayment(
            @PathVariable String orderId,
            @RequestBody(required = false) PaymentRequest request
    ) {
        Map<String, Object> order = findOrder(orderId);

        String orderStatus = stringValue(order.get("orderStatus"));

        if ("PAID".equalsIgnoreCase(orderStatus)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Đơn hàng này đã thanh toán.");
        }

        BigDecimal totalAmount = bigDecimalValue(order.get("totalAmount"));
        BigDecimal paidAmount = request == null || request.paidAmount == null
                ? totalAmount
                : request.paidAmount;

        if (paidAmount.compareTo(totalAmount) < 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Số tiền nhận phải lớn hơn hoặc bằng tổng tiền hóa đơn."
            );
        }

        String tableId = stringValue(order.get("tableId"));

        int updatedOrder = jdbcTemplate.update(
                """
                update orders
                set "orderStatus" = 'PAID',
                    "updatedAt" = now()
                where id = ?
                """,
                orderId
        );

        if (updatedOrder == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn hàng.");
        }

        String nextTableStatus = syncTableStatusAfterPayment(tableId);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("orderId", orderId);
        response.put("tableId", tableId);
        response.put("orderStatus", "PAID");
        response.put("tableStatus", nextTableStatus);
        response.put("totalAmount", totalAmount);
        response.put("paidAmount", paidAmount);
        response.put("changeAmount", paidAmount.subtract(totalAmount));
        response.put("message", "Xác nhận thanh toán thành công.");

        return response;
    }

    private String syncTableStatusAfterPayment(String tableId) {
        if (tableId == null || tableId.isBlank()) {
            return "EMPTY";
        }

        Integer requestPaymentCount = jdbcTemplate.queryForObject(
                """
                select count(*)
                from orders
                where "tableId" = ?
                  and coalesce("orderStatus"::text, '') = 'REQUEST_PAYMENT'
                """,
                Integer.class,
                tableId
        );

        if (requestPaymentCount != null && requestPaymentCount > 0) {
            setTableStatus(tableId, "REQUEST_PAYMENT");
            return "REQUEST_PAYMENT";
        }

        Integer activeOrderCount = jdbcTemplate.queryForObject(
                """
                select count(*)
                from orders
                where "tableId" = ?
                  and coalesce("orderStatus"::text, '') not in ('PAID', 'CANCELLED', 'COMPLETED')
                """,
                Integer.class,
                tableId
        );

        if (activeOrderCount != null && activeOrderCount > 0) {
            setTableStatus(tableId, "USING");
            return "USING";
        }

        setTableStatus(tableId, "EMPTY");
        return "EMPTY";
    }

    private Map<String, Object> findOrder(String orderId) {
        try {
            return jdbcTemplate.queryForMap(
                    """
                    select
                        o.id,
                        o."orderNumber" as "orderNumber",
                        o."createdAt" as "createdAt",
                        o."updatedAt" as "updatedAt",
                        o."orderStatus"::text as "orderStatus",
                        o."tableId" as "tableId",
                        o."subTotal" as "subTotal",
                        o."taxAmount" as "taxAmount",
                        o."serviceCharge" as "serviceCharge",
                        o."discountAmount" as "discountAmount",
                        o."totalAmount" as "totalAmount",
                        o."promoCode" as "promoCode",
                        t."tableNumber" as "tableNumber",
                        p.name as "promotionName"
                    from orders o
                    left join tables t on t.id = o."tableId"
                    left join promotions p on p.id = o."promoCode"
                    where o.id = ?
                    limit 1
                    """,
                    orderId
            );
        } catch (EmptyResultDataAccessException ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn hàng.");
        }
    }

    private List<Map<String, Object>> findOrderItems(String orderId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                """
                select
                    od.id as detail_id,
                    od.quantity as quantity,
                    od.price as price,
                    od.status::text as status,
                    od."itemId" as item_id,
                    od."comboId" as combo_id,
                    i.name as item_name,
                    c.name as combo_name
                from orderdetails od
                left join items i on i.id = od."itemId"
                left join combos c on c.id = od."comboId"
                where od."orderId" = ?
                order by od.id asc
                """,
                orderId
        );

        List<Map<String, Object>> items = new ArrayList<>();

        for (Map<String, Object> row : rows) {
            boolean isCombo = row.get("combo_id") != null;
            int quantity = intValue(row.get("quantity"));
            BigDecimal price = bigDecimalValue(row.get("price"));

            Map<String, Object> item = new LinkedHashMap<>();
            item.put("detailId", stringValue(row.get("detail_id")));
            item.put("type", isCombo ? "COMBO" : "ITEM");
            item.put("foodId", isCombo ? stringValue(row.get("combo_id")) : stringValue(row.get("item_id")));
            item.put("foodName", isCombo ? stringValue(row.get("combo_name")) : stringValue(row.get("item_name")));
            item.put("quantity", quantity);
            item.put("price", price);
            item.put("total", price.multiply(BigDecimal.valueOf(quantity)));
            item.put("status", stringValue(row.get("status")));

            items.add(item);
        }

        return items;
    }

    private void setTableStatus(String tableId, String status) {
        int updated = jdbcTemplate.update(
                """
                update tables
                set status = ?,
                    "updatedAt" = now()
                where id = ?
                """,
                status,
                tableId
        );

        if (updated == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không cập nhật được trạng thái bàn.");
        }
    }

    private String stringValue(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private int intValue(Object value) {
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

        String text = String.valueOf(value).trim();

        if (text.isBlank()) {
            return BigDecimal.ZERO;
        }

        return new BigDecimal(text);
    }

    public record PaymentRequest(
            BigDecimal paidAmount,
            String paymentMethod
    ) {
    }
}