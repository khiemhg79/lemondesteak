package com.lemondesteak.controller;

import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@RestController
@RequestMapping("/api/admin/reports")
@RequiredArgsConstructor
public class AdminReportController {

    private final EntityManager entityManager;

    @GetMapping("/overview")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public AdminReportOverviewResponse getOverview() {
        List<MonthlyRevenueResponse> monthlyRevenue = getMonthlyRevenue();
        List<TopSellingItemResponse> topSellingItems = getTopSellingItems();
        ComboRatioResponse comboRatio = getComboRatio();
        List<RevenueOrderResponse> revenueAndOrders = getRevenueAndOrders();

        BigDecimal totalRevenue = monthlyRevenue.stream()
                .map(MonthlyRevenueResponse::revenue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Integer totalOrders = revenueAndOrders.stream()
                .map(RevenueOrderResponse::orderCount)
                .reduce(0, Integer::sum);

        BigDecimal avgOrderValue = BigDecimal.ZERO;

        if (totalOrders > 0) {
            avgOrderValue = totalRevenue.divide(
                    BigDecimal.valueOf(totalOrders),
                    2,
                    RoundingMode.HALF_UP
            );
        }

        BigDecimal currentMonthRevenue = BigDecimal.ZERO;
        BigDecimal previousMonthRevenue = BigDecimal.ZERO;

        if (!monthlyRevenue.isEmpty()) {
            currentMonthRevenue = monthlyRevenue.get(monthlyRevenue.size() - 1).revenue();
        }

        if (monthlyRevenue.size() >= 2) {
            previousMonthRevenue = monthlyRevenue.get(monthlyRevenue.size() - 2).revenue();
        }

        BigDecimal monthOverMonthPercent = BigDecimal.ZERO;

        if (previousMonthRevenue.compareTo(BigDecimal.ZERO) > 0) {
            monthOverMonthPercent = currentMonthRevenue
                    .subtract(previousMonthRevenue)
                    .multiply(BigDecimal.valueOf(100))
                    .divide(previousMonthRevenue, 2, RoundingMode.HALF_UP);
        } else if (currentMonthRevenue.compareTo(BigDecimal.ZERO) > 0) {
            monthOverMonthPercent = BigDecimal.valueOf(100);
        }

        AdminReportSummaryResponse summary = new AdminReportSummaryResponse(
                totalRevenue,
                totalOrders,
                avgOrderValue,
                monthOverMonthPercent
        );

        return new AdminReportOverviewResponse(
                summary,
                monthlyRevenue,
                topSellingItems,
                comboRatio,
                revenueAndOrders
        );
    }

    private List<MonthlyRevenueResponse> getMonthlyRevenue() {
        List<Object[]> rows = entityManager
                .createNativeQuery("""
                        select
                            to_char(months.month_start, 'Mon') as month_label,
                            coalesce(sum(o."totalAmount"), 0) as revenue
                        from generate_series(
                            date_trunc('month', now()) - interval '5 months',
                            date_trunc('month', now()),
                            interval '1 month'
                        ) as months(month_start)
                        left join orders o
                            on date_trunc('month', o."createdAt") = months.month_start
                           and upper(o."orderStatus") <> 'CANCELLED'
                        group by months.month_start
                        order by months.month_start
                        """)
                .getResultList();

        return rows.stream()
                .map(row -> new MonthlyRevenueResponse(
                        stringValue(row[0]),
                        bigDecimalValue(row[1])
                ))
                .toList();
    }

    private List<TopSellingItemResponse> getTopSellingItems() {
        List<Object[]> rows = entityManager
                .createNativeQuery("""
                        select
                            coalesce(i.name, c.name, 'Không xác định') as item_name,
                            coalesce(sum(od.quantity), 0) as total_quantity
                        from orderdetails od
                        join orders o on o.id = od."orderId"
                        left join items i on i.id = od."itemId"
                        left join combos c on c.id = od."comboId"
                        where upper(o."orderStatus") <> 'CANCELLED'
                        group by coalesce(i.name, c.name, 'Không xác định')
                        order by total_quantity desc, item_name
                        limit 8
                        """)
                .getResultList();

        return rows.stream()
                .map(row -> new TopSellingItemResponse(
                        stringValue(row[0]),
                        intValue(row[1])
                ))
                .toList();
    }

    private ComboRatioResponse getComboRatio() {
        List<Object[]> rows = entityManager
                .createNativeQuery("""
                        select
                            coalesce(sum(case when od."comboId" is not null then od.quantity else 0 end), 0) as combo_quantity,
                            coalesce(sum(case when od."itemId" is not null then od.quantity else 0 end), 0) as item_quantity
                        from orderdetails od
                        join orders o on o.id = od."orderId"
                        where upper(o."orderStatus") <> 'CANCELLED'
                        """)
                .getResultList();

        if (rows.isEmpty()) {
            return new ComboRatioResponse(0, 0, BigDecimal.ZERO, BigDecimal.ZERO);
        }

        Object[] row = rows.get(0);

        Integer comboQuantity = intValue(row[0]);
        Integer itemQuantity = intValue(row[1]);
        Integer total = comboQuantity + itemQuantity;

        BigDecimal comboPercent = BigDecimal.ZERO;
        BigDecimal itemPercent = BigDecimal.ZERO;

        if (total > 0) {
            comboPercent = BigDecimal.valueOf(comboQuantity)
                    .multiply(BigDecimal.valueOf(100))
                    .divide(BigDecimal.valueOf(total), 2, RoundingMode.HALF_UP);

            itemPercent = BigDecimal.valueOf(itemQuantity)
                    .multiply(BigDecimal.valueOf(100))
                    .divide(BigDecimal.valueOf(total), 2, RoundingMode.HALF_UP);
        }

        return new ComboRatioResponse(
                comboQuantity,
                itemQuantity,
                comboPercent,
                itemPercent
        );
    }

    private List<RevenueOrderResponse> getRevenueAndOrders() {
        List<Object[]> rows = entityManager
                .createNativeQuery("""
                        select
                            to_char(months.month_start, 'Mon') as month_label,
                            coalesce(sum(o."totalAmount"), 0) as revenue,
                            count(o.id) as order_count
                        from generate_series(
                            date_trunc('month', now()) - interval '5 months',
                            date_trunc('month', now()),
                            interval '1 month'
                        ) as months(month_start)
                        left join orders o
                            on date_trunc('month', o."createdAt") = months.month_start
                           and upper(o."orderStatus") <> 'CANCELLED'
                        group by months.month_start
                        order by months.month_start
                        """)
                .getResultList();

        return rows.stream()
                .map(row -> new RevenueOrderResponse(
                        stringValue(row[0]),
                        bigDecimalValue(row[1]),
                        intValue(row[2])
                ))
                .toList();
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

    public record AdminReportOverviewResponse(
            AdminReportSummaryResponse summary,
            List<MonthlyRevenueResponse> monthlyRevenue,
            List<TopSellingItemResponse> topSellingItems,
            ComboRatioResponse comboRatio,
            List<RevenueOrderResponse> revenueAndOrders
    ) {
    }

    public record AdminReportSummaryResponse(
            BigDecimal totalRevenue,
            Integer totalOrders,
            BigDecimal avgOrderValue,
            BigDecimal monthOverMonthPercent
    ) {
    }

    public record MonthlyRevenueResponse(
            String month,
            BigDecimal revenue
    ) {
    }

    public record TopSellingItemResponse(
            String name,
            Integer quantity
    ) {
    }

    public record ComboRatioResponse(
            Integer comboQuantity,
            Integer itemQuantity,
            BigDecimal comboPercent,
            BigDecimal itemPercent
    ) {
    }

    public record RevenueOrderResponse(
            String month,
            BigDecimal revenue,
            Integer orderCount
    ) {
    }
}