package com.lemondesteak.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class CustomerOrderController {
    private static final String TABLE_STATUS_USING = "USING";
    private static final String TABLE_STATUS_REQUEST_PAYMENT = "REQUEST_PAYMENT";

    private static final String ORDER_STATUS_PENDING = "PENDING";
    private static final String ORDER_STATUS_REQUEST_PAYMENT = "REQUEST_PAYMENT";

    private final JdbcTemplate jdbc;

    @PostMapping("/api/customer/orders")
    @Transactional
    public Map<String, Object> createOrder(@RequestBody CreateOrderRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Dữ liệu đặt món không hợp lệ.");
        }

        String tableId = resolveTableId(request.tableId, request.tableNumber);

        if (tableId == null || tableId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vui lòng quét QR tại bàn trước khi đặt món.");
        }

        List<OrderLine> lines = buildOrderLines(request);

        if (lines.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Giỏ hàng đang trống.");
        }

        BigDecimal subTotal = lines.stream()
                .map(OrderLine::total)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal taxAmount = BigDecimal.ZERO;
        BigDecimal serviceCharge = BigDecimal.ZERO;
        BigDecimal discountAmount = BigDecimal.ZERO;

        BigDecimal totalAmount = subTotal
                .add(taxAmount)
                .add(serviceCharge)
                .subtract(discountAmount)
                .max(BigDecimal.ZERO);

        String userId = currentUserId();
        String customerId = resolveCustomerId(userId);

        Map<String, Object> order = jdbc.queryForMap("""
            insert into orders (
                "subTotal",
                "taxAmount",
                "serviceCharge",
                "discountAmount",
                "totalAmount",
                "orderStatus",
                "customerNotes",
                "tableId",
                "userId",
                "customerId",
                "promoCode"
            )
            values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            returning id, "orderNumber"
        """,
                subTotal,
                taxAmount,
                serviceCharge,
                discountAmount,
                totalAmount,
                ORDER_STATUS_PENDING,
                request.customerNotes,
                tableId,
                userId,
                customerId,
                null
        );

        String orderId = stringValue(order.get("id"));

        if (orderId == null || orderId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Không tạo được mã đơn hàng.");
        }

        for (OrderLine line : lines) {
            insertOrderDetail(orderId, line);
        }

        setTableStatus(tableId, TABLE_STATUS_USING);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", orderId);
        response.put("orderNumber", order.get("orderNumber"));
        response.put("tableId", tableId);
        response.put("orderStatus", ORDER_STATUS_PENDING);
        response.put("tableStatus", TABLE_STATUS_USING);
        response.put("subTotal", subTotal);
        response.put("taxAmount", taxAmount);
        response.put("serviceCharge", serviceCharge);
        response.put("discountAmount", discountAmount);
        response.put("totalAmount", totalAmount);
        response.put("promotionId", null);
        response.put("promotionName", null);
        response.put("promotionType", null);
        response.put("promotionValue", BigDecimal.ZERO);
        response.put("message", "Đặt món thành công.");

        return response;
    }


    @GetMapping("/api/customer/orders/history")
    public List<Map<String, Object>> getOrderHistory() {
        String userId = currentUserId();

        if (userId == null || userId.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Vui lòng đăng nhập để xem lịch sử đặt món."
            );
        }

        String customerId = resolveCustomerId(userId);

        List<Map<String, Object>> rows = jdbc.queryForList("""
            select
                o.id,
                o."orderNumber" as "orderNumber",
                o."createdAt" as "createdAt",
                o."updatedAt" as "updatedAt",
                o."orderStatus"::text as "orderStatus",
                o."subTotal" as "subTotal",
                o."discountAmount" as "discountAmount",
                o."totalAmount" as "totalAmount",
                o."tableId" as "tableId",
                t."tableNumber" as "tableNumber"
            from orders o
            left join tables t on t.id = o."tableId"
            where (
                o."userId" = ?
                or (? is not null and o."customerId" = ?)
            )
              and coalesce(o."orderStatus"::text, '') not in ('CANCELLED')
            order by o."createdAt" desc
            limit 50
        """, userId, customerId, customerId);

        List<Map<String, Object>> result = new ArrayList<>();

        for (Map<String, Object> row : rows) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", stringValue(row.get("id")));
            item.put("orderNumber", row.get("orderNumber"));
            item.put("createdAt", stringValue(row.get("createdAt")));
            item.put("updatedAt", stringValue(row.get("updatedAt")));
            item.put("orderStatus", stringValue(row.get("orderStatus")));
            item.put("subTotal", bigDecimalValue(row.get("subTotal")));
            item.put("discountAmount", bigDecimalValue(row.get("discountAmount")));
            item.put("totalAmount", bigDecimalValue(row.get("totalAmount")));
            item.put("tableId", stringValue(row.get("tableId")));
            item.put("tableNumber", stringValue(row.get("tableNumber")));
            result.add(item);
        }

        return result;
    }

    @GetMapping("/api/customer/orders/{orderId}")
    public Map<String, Object> getOrder(@PathVariable String orderId) {
        Map<String, Object> order = findOrder(orderId);
        List<Map<String, Object>> items = findOrderItems(orderId);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", stringValue(order.get("id")));
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
        response.put("promoCode", stringValue(order.get("promotionId")));
        response.put("promotionId", stringValue(order.get("promotionId")));
        response.put("promotionName", stringValue(order.get("promotionName")));
        response.put("promotionType", stringValue(order.get("promotionType")));
        response.put("promotionValue", bigDecimalValue(order.get("promotionValue")));
        response.put("items", items);

        return response;
    }

    @GetMapping("/api/customer/promotions/available")
    public List<Map<String, Object>> availablePromotions() {
        String userId = currentUserId();
        String customerId = resolveCustomerId(userId);

        List<Map<String, Object>> rows = jdbc.queryForList("""
            select
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
                coalesce("usedCount", 0) as "usedCount",
                "isActive"
            from promotions p
            where p."isActive" = true
              and (p."startDate" is null or p."startDate" <= now())
              and (p."endDate" is null or p."endDate" >= now())
              and (p."usageLimit" is null or coalesce(p."usedCount", 0) < p."usageLimit")
              and not exists (
                  select 1
                  from orders o
                  where o."promoCode" = p.id
                    and coalesce(o."orderStatus"::text, '') <> 'CANCELLED'
                    and (
                        (? is not null and o."userId" = ?)
                        or (? is not null and o."customerId" = ?)
                    )
              )
            order by p."createdAt" desc
        """, userId, userId, customerId, customerId);

        List<Map<String, Object>> result = new ArrayList<>();

        for (Map<String, Object> row : rows) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", stringValue(row.get("id")));
            item.put("name", stringValue(row.get("name")));
            item.put("type", stringValue(row.get("type")));
            item.put("value", bigDecimalValue(row.get("value")));
            item.put("minOrderAmount", bigDecimalValue(row.get("minOrderAmount")));
            item.put("maxDiscount", bigDecimalValue(row.get("maxDiscount")));
            item.put("description", stringValue(row.get("description")));
            item.put("startDate", stringValue(row.get("startDate")));
            item.put("endDate", stringValue(row.get("endDate")));
            item.put("usageLimit", row.get("usageLimit"));
            item.put("usedCount", intValue(row.get("usedCount")));
            item.put("isActive", booleanValue(row.get("isActive")));
            result.add(item);
        }

        return result;
    }

    @PatchMapping("/api/customer/orders/{orderId}/promotion")
    @Transactional
    public Map<String, Object> applyPromotion(
            @PathVariable String orderId,
            @RequestBody ApplyPromotionRequest request
    ) {
        if (orderId == null || orderId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mã đơn hàng không hợp lệ.");
        }

        if (request == null || request.promotionId == null || request.promotionId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vui lòng chọn mã giảm giá.");
        }

        Map<String, Object> order = findOrder(orderId);
        String orderStatus = stringValue(order.get("orderStatus"));

        if ("REQUEST_PAYMENT".equalsIgnoreCase(orderStatus) || "PAID".equalsIgnoreCase(orderStatus)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Không thể áp dụng mã giảm giá sau khi đã yêu cầu thanh toán."
            );
        }

        BigDecimal subTotal = bigDecimalValue(order.get("subTotal"));
        BigDecimal taxAmount = bigDecimalValue(order.get("taxAmount"));
        BigDecimal serviceCharge = bigDecimalValue(order.get("serviceCharge"));
        String oldPromotionId = stringValue(order.get("promotionId"));
        String newPromotionId = request.promotionId.trim();

        Map<String, Object> promotion = findPromotion(newPromotionId);
        BigDecimal discountAmount = calculateDiscount(subTotal, promotion);

        boolean isChangingPromotion =
                oldPromotionId == null ||
                oldPromotionId.isBlank() ||
                !oldPromotionId.equals(newPromotionId);

        if (isChangingPromotion) {
            validatePromotionNotUsedByCurrentCustomer(newPromotionId, orderId);
            reservePromotionUsage(newPromotionId);
        }

        BigDecimal totalAmount = subTotal
                .add(taxAmount)
                .add(serviceCharge)
                .subtract(discountAmount)
                .max(BigDecimal.ZERO);

        jdbc.update("""
            update orders
            set "promoCode" = ?,
                "discountAmount" = ?,
                "totalAmount" = ?,
                "updatedAt" = now()
            where id = ?
        """,
                newPromotionId,
                discountAmount,
                totalAmount,
                orderId
        );

        if (isChangingPromotion && oldPromotionId != null && !oldPromotionId.isBlank()) {
            decrementPromotionUsedCount(oldPromotionId);
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("orderId", orderId);
        response.put("promotionId", newPromotionId);
        response.put("promotionName", stringValue(promotion.get("name")));
        response.put("promotionType", stringValue(promotion.get("type")));
        response.put("promotionValue", bigDecimalValue(promotion.get("value")));
        response.put("discountAmount", discountAmount);
        response.put("subTotal", subTotal);
        response.put("taxAmount", taxAmount);
        response.put("serviceCharge", serviceCharge);
        response.put("totalAmount", totalAmount);
        response.put("message", "Áp dụng mã giảm giá thành công.");

        return response;
    }

    @PatchMapping("/api/customer/orders/{orderId}/request-payment")
    @Transactional
    public Map<String, Object> requestPayment(@PathVariable String orderId) {
        if (orderId == null || orderId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mã đơn hàng không hợp lệ.");
        }

        Map<String, Object> order = findOrder(orderId);
        String tableId = stringValue(order.get("tableId"));

        int updatedOrder = jdbc.update("""
            update orders
            set "orderStatus" = ?,
                "updatedAt" = now()
            where id = ?
        """, ORDER_STATUS_REQUEST_PAYMENT, orderId);

        if (updatedOrder == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn hàng.");
        }

        if (tableId != null && !tableId.isBlank()) {
            setTableStatus(tableId, TABLE_STATUS_REQUEST_PAYMENT);
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("orderId", orderId);
        response.put("tableId", tableId);
        response.put("orderStatus", ORDER_STATUS_REQUEST_PAYMENT);
        response.put("tableStatus", TABLE_STATUS_REQUEST_PAYMENT);
        response.put("message", "Đã gửi yêu cầu thanh toán.");

        return response;
    }

    private void insertOrderDetail(String orderId, OrderLine line) {
        jdbc.update("""
            insert into orderdetails (
                "orderId",
                "itemId",
                "comboId",
                quantity,
                price,
                status
            )
            values (?, ?, ?, ?, ?, 'WAITING'::"OrderDetailStatus")
        """,
                orderId,
                line.itemId,
                line.comboId,
                line.quantity,
                line.price
        );
    }

    private void setTableStatus(String tableId, String status) {
        int updated = jdbc.update("""
            update tables
            set status = ?,
                "updatedAt" = now()
            where id = ?
              and "isActive" = true
        """, status, tableId);

        if (updated == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không cập nhật được trạng thái bàn.");
        }
    }

    private List<OrderLine> buildOrderLines(CreateOrderRequest request) {
        List<OrderLine> lines = new ArrayList<>();

        if (request.items != null) {
            for (OrderItemRequest item : request.items) {
                if (item == null || item.itemId == null || item.itemId.isBlank()) {
                    continue;
                }

                int quantity = safeQuantity(item.quantity);
                BigDecimal price = getItemPrice(item.itemId);

                lines.add(new OrderLine(
                        item.itemId,
                        null,
                        quantity,
                        price
                ));
            }
        }

        if (request.combos != null) {
            for (OrderComboRequest combo : request.combos) {
                if (combo == null || combo.comboId == null || combo.comboId.isBlank()) {
                    continue;
                }

                int quantity = safeQuantity(combo.quantity);
                BigDecimal price = getComboPrice(combo.comboId);

                lines.add(new OrderLine(
                        null,
                        combo.comboId,
                        quantity,
                        price
                ));
            }
        }

        return lines;
    }

    private BigDecimal getItemPrice(String itemId) {
        try {
            return jdbc.queryForObject("""
                select price
                from items
                where id = ?
                  and "isActive" = true
                  and "isAvailable" = true
                limit 1
            """, BigDecimal.class, itemId);
        } catch (EmptyResultDataAccessException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Món ăn không tồn tại hoặc đã ngừng bán.");
        }
    }

    private BigDecimal getComboPrice(String comboId) {
        try {
            return jdbc.queryForObject("""
                select price
                from combos
                where id = ?
                  and "isActive" = true
                limit 1
            """, BigDecimal.class, comboId);
        } catch (EmptyResultDataAccessException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Combo không tồn tại hoặc đã ngừng bán.");
        }
    }

    private String resolveTableId(String tableId, String tableNumber) {
        String cleanTableId = blankToNull(tableId);

        if (cleanTableId != null) {
            try {
                return jdbc.queryForObject("""
                    select id
                    from tables
                    where id = ?
                      and "isActive" = true
                    limit 1
                """, String.class, cleanTableId);
            } catch (EmptyResultDataAccessException ignored) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bàn không tồn tại.");
            }
        }

        String cleanTableNumber = blankToNull(tableNumber);

        if (cleanTableNumber != null) {
            try {
                return jdbc.queryForObject("""
                    select id
                    from tables
                    where lower("tableNumber") = lower(?)
                      and "isActive" = true
                    limit 1
                """, String.class, cleanTableNumber);
            } catch (EmptyResultDataAccessException ignored) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bàn không tồn tại.");
            }
        }

        return null;
    }

    private Map<String, Object> findOrder(String orderId) {
        try {
            return jdbc.queryForMap("""
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
                    o."promoCode" as "promotionId",
                    p.name as "promotionName",
                    p.type as "promotionType",
                    p.value as "promotionValue",
                    t."tableNumber" as "tableNumber"
                from orders o
                left join tables t on t.id = o."tableId"
                left join promotions p on p.id = o."promoCode"
                where o.id = ?
                limit 1
            """, orderId);
        } catch (EmptyResultDataAccessException ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn hàng.");
        }
    }

    private List<Map<String, Object>> findOrderItems(String orderId) {
        List<Map<String, Object>> rows = jdbc.queryForList("""
            select
                od.id as "detailId",
                od."itemId" as "itemId",
                od."comboId" as "comboId",
                od.quantity as quantity,
                od.price as price,
                od.status::text as status,
                i.name as "itemName",
                i.image as "itemImage",
                c.name as "comboName",
                c.image as "comboImage"
            from orderdetails od
            left join items i on i.id = od."itemId"
            left join combos c on c.id = od."comboId"
            where od."orderId" = ?
            order by od.id asc
        """, orderId);

        List<Map<String, Object>> result = new ArrayList<>();

        for (Map<String, Object> row : rows) {
            boolean isCombo = row.get("comboId") != null;

            Map<String, Object> item = new LinkedHashMap<>();
            item.put("detailId", stringValue(row.get("detailId")));
            item.put("id", stringValue(row.get("detailId")));
            item.put("itemId", stringValue(row.get("itemId")));
            item.put("comboId", stringValue(row.get("comboId")));
            item.put("type", isCombo ? "COMBO" : "ITEM");
            item.put("name", isCombo ? stringValue(row.get("comboName")) : stringValue(row.get("itemName")));
            item.put("image", isCombo ? stringValue(row.get("comboImage")) : stringValue(row.get("itemImage")));
            item.put("quantity", row.get("quantity"));
            item.put("price", bigDecimalValue(row.get("price")));
            item.put("total", bigDecimalValue(row.get("price")).multiply(BigDecimal.valueOf(intValue(row.get("quantity")))));
            item.put("status", stringValue(row.get("status")));

            result.add(item);
        }

        return result;
    }

    private Map<String, Object> findPromotion(String promotionId) {
        try {
            return jdbc.queryForMap("""
                select
                    id,
                    name,
                    type,
                    value,
                    "minOrderAmount",
                    "maxDiscount",
                    "startDate",
                    "endDate",
                    "usageLimit",
                    coalesce("usedCount", 0) as "usedCount",
                    "isActive"
                from promotions
                where id = ?
                  and "isActive" = true
                  and ("startDate" is null or "startDate" <= now())
                  and ("endDate" is null or "endDate" >= now())
                  and ("usageLimit" is null or coalesce("usedCount", 0) < "usageLimit")
                limit 1
            """, promotionId);
        } catch (EmptyResultDataAccessException ex) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Mã giảm giá không tồn tại, đã hết hạn hoặc đã hết lượt dùng."
            );
        }
    }

    private BigDecimal calculateDiscount(BigDecimal subTotal, Map<String, Object> promotion) {
        BigDecimal minOrderAmount = bigDecimalValue(promotion.get("minOrderAmount"));

        if (subTotal.compareTo(minOrderAmount) < 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Đơn hàng chưa đạt giá trị tối thiểu để dùng mã giảm giá."
            );
        }

        String type = stringValue(promotion.get("type"));
        BigDecimal value = bigDecimalValue(promotion.get("value"));
        BigDecimal maxDiscount = bigDecimalValue(promotion.get("maxDiscount"));

        BigDecimal discount;

        if ("PERCENT".equalsIgnoreCase(type) || "PERCENTAGE".equalsIgnoreCase(type)) {
            discount = subTotal
                    .multiply(value)
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        } else {
            discount = value;
        }

        if (maxDiscount.compareTo(BigDecimal.ZERO) > 0) {
            discount = discount.min(maxDiscount);
        }

        return discount.min(subTotal).max(BigDecimal.ZERO);
    }

    private void validatePromotionNotUsedByCurrentCustomer(String promotionId, String currentOrderId) {
        String userId = currentUserId();
        String customerId = resolveCustomerId(userId);

        Integer usedCount = jdbc.queryForObject("""
            select count(*)
            from orders o
            where o."promoCode" = ?
              and o.id <> ?
              and coalesce(o."orderStatus"::text, '') <> 'CANCELLED'
              and (
                  (? is not null and o."userId" = ?)
                  or (? is not null and o."customerId" = ?)
              )
        """, Integer.class, promotionId, currentOrderId, userId, userId, customerId, customerId);

        if (usedCount != null && usedCount > 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Bạn đã sử dụng mã giảm giá này rồi."
            );
        }
    }

    private void reservePromotionUsage(String promotionId) {
        int updated = jdbc.update("""
            update promotions
            set "usedCount" = coalesce("usedCount", 0) + 1,
                "updatedAt" = now()
            where id = ?
              and "isActive" = true
              and ("startDate" is null or "startDate" <= now())
              and ("endDate" is null or "endDate" >= now())
              and ("usageLimit" is null or coalesce("usedCount", 0) < "usageLimit")
        """, promotionId);

        if (updated == 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Mã giảm giá không tồn tại, đã hết hạn hoặc đã hết lượt dùng."
            );
        }
    }

    private void decrementPromotionUsedCount(String promotionId) {
        jdbc.update("""
            update promotions
            set "usedCount" = greatest(coalesce("usedCount", 0) - 1, 0),
                "updatedAt" = now()
            where id = ?
        """, promotionId);
    }

    private String currentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }

        String principal = authentication.getName();

        if (principal == null || principal.isBlank() || "anonymousUser".equals(principal)) {
            return null;
        }

        try {
            return jdbc.queryForObject("""
                select id
                from users
                where id = ?
                   or phone = ?
                   or username = ?
                limit 1
            """, String.class, principal, principal, principal);
        } catch (Exception ignored) {
            return null;
        }
    }

    private String resolveCustomerId(String userId) {
        if (userId == null || userId.isBlank()) {
            return null;
        }

        try {
            return jdbc.queryForObject("""
                select id
                from customers
                where "userId" = ?
                limit 1
            """, String.class, userId);
        } catch (Exception ignored) {
            return null;
        }
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

    private int safeQuantity(Integer quantity) {
        if (quantity == null || quantity <= 0) {
            return 1;
        }

        return quantity;
    }

    private String blankToNull(String value) {
        if (value == null || value.trim().isBlank()) {
            return null;
        }

        return value.trim();
    }

    private String stringValue(Object value) {
        return value == null ? null : String.valueOf(value);
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

    private record OrderLine(
            String itemId,
            String comboId,
            int quantity,
            BigDecimal price
    ) {
        BigDecimal total() {
            return price.multiply(BigDecimal.valueOf(quantity));
        }
    }

    public static class CreateOrderRequest {
        public String tableId;
        public String tableNumber;
        public String customerNotes;
        public List<OrderItemRequest> items;
        public List<OrderComboRequest> combos;
    }

    public static class OrderItemRequest {
        public String itemId;
        public Integer quantity;
    }

    public static class OrderComboRequest {
        public String comboId;
        public Integer quantity;
    }

    public static class ApplyPromotionRequest {
        public String promotionId;
    }
}