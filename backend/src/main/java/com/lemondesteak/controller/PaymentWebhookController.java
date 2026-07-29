package com.lemondesteak.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/webhooks")
@CrossOrigin(origins = "*")
public class PaymentWebhookController {

    private final JdbcTemplate jdbc;

    public PaymentWebhookController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /**
     * Webhook Endpoint tiếp nhận biến động số dư từ Ngân hàng / Casso / PayOS / VietQR
     * Tự động gạch nợ & kích hoạt Thank You Modal tức thì cho khách hàng.
     */
    @PostMapping("/payment")
    public ResponseEntity<Map<String, Object>> handlePaymentWebhook(@RequestBody(required = false) Map<String, Object> payload) {
        Map<String, Object> response = new HashMap<>();
        response.put("timestamp", OffsetDateTime.now().toString());

        if (payload == null) {
            response.put("status", "error");
            response.put("message", "Payload rỗng");
            return ResponseEntity.badRequest().body(response);
        }

        // 1. Kiểm tra cấu trúc payload Casso / PayOS / Custom Webhook
        String description = extractDescription(payload);
        Double amount = extractAmount(payload);

        if (description == null || description.isBlank()) {
            response.put("status", "ignored");
            response.put("message", "Không tìm thấy nội dung chuyển khoản trong webhook");
            return ResponseEntity.ok(response);
        }

        // 2. Trích xuất mã đơn hàng từ nội dung CK (VD: "LMS Ban 03 Don 1002" -> "1002")
        String orderIdOrNumber = extractOrderIdFromMemo(description);

        if (orderIdOrNumber == null) {
            response.put("status", "ignored");
            response.put("message", "Nội dung chuyển khoản không chứa mã đơn hàng LMS");
            return ResponseEntity.ok(response);
        }

        // 3. Tìm và cập nhật đơn hàng thành PAID trong CSDL
        try {
            int updated = jdbc.update("""
                update orders
                set "orderStatus" = 'PAID',
                    "updatedAt" = now()
                where (id = ? or lower("orderNumber") = lower(?))
                  and coalesce("orderStatus"::text, '') <> 'PAID'
            """, orderIdOrNumber, orderIdOrNumber);

            if (updated > 0) {
                response.put("status", "success");
                response.put("message", "Đã tự động xác nhận thanh toán thành công cho đơn " + orderIdOrNumber);
                response.put("orderId", orderIdOrNumber);
                response.put("amount", amount);
                return ResponseEntity.ok(response);
            } else {
                response.put("status", "already_paid_or_not_found");
                response.put("message", "Đơn hàng đã được thanh toán trước đó hoặc không tồn tại.");
                return ResponseEntity.ok(response);
            }
        } catch (Exception ex) {
            response.put("status", "error");
            response.put("message", "Lỗi CSDL: " + ex.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    private String extractDescription(Map<String, Object> payload) {
        if (payload.containsKey("description")) {
            return String.valueOf(payload.get("description"));
        }
        if (payload.containsKey("content")) {
            return String.valueOf(payload.get("content"));
        }

        // Handle Casso format: { data: [ { description: '...' } ] }
        if (payload.get("data") instanceof List<?> list && !list.isEmpty()) {
            Object first = list.get(0);
            if (first instanceof Map<?, ?> map) {
                if (map.containsKey("description")) return String.valueOf(map.get("description"));
                if (map.containsKey("content")) return String.valueOf(map.get("content"));
            }
        }

        return null;
    }

    private Double extractAmount(Map<String, Object> payload) {
        if (payload.get("amount") instanceof Number num) {
            return num.doubleValue();
        }
        if (payload.get("data") instanceof List<?> list && !list.isEmpty()) {
            Object first = list.get(0);
            if (first instanceof Map<?, ?> map && map.get("amount") instanceof Number num) {
                return num.doubleValue();
            }
        }
        return 0.0;
    }

    private String extractOrderIdFromMemo(String memo) {
        // Regex tìm "Don 1002" hoặc "Don #1002" hoặc "Don1002"
        Pattern pattern = Pattern.compile("Don\\s*#?\\s*([a-zA-Z0-9-]+)", Pattern.CASE_INSENSITIVE);
        Matcher matcher = pattern.matcher(memo);
        if (matcher.find()) {
            return matcher.group(1);
        }
        return null;
    }
}
