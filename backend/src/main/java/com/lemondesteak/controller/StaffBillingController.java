package com.lemondesteak.controller;

import com.lemondesteak.dto.PaymentConfirmRequest;
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
import java.util.UUID;

@RestController
@RequestMapping("/api/staff/billing")
@RequiredArgsConstructor
public class StaffBillingController {

    private final EntityManager entityManager;

    @GetMapping("/tables/{tableId}/active-order")
    @PreAuthorize("hasAnyAuthority('STAFF', 'ADMIN', 'ROLE_STAFF', 'ROLE_ADMIN')")
    public BillingOrderResponse getActiveOrderByTable(@PathVariable String tableId) {
        Object[] orderRow = findActiveOrderByTable(tableId);

        if (orderRow == null) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Bàn chưa có đơn hàng cần thanh toán"
            );
        }

        return toBillingOrderResponse(orderRow);
    }

    @PostMapping("/orders/{orderId}/pay")
    @Transactional
    @PreAuthorize("hasAnyAuthority('STAFF', 'ADMIN', 'ROLE_STAFF', 'ROLE_ADMIN')")
    public InvoicePaymentResponse confirmPayment(
            @PathVariable String orderId,
            @RequestBody PaymentConfirmRequest request
    ) {
        Object[] orderRow = findOrderById(orderId);

        if (orderRow == null) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Không tìm thấy đơn hàng"
            );
        }

        String orderStatus = stringValue(orderRow[3]);

        if (isFinishedOrder(orderStatus)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Đơn hàng đã hoàn tất hoặc đã hủy"
            );
        }

        BillingOrderResponse order = toBillingOrderResponse(orderRow);

        BigDecimal paidAmount = request.paidAmount() == null
                ? BigDecimal.ZERO
                : request.paidAmount();

        if (paidAmount.compareTo(order.totalAmount()) < 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Số tiền nhận phải lớn hơn hoặc bằng tổng tiền hóa đơn"
            );
        }

        String paymentMethod = request.paymentMethod() == null || request.paymentMethod().isBlank()
                ? "CASH"
                : request.paymentMethod().trim().toUpperCase();

        String invoiceId = UUID.randomUUID().toString();
        String paymentId = UUID.randomUUID().toString();
        String invoiceNumber = "HD" + System.currentTimeMillis();

        BigDecimal changeAmount = paidAmount.subtract(order.totalAmount());

        String customerId = stringValue(orderRow[9]);
        String note = request.note() == null ? "" : request.note();

        entityManager
                .createNativeQuery("""
                        insert into invoices (
                            id,
                            "invoiceNumber",
                            "subTotal",
                            "taxAmount",
                            "totalAmount",
                            "paymentMethod",
                            "createdAt",
                            "updatedAt",
                            "orderId",
                            "customerId",
                            "tableId",
                            status,
                            "paidAt",
                            note
                        )
                        values (
                            :id,
                            :invoiceNumber,
                            :subTotal,
                            0,
                            :totalAmount,
                            :paymentMethod,
                            now(),
                            now(),
                            :orderId,
                            :customerId,
                            :tableId,
                            cast('PAID' as "InvoiceStatus"),
                            now(),
                            :note
                        )
                        """)
                .setParameter("id", invoiceId)
                .setParameter("invoiceNumber", invoiceNumber)
                .setParameter("subTotal", order.subTotal())
                .setParameter("totalAmount", order.totalAmount())
                .setParameter("paymentMethod", paymentMethod)
                .setParameter("orderId", order.orderId())
                .setParameter("customerId", customerId.isBlank() ? null : customerId)
                .setParameter("tableId", order.tableId())
                .setParameter("note", note)
                .executeUpdate();

        entityManager
                .createNativeQuery("""
                        insert into payments (
                            id,
                            "paymentMethod",
                            amount,
                            "paidAmount",
                            "changeAmount",
                            "paymentStatus",
                            "createdAt",
                            "updatedAt",
                            "invoiceId",
                            "orderId",
                            "paidAt",
                            "transactionCode"
                        )
                        values (
                            :id,
                            :paymentMethod,
                            :amount,
                            :paidAmount,
                            :changeAmount,
                            'PAID',
                            now(),
                            now(),
                            :invoiceId,
                            :orderId,
                            now(),
                            :transactionCode
                        )
                        """)
                .setParameter("id", paymentId)
                .setParameter("paymentMethod", paymentMethod)
                .setParameter("amount", order.totalAmount())
                .setParameter("paidAmount", paidAmount)
                .setParameter("changeAmount", changeAmount)
                .setParameter("invoiceId", invoiceId)
                .setParameter("orderId", order.orderId())
                .setParameter("transactionCode", invoiceNumber)
                .executeUpdate();

        entityManager
                .createNativeQuery("""
                        update orders
                        set "orderStatus" = 'PAID',
                            "updatedAt" = now()
                        where id = :orderId
                        """)
                .setParameter("orderId", order.orderId())
                .executeUpdate();

        entityManager
                .createNativeQuery("""
                        update tables
                        set status = 'EMPTY',
                            "updatedAt" = now()
                        where id = :tableId
                        """)
                .setParameter("tableId", order.tableId())
                .executeUpdate();

        return new InvoicePaymentResponse(
                invoiceId,
                invoiceNumber,
                order.orderId(),
                order.orderNumber(),
                order.tableId(),
                order.tableNumber(),
                order.subTotal(),
                order.discountAmount(),
                order.totalAmount(),
                paidAmount,
                changeAmount,
                paymentMethod,
                OffsetDateTime.now(),
                order.items()
        );
    }

    private Object[] findActiveOrderByTable(String tableId) {
        List<Object[]> rows = entityManager
                .createNativeQuery("""
                        select
                            o.id,
                            o."orderNumber",
                            o."createdAt",
                            o."orderStatus",
                            o."subTotal",
                            o."discountAmount",
                            o."totalAmount",
                            t.id,
                            t."tableNumber",
                            o."customerId"
                        from orders o
                        join tables t on t.id = o."tableId"
                        where o."tableId" = :tableId
                          and o."orderStatus" not in ('COMPLETED', 'CANCELLED', 'PAID')
                        order by o."createdAt" desc, o."orderNumber" desc
                        limit 1
                        """)
                .setParameter("tableId", tableId)
                .getResultList();

        return rows.isEmpty() ? null : rows.get(0);
    }

    private Object[] findOrderById(String orderId) {
        List<Object[]> rows = entityManager
                .createNativeQuery("""
                        select
                            o.id,
                            o."orderNumber",
                            o."createdAt",
                            o."orderStatus",
                            o."subTotal",
                            o."discountAmount",
                            o."totalAmount",
                            t.id,
                            t."tableNumber",
                            o."customerId"
                        from orders o
                        join tables t on t.id = o."tableId"
                        where o.id = :orderId
                        limit 1
                        """)
                .setParameter("orderId", orderId)
                .getResultList();

        return rows.isEmpty() ? null : rows.get(0);
    }

    private BillingOrderResponse toBillingOrderResponse(Object[] row) {
        String orderId = stringValue(row[0]);
        List<BillingOrderLineResponse> items = findOrderLines(orderId);

        BigDecimal subTotal = bigDecimalValue(row[4]);
        BigDecimal discountAmount = bigDecimalValue(row[5]);
        BigDecimal totalAmount = bigDecimalValue(row[6]);

        if (subTotal.compareTo(BigDecimal.ZERO) <= 0) {
            subTotal = items.stream()
                    .map(BillingOrderLineResponse::lineTotal)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
        }

        if (totalAmount.compareTo(BigDecimal.ZERO) <= 0) {
            totalAmount = subTotal.subtract(discountAmount);
            if (totalAmount.compareTo(BigDecimal.ZERO) < 0) {
                totalAmount = BigDecimal.ZERO;
            }
        }

        return new BillingOrderResponse(
                orderId,
                intValue(row[1]),
                offsetDateTimeValue(row[2]),
                stringValue(row[3]),
                stringValue(row[7]),
                stringValue(row[8]),
                subTotal,
                discountAmount,
                totalAmount,
                items
        );
    }

    private List<BillingOrderLineResponse> findOrderLines(String orderId) {
        List<Object[]> rows = entityManager
                .createNativeQuery("""
                        select
                            od.id,
                            coalesce(i.name, c.name, 'Món ăn'),
                            case
                                when od."comboId" is not null then 'combo'
                                else 'item'
                            end,
                            od.quantity,
                            od.price,
                            od.price * od.quantity,
                            od.status::text
                        from orderdetails od
                        left join items i on i.id = od."itemId"
                        left join combos c on c.id = od."comboId"
                        where od."orderId" = :orderId
                        order by od.id
                        """)
                .setParameter("orderId", orderId)
                .getResultList();

        return rows.stream()
                .map(row -> new BillingOrderLineResponse(
                        stringValue(row[0]),
                        stringValue(row[1]),
                        stringValue(row[2]),
                        intValue(row[3]),
                        bigDecimalValue(row[4]),
                        bigDecimalValue(row[5]),
                        stringValue(row[6])
                ))
                .toList();
    }

    private boolean isFinishedOrder(String status) {
        return "COMPLETED".equalsIgnoreCase(status)
                || "CANCELLED".equalsIgnoreCase(status)
                || "PAID".equalsIgnoreCase(status);
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

    public record BillingOrderResponse(
            String orderId,
            Integer orderNumber,
            OffsetDateTime createdAt,
            String orderStatus,
            String tableId,
            String tableNumber,
            BigDecimal subTotal,
            BigDecimal discountAmount,
            BigDecimal totalAmount,
            List<BillingOrderLineResponse> items
    ) {
    }

    public record BillingOrderLineResponse(
            String detailId,
            String foodName,
            String foodType,
            Integer quantity,
            BigDecimal price,
            BigDecimal lineTotal,
            String status
    ) {
    }

    public record InvoicePaymentResponse(
            String invoiceId,
            String invoiceNumber,
            String orderId,
            Integer orderNumber,
            String tableId,
            String tableNumber,
            BigDecimal subTotal,
            BigDecimal discountAmount,
            BigDecimal totalAmount,
            BigDecimal paidAmount,
            BigDecimal changeAmount,
            String paymentMethod,
            OffsetDateTime paidAt,
            List<BillingOrderLineResponse> items
    ) {
    }
}