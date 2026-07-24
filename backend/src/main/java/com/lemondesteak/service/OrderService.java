package com.lemondesteak.service;

import com.lemondesteak.dto.InvoiceResponse;
import com.lemondesteak.dto.OrderCreateRequest;
import com.lemondesteak.dto.OrderResponse;
import com.lemondesteak.dto.PaymentRequest;
import com.lemondesteak.entity.Combo;
import com.lemondesteak.entity.Customer;
import com.lemondesteak.entity.CustomerPromotion;
import com.lemondesteak.entity.Invoice;
import com.lemondesteak.entity.Item;
import com.lemondesteak.entity.Order;
import com.lemondesteak.entity.OrderDetail;
import com.lemondesteak.entity.Payment;
import com.lemondesteak.entity.Promotion;
import com.lemondesteak.entity.RestaurantTable;
import com.lemondesteak.entity.User;
import com.lemondesteak.enums.InvoiceStatus;
import com.lemondesteak.enums.OrderDetailStatus;
import com.lemondesteak.enums.OrderStatus;
import com.lemondesteak.enums.PaymentStatus;
import com.lemondesteak.enums.TableStatus;
import com.lemondesteak.exception.BadRequestException;
import com.lemondesteak.exception.NotFoundException;
import com.lemondesteak.repository.ComboRepository;
import com.lemondesteak.repository.CustomerPromotionRepository;
import com.lemondesteak.repository.CustomerRepository;
import com.lemondesteak.repository.InvoiceRepository;
import com.lemondesteak.repository.ItemRepository;
import com.lemondesteak.repository.OrderDetailRepository;
import com.lemondesteak.repository.OrderRepository;
import com.lemondesteak.repository.PaymentRepository;
import com.lemondesteak.repository.PromotionRepository;
import com.lemondesteak.repository.RestaurantTableRepository;
import com.lemondesteak.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OrderService {
    private static final List<String> CURRENT_ORDER_STATUSES = List.of(
            OrderStatus.PENDING.name(),
            OrderStatus.CONFIRMED.name(),
            OrderStatus.PREPARING.name(),
            OrderStatus.SERVED.name(),
            OrderStatus.PAYMENT_REQUESTED.name()
    );

    private final OrderRepository orderRepository;
    private final OrderDetailRepository orderDetailRepository;
    private final RestaurantTableRepository tableRepository;
    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final ItemRepository itemRepository;
    private final ComboRepository comboRepository;
    private final PromotionRepository promotionRepository;
    private final CustomerPromotionRepository customerPromotionRepository;
    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;

    @Transactional
    public OrderResponse createOrder(OrderCreateRequest request) {
        if (request.hasNoLines()) {
            throw new BadRequestException("Đơn hàng phải có ít nhất 1 món hoặc combo");
        }

        RestaurantTable table = resolveTableFromQr(request.tableId());

        User user = request.userId() == null || request.userId().isBlank()
                ? null
                : userRepository.findById(request.userId()).orElseThrow(() -> new NotFoundException("Không tìm thấy người dùng"));

        Customer customer = request.customerId() == null || request.customerId().isBlank()
                ? null
                : customerRepository.findById(request.customerId()).orElseThrow(() -> new NotFoundException("Không tìm thấy khách hàng"));

        Order order = new Order();
        order.setTable(table);
        order.setUser(user);
        order.setCustomer(customer);
        order.setCustomerNotes(request.customerNotes());
        order.setOrderStatus(OrderStatus.PENDING.name());

        BigDecimal subTotal = BigDecimal.ZERO;

        if (request.items() != null) {
            for (OrderCreateRequest.OrderLineItemRequest line : request.items()) {
                Item item = itemRepository.findById(line.itemId())
                        .orElseThrow(() -> new NotFoundException("Không tìm thấy món: " + line.itemId()));
                if (!Boolean.TRUE.equals(item.getIsActive()) || !Boolean.TRUE.equals(item.getIsAvailable())) {
                    throw new BadRequestException("Món " + item.getName() + " hiện không khả dụng");
                }
                int quantity = normalizeQuantity(line.quantity());
                OrderDetail detail = new OrderDetail();
                detail.setItem(item);
                detail.setQuantity(quantity);
                detail.setPrice(item.getPrice());
                detail.setStatus(OrderDetailStatus.WAITING);
                order.addDetail(detail);
                subTotal = subTotal.add(item.getPrice().multiply(BigDecimal.valueOf(quantity)));
            }
        }

        if (request.combos() != null) {
            for (OrderCreateRequest.OrderLineComboRequest line : request.combos()) {
                Combo combo = comboRepository.findById(line.comboId())
                        .orElseThrow(() -> new NotFoundException("Không tìm thấy combo: " + line.comboId()));
                if (!Boolean.TRUE.equals(combo.getIsActive())) {
                    throw new BadRequestException("Combo " + combo.getName() + " hiện không khả dụng");
                }
                int quantity = normalizeQuantity(line.quantity());
                OrderDetail detail = new OrderDetail();
                detail.setCombo(combo);
                detail.setQuantity(quantity);
                detail.setPrice(combo.getPrice());
                detail.setStatus(OrderDetailStatus.WAITING);
                order.addDetail(detail);
                subTotal = subTotal.add(combo.getPrice().multiply(BigDecimal.valueOf(quantity)));
            }
        }

        BigDecimal discount = applyPromotionIfAny(request.promotionId(), customer, subTotal, order);
        order.setSubTotal(subTotal);
        order.setDiscountAmount(discount);
        order.setTaxAmount(BigDecimal.ZERO);
        order.setServiceCharge(BigDecimal.ZERO);
        order.setTotalAmount(subTotal.subtract(discount).max(BigDecimal.ZERO));

        table.setStatus(TableStatus.OCCUPIED.name());
        Order saved = orderRepository.save(order);
        tableRepository.save(table);
        return toOrderResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getCurrentOrdersByTable(String tableId) {
        return orderRepository.findByTable_IdAndOrderStatusInOrderByCreatedAtDesc(tableId, CURRENT_ORDER_STATUSES)
                .stream().map(this::toOrderResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getHistoryByCustomer(String customerId) {
        return orderRepository.findByCustomer_IdOrderByCreatedAtDesc(customerId)
                .stream().map(this::toOrderResponse).toList();
    }

    @Transactional
    public OrderResponse updateDetailStatus(String detailId, OrderDetailStatus status) {
        OrderDetail detail = orderDetailRepository.findById(detailId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy chi tiết đơn"));
        detail.setStatus(status);
        orderDetailRepository.save(detail);
        return toOrderResponse(detail.getOrder());
    }

    @Transactional
    public InvoiceResponse requestPayment(String orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy đơn hàng"));
        order.setOrderStatus(OrderStatus.PAYMENT_REQUESTED.name());

        Invoice invoice = invoiceRepository.findByOrder_IdAndStatus(orderId, InvoiceStatus.UNPAID)
                .orElseGet(() -> createInvoice(order));
        orderRepository.save(order);
        return toInvoiceResponse(invoiceRepository.save(invoice));
    }

    @Transactional
    public InvoiceResponse pay(String orderId, PaymentRequest request) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy đơn hàng"));
        Invoice invoice = invoiceRepository.findByOrder_IdAndStatus(orderId, InvoiceStatus.UNPAID)
                .orElseGet(() -> createInvoice(order));

        BigDecimal paidAmount = request.paidAmount() == null ? invoice.getTotalAmount() : request.paidAmount();
        if (paidAmount.compareTo(invoice.getTotalAmount()) < 0) {
            throw new BadRequestException("Số tiền khách đưa chưa đủ để thanh toán");
        }

        Payment payment = new Payment();
        payment.setOrder(order);
        payment.setInvoice(invoice);
        payment.setPaymentMethod(request.paymentMethod());
        payment.setAmount(invoice.getTotalAmount());
        payment.setPaidAmount(paidAmount);
        payment.setChangeAmount(paidAmount.subtract(invoice.getTotalAmount()).max(BigDecimal.ZERO));
        payment.setPaymentStatus(PaymentStatus.PAID.name());
        payment.setPaidAt(OffsetDateTime.now());
        payment.setTransactionCode(request.transactionCode());
        paymentRepository.save(payment);

        invoice.setStatus(InvoiceStatus.PAID);
        invoice.setPaymentMethod(request.paymentMethod());
        invoice.setPaidAt(OffsetDateTime.now());

        order.setOrderStatus(OrderStatus.COMPLETED.name());
        if (order.getTable() != null) {
            order.getTable().setStatus(TableStatus.EMPTY.name());
        }
        if (order.getCustomer() != null) {
            Customer customer = order.getCustomer();
            customer.setTotalSpent(customer.getTotalSpent().add(order.getTotalAmount()));
            customer.setLoyaltyPoints(customer.getLoyaltyPoints() + order.getTotalAmount().divide(BigDecimal.valueOf(10000), 0, RoundingMode.DOWN).intValue());
        }
        return toInvoiceResponse(invoiceRepository.save(invoice));
    }


    private RestaurantTable resolveTableFromQr(String tableCode) {
        if (tableCode == null || tableCode.isBlank()) {
            throw new BadRequestException("Thiếu mã bàn từ QR");
        }
        String code = tableCode.trim();
        return tableRepository.findById(code)
                .or(() -> tableRepository.findByTableNumber(code))
                .orElseThrow(() -> new NotFoundException("Không tìm thấy bàn từ mã QR: " + code));
    }

    private BigDecimal applyPromotionIfAny(String promotionId, Customer customer, BigDecimal subTotal, Order order) {
        if (promotionId == null || promotionId.isBlank()) {
            return BigDecimal.ZERO;
        }
        Promotion promotion = promotionRepository.findByIdForUpdate(promotionId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy mã khuyến mãi"));
        OffsetDateTime now = OffsetDateTime.now();
        if (!Boolean.TRUE.equals(promotion.getIsActive()) || promotion.getStartDate().isAfter(now) || promotion.getEndDate().isBefore(now)) {
            throw new BadRequestException("Mã khuyến mãi đã hết hạn hoặc chưa được kích hoạt");
        }
        if (!promotion.hasRemainingUses()) {
            throw new BadRequestException("Mã khuyến mãi đã hết lượt sử dụng");
        }
        if (subTotal.compareTo(promotion.getMinOrderAmount()) < 0) {
            throw new BadRequestException("Đơn hàng chưa đạt giá trị tối thiểu để dùng khuyến mãi");
        }
        if (customer != null && customerPromotionRepository.existsByCustomer_IdAndPromotion_IdAndIsUsedTrue(customer.getId(), promotionId)) {
            throw new BadRequestException("Tài khoản này đã sử dụng mã khuyến mãi");
        }

        BigDecimal discount;
        if ("PERCENT".equalsIgnoreCase(promotion.getType())) {
            discount = subTotal.multiply(promotion.getValue()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            if (promotion.getMaxDiscount() != null) {
                discount = discount.min(promotion.getMaxDiscount());
            }
        } else {
            discount = promotion.getValue();
        }
        discount = discount.max(BigDecimal.ZERO).min(subTotal);

        promotion.setUsedCount(promotion.getUsedCount() + 1);
        promotionRepository.save(promotion);
        order.setPromoCode(promotion.getName());

        if (customer != null) {
            CustomerPromotion cp = customerPromotionRepository.findByCustomer_IdAndPromotion_Id(customer.getId(), promotionId)
                    .orElse(null);
            if (cp != null) {
                cp.setIsUsed(true);
                cp.setUsedAt(now);
                customerPromotionRepository.save(cp);
            }
        }
        return discount;
    }

    private Invoice createInvoice(Order order) {
        Invoice invoice = new Invoice();
        invoice.setInvoiceNumber("INV-" + DateTimeFormatter.ofPattern("yyyyMMddHHmmss").format(OffsetDateTime.now()) + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase());
        invoice.setOrder(order);
        invoice.setCustomer(order.getCustomer());
        invoice.setTable(order.getTable());
        invoice.setSubTotal(order.getSubTotal());
        invoice.setTaxAmount(order.getTaxAmount());
        invoice.setTotalAmount(order.getTotalAmount());
        invoice.setStatus(InvoiceStatus.UNPAID);
        if (order.getCustomer() != null) {
            invoice.setCustomerName(order.getCustomer().getFullName());
        }
        return invoice;
    }

    private int normalizeQuantity(Integer quantity) {
        if (quantity == null || quantity < 1) {
            throw new BadRequestException("Số lượng phải lớn hơn 0");
        }
        return quantity;
    }

    private OrderResponse toOrderResponse(Order order) {
        RestaurantTable table = order.getTable();
        Customer customer = order.getCustomer();
        List<OrderResponse.OrderDetailResponse> details = order.getDetails().stream()
                .map(d -> new OrderResponse.OrderDetailResponse(
                        d.getId(),
                        d.getItem() == null ? null : d.getItem().getId(),
                        d.getCombo() == null ? null : d.getCombo().getId(),
                        d.getItem() != null ? d.getItem().getName() : d.getCombo() == null ? null : d.getCombo().getName(),
                        d.getQuantity(),
                        d.getPrice(),
                        d.getStatus().name()
                ))
                .toList();
        return new OrderResponse(
                order.getId(),
                order.getOrderNumber(),
                table == null ? null : table.getId(),
                table == null ? null : table.getTableNumber(),
                customer == null ? null : customer.getId(),
                customer == null ? null : customer.getFullName(),
                order.getOrderStatus(),
                order.getSubTotal(),
                order.getDiscountAmount(),
                order.getTaxAmount(),
                order.getServiceCharge(),
                order.getTotalAmount(),
                order.getPromoCode(),
                order.getCustomerNotes(),
                order.getCreatedAt(),
                details
        );
    }

    private InvoiceResponse toInvoiceResponse(Invoice invoice) {
        return new InvoiceResponse(
                invoice.getId(),
                invoice.getInvoiceNumber(),
                invoice.getOrder() == null ? null : invoice.getOrder().getId(),
                invoice.getTable() == null ? null : invoice.getTable().getId(),
                invoice.getSubTotal(),
                invoice.getTaxAmount(),
                invoice.getTotalAmount(),
                invoice.getPaymentMethod(),
                invoice.getStatus().name(),
                invoice.getPaidAt()
        );
    }
}
