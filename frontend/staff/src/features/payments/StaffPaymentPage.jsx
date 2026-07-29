import { useEffect, useMemo, useState } from 'react';
import { Printer, RefreshCw, X } from 'lucide-react';
import { api } from '../../services/api.js';

function money(value) {
    return new Intl.NumberFormat('vi-VN').format(Number(value || 0)) + 'đ';
}

function dateText(value) {
    if (!value) return '';

    try {
        return new Date(value).toLocaleString('vi-VN');
    } catch {
        return String(value);
    }
}

function tableLabel(order) {
    const tableNumber = order.tableNumber || 'N/A';

    if (String(tableNumber).toLowerCase().startsWith('bàn')) {
        return tableNumber;
    }

    return `Bàn ${tableNumber}`;
}

function itemStatusLabel(status) {
    const value = String(status || '').toUpperCase();

    if (value === 'WAITING') return 'Chờ làm';
    if (value === 'COOKING') return 'Đang làm';
    if (value === 'DONE') return 'Đã xong';
    if (value === 'SERVED') return 'Đã phục vụ';

    return value || 'Chờ làm';
}

function numberValue(value) {
    return Number(value || 0);
}

function buildInvoiceHtml(invoice) {
    const items = Array.isArray(invoice.items) ? invoice.items : [];

    const itemRows = items
        .map(
            (item, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${item.foodName || ''}</td>
          <td style="text-align:center">${item.quantity || 0}</td>
          <td style="text-align:right">${money(item.price)}</td>
          <td style="text-align:right">${money(item.total)}</td>
        </tr>
      `
        )
        .join('');

    return `
    <html>
      <head>
        <title>Hóa đơn #${invoice.orderNumber || invoice.id}</title>
        <style>
          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            padding: 24px;
            font-family: Arial, sans-serif;
            color: #111827;
          }

          .invoice {
            width: 100%;
            max-width: 760px;
            margin: 0 auto;
          }

          .head {
            text-align: center;
            padding-bottom: 16px;
            border-bottom: 2px solid #111827;
            margin-bottom: 18px;
          }

          .head h1 {
            margin: 0 0 6px;
            color: #ff4f14;
            font-size: 28px;
          }

          .head p {
            margin: 4px 0;
            color: #4b5563;
            font-size: 13px;
          }

          .meta {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px 20px;
            font-size: 14px;
            margin-bottom: 18px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
          }

          th,
          td {
            border-bottom: 1px solid #e5e7eb;
            padding: 10px 8px;
            font-size: 13px;
          }

          th {
            text-align: left;
            background: #f9fafb;
          }

          .total {
            width: 330px;
            margin: 18px 0 0 auto;
            display: grid;
            gap: 8px;
          }

          .row {
            display: flex;
            justify-content: space-between;
            font-size: 14px;
          }

          .discount {
            color: #16a34a;
          }

          .grand {
            border-top: 1px dashed #9ca3af;
            padding-top: 10px;
            color: #dc2626;
            font-size: 20px;
            font-weight: 800;
          }

          .thanks {
            margin-top: 28px;
            text-align: center;
            color: #4b5563;
          }

          @media print {
            body {
              padding: 0;
            }

            .invoice {
              max-width: 100%;
            }
          }
        </style>
      </head>

      <body>
        <section class="invoice">
          <div class="head">
            <h1>Le Monde Steak</h1>
            <p>HÓA ĐƠN THANH TOÁN</p>
            <p>Cảm ơn quý khách đã sử dụng dịch vụ</p>
          </div>

          <div class="meta">
            <div><b>Số hóa đơn:</b> #${invoice.orderNumber || invoice.id}</div>
            <div><b>Bàn:</b> ${invoice.tableNumber || 'N/A'}</div>
            <div><b>Ngày tạo:</b> ${dateText(invoice.createdAt)}</div>
            <div><b>Ngày thanh toán:</b> ${dateText(invoice.updatedAt) || dateText(new Date())}</div>
          </div>

          <table>
            <thead>
              <tr>
                <th>STT</th>
                <th>Món</th>
                <th style="text-align:center">SL</th>
                <th style="text-align:right">Đơn giá</th>
                <th style="text-align:right">Thành tiền</th>
              </tr>
            </thead>

            <tbody>
              ${itemRows}
            </tbody>
          </table>

          <div class="total">
            <div class="row">
              <span>Tạm tính</span>
              <b>${money(invoice.subTotal)}</b>
            </div>

            ${Number(invoice.discountAmount || 0) > 0
            ? `
                  <div class="row discount">
                    <span>Giảm giá ${invoice.promotionName ? `(${invoice.promotionName})` : ''}</span>
                    <b>-${money(invoice.discountAmount)}</b>
                  </div>
                `
            : ''
        }

            <div class="row">
              <span>Phí dịch vụ</span>
              <b>${money(invoice.serviceCharge)}</b>
            </div>

            <div class="row">
              <span>Thuế</span>
              <b>${money(invoice.taxAmount)}</b>
            </div>

            <div class="row grand">
              <span>Tổng cộng</span>
              <b>${money(invoice.totalAmount)}</b>
            </div>
          </div>

          <div class="thanks">
            <p>Xin cảm ơn và hẹn gặp lại quý khách!</p>
          </div>
        </section>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
    </html>
  `;
}

function PaymentConfirmModal({
    order,
    paidAmount,
    paymentMethod,
    processing,
    error,
    onClose,
    onPaidAmountChange,
    onPaymentMethodChange,
    onConfirm
}) {
    if (!order) return null;

    const totalAmount = numberValue(order.totalAmount);
    const receivedAmount = numberValue(paidAmount);
    const changeAmount = receivedAmount - totalAmount;
    const items = Array.isArray(order.items) ? order.items : [];

    return (
        <div className="payment-modal-backdrop" onClick={onClose}>
            <section className="payment-confirm-modal" onClick={(event) => event.stopPropagation()}>
                <button className="payment-modal-close" type="button" onClick={onClose}>
                    <X size={18} />
                </button>

                <h2>Xác nhận Thanh toán</h2>

                <div className="payment-modal-order">
                    <span>Đơn hàng #{order.orderNumber || order.id}</span>
                    <strong>{money(totalAmount)}</strong>
                </div>

                <div className="payment-modal-divider" />

                <div className="payment-modal-items-title">Chi tiết món đã gọi</div>

                <div className="payment-modal-items">
                    {items.length ? (
                        items.map((item) => (
                            <div className="payment-modal-item" key={item.detailId}>
                                <div>
                                    <b>{item.foodName}</b>
                                    <span>
                                        {item.type === 'COMBO' ? 'Combo' : 'Món lẻ'} • SL: {item.quantity}
                                    </span>
                                </div>

                                <div>
                                    <strong>{money(item.total)}</strong>
                                    <span>({money(item.price)} / phần)</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p>Không có chi tiết món.</p>
                    )}
                </div>

                <label className="payment-form-label">
                    Số tiền nhận (đ) <em>*</em>
                </label>

                <input
                    className={error ? 'payment-input error' : 'payment-input'}
                    type="number"
                    min="0"
                    value={paidAmount}
                    onChange={(event) => onPaidAmountChange(event.target.value)}
                    placeholder="Nhập số tiền khách đưa"
                />

                {error && <div className="payment-error">⚠ {error}</div>}

                {receivedAmount > 0 && changeAmount >= 0 && (
                    <div className="payment-change-box">
                        <span>Tiền thừa:</span>
                        <b>{money(changeAmount)}</b>
                    </div>
                )}

                <label className="payment-form-label">Phương thức thanh toán</label>

                <select
                    className="payment-input"
                    value={paymentMethod}
                    onChange={(event) => onPaymentMethodChange(event.target.value)}
                >
                    <option value="CASH">Tiền mặt</option>
                    <option value="CARD">Thẻ</option>
                    <option value="MOMO">Momo</option>
                    <option value="BANK_TRANSFER">Chuyển khoản</option>
                </select>

                {paymentMethod === 'BANK_TRANSFER' && (
                    <div style={{ textAlign: 'center', background: '#fdf8f5', border: '1px dashed #ea580c', borderRadius: 16, padding: 14, marginTop: 14, marginBottom: 10 }}>
                        <div style={{ fontSize: 13, fontWeight: 900, color: '#c2410c', marginBottom: 8 }}>
                            Mã VietQR Tự Động Quét Thanh Toán
                        </div>
                        <img
                            src={`https://img.vietqr.io/image/vietinbank-113366668888-compact.jpg?amount=${Math.round(totalAmount)}&addInfo=${encodeURIComponent(`LMS Don ${order.orderNumber || order.id || ''}`)}&accountName=NHAHANG%20LEMONDE%20STEAK`}
                            alt="VietQR Staff Modal"
                            style={{ width: '100%', maxWidth: 220, borderRadius: 12, border: '1px solid #cbd5e1', boxShadow: '0 4px 14px rgba(0,0,0,0.08)' }}
                        />
                        <div style={{ fontSize: 12, color: '#475569', marginTop: 8 }}>
                            STK: <strong style={{ color: '#0f172a' }}>113366668888</strong> (VietinBank)
                            <br />
                            Chủ TK: <strong style={{ color: '#0f172a' }}>NHAHANG LEMONDE STEAK</strong>
                        </div>
                    </div>
                )}

                <div className="payment-modal-actions">
                    <button
                        className="payment-cancel-btn"
                        type="button"
                        onClick={onClose}
                        disabled={processing}
                    >
                        Hủy
                    </button>

                    <button
                        className="payment-confirm-green-btn"
                        type="button"
                        onClick={onConfirm}
                        disabled={processing}
                    >
                        {processing ? 'Đang xác nhận...' : 'Xác nhận'}
                    </button>
                </div>
            </section>
        </div>
    );
}

export default function StaffPaymentPage() {
    const [activeTab, setActiveTab] = useState('PENDING');
    const [pendingOrders, setPendingOrders] = useState([]);
    const [paidOrders, setPaidOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [processingId, setProcessingId] = useState('');

    const [confirmOrder, setConfirmOrder] = useState(null);
    const [paidAmount, setPaidAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('CASH');
    const [paymentError, setPaymentError] = useState('');
    const [groupMode, setGroupMode] = useState(true);

    const pendingCount = useMemo(() => pendingOrders.length, [pendingOrders]);
    const paidCount = useMemo(() => paidOrders.length, [paidOrders]);

    // Group pending orders by Table Number when groupMode is active
    const groupedPendingOrders = useMemo(() => {
        if (!groupMode) return pendingOrders;

        const tableMap = new Map();

        pendingOrders.forEach((ord) => {
            const rawTable = String(ord.tableNumber || ord.tableName || 'Khác').trim();
            const key = rawTable.toUpperCase();

            if (!tableMap.has(key)) {
                tableMap.set(key, {
                    ...ord,
                    isMerged: false,
                    orderIds: [ord.id],
                    orderNumbers: [ord.orderNumber || ord.id],
                    items: [...(ord.items || [])],
                    subTotal: Number(ord.subTotal || ord.totalAmount || 0),
                    discountAmount: Number(ord.discountAmount || 0),
                    totalAmount: Number(ord.totalAmount || 0)
                });
            } else {
                const existing = tableMap.get(key);
                existing.isMerged = true;
                existing.orderIds.push(ord.id);
                existing.orderNumbers.push(ord.orderNumber || ord.id);
                existing.items = [...existing.items, ...(ord.items || [])];
                existing.subTotal += Number(ord.subTotal || ord.totalAmount || 0);
                existing.discountAmount += Number(ord.discountAmount || 0);
                existing.totalAmount += Number(ord.totalAmount || 0);
            }
        });

        return Array.from(tableMap.values());
    }, [pendingOrders, groupMode]);

    const orders = activeTab === 'PAID' ? paidOrders : groupedPendingOrders;

    const loadPayments = async (silent = false) => {
        if (!silent) {
            setLoading(true);
            setMessage('');
        }

        try {
            const [pendingData, paidData] = await Promise.all([
                api('/api/staff/payments?status=PENDING'),
                api('/api/staff/payments?status=PAID')
            ]);

            setPendingOrders(Array.isArray(pendingData) ? pendingData : []);
            setPaidOrders(Array.isArray(paidData) ? paidData : []);
        } catch (err) {
            if (!silent) {
                setMessage(err.message || 'Không tải được danh sách thanh toán.');
            }
        } finally {
            if (!silent) {
                setLoading(false);
            }
        }
    };

    const openConfirmModal = async (order) => {
        setMessage('');
        setPaymentError('');
        setPaymentMethod('CASH');
        setPaidAmount(String(Math.round(Number(order.totalAmount || 0))));

        if (order.isMerged) {
            setConfirmOrder(order);
            return;
        }

        try {
            const invoice = await api(`/api/staff/payments/${order.id}/invoice`);
            setConfirmOrder(invoice);
        } catch {
            setConfirmOrder(order);
        }
    };

    const closeConfirmModal = () => {
        if (processingId) return;

        setConfirmOrder(null);
        setPaidAmount('');
        setPaymentMethod('CASH');
        setPaymentError('');
    };

    const confirmPayment = async () => {
        if (!confirmOrder) return;

        const totalAmount = Number(confirmOrder.totalAmount || 0);
        const receivedAmount = Number(paidAmount || 0);

        if (!paidAmount || receivedAmount <= 0) {
            setPaymentError('Vui lòng nhập số tiền nhận từ khách.');
            return;
        }

        if (receivedAmount < totalAmount) {
            setPaymentError(`Số tiền nhận phải lớn hơn hoặc bằng ${money(totalAmount)}.`);
            return;
        }

        setProcessingId(confirmOrder.id);
        setPaymentError('');
        setMessage('');

        try {
            if (confirmOrder.orderIds && confirmOrder.orderIds.length > 1) {
                // Confirm payment for all merged sub-orders of this table
                for (const id of confirmOrder.orderIds) {
                    await api(`/api/staff/orders/${id}/confirm-payment`, {
                        method: 'POST',
                        body: {
                            paidAmount: Math.round(receivedAmount / confirmOrder.orderIds.length),
                            paymentMethod
                        }
                    });
                }
            } else {
                await api(`/api/staff/orders/${confirmOrder.id}/confirm-payment`, {
                    method: 'POST',
                    body: {
                        paidAmount: receivedAmount,
                        paymentMethod
                    }
                });
            }

            setMessage('Xác nhận thanh toán toàn bộ bàn thành công.');
            setConfirmOrder(null);
            setPaidAmount('');
            setPaymentMethod('CASH');

            await loadPayments(true);
            setActiveTab('PAID');
        } catch (err) {
            setPaymentError(err.message || 'Xác nhận thanh toán thất bại.');
        } finally {
            setProcessingId('');
        }
    };

    const printInvoice = async (order) => {
        setProcessingId(order.id);
        setMessage('');

        try {
            const invoice = await api(`/api/staff/payments/${order.id}/invoice`);
            const printWindow = window.open('', '_blank', 'width=820,height=900');

            if (!printWindow) {
                setMessage('Trình duyệt đã chặn cửa sổ in hóa đơn.');
                return;
            }

            printWindow.document.open();
            printWindow.document.write(buildInvoiceHtml(invoice));
            printWindow.document.close();
        } catch (err) {
            setMessage(err.message || 'Không in được hóa đơn.');
        } finally {
            setProcessingId('');
        }
    };

    useEffect(() => {
        loadPayments(false);

        const timer = window.setInterval(() => {
            loadPayments(true);
        }, 2500);

        return () => window.clearInterval(timer);
    }, []);

    return (
        <main className="staff-page payment-page">
            <section className="staff-page-head">
                <div>
                    <h1>Thanh toán</h1>
                    <p>Danh sách bàn đang yêu cầu thanh toán và hóa đơn đã thanh toán.</p>
                </div>

                <button
                    className="staff-refresh-btn"
                    type="button"
                    onClick={() => loadPayments(false)}
                    disabled={loading}
                >
                    <RefreshCw size={16} />
                    Làm mới
                </button>
            </section>

            <section className="payment-tabs" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button
                        type="button"
                        className={activeTab === 'PENDING' ? 'active' : ''}
                        onClick={() => setActiveTab('PENDING')}
                    >
                        Chờ thanh toán ({pendingCount})
                    </button>

                    <button
                        type="button"
                        className={activeTab === 'PAID' ? 'active' : ''}
                        onClick={() => setActiveTab('PAID')}
                    >
                        Đã thanh toán ({paidCount})
                    </button>
                </div>

                {activeTab === 'PENDING' && (
                    <button
                        type="button"
                        onClick={() => setGroupMode(!groupMode)}
                        style={{
                            background: groupMode ? '#fff5f2' : '#f1f5f9',
                            color: groupMode ? '#e63917' : '#475569',
                            border: groupMode ? '1px solid #feccae' : '1px solid #cbd5e1',
                            padding: '6px 14px',
                            borderRadius: 999,
                            fontWeight: 850,
                            fontSize: 12.5,
                            cursor: 'pointer'
                        }}
                    >
                        {groupMode ? '🔀 Ghép đơn cùng bàn (Đang bật)' : '📋 Tách riêng từng đơn'}
                    </button>
                )}
            </section>

            {message && <div className="staff-message">{message}</div>}

            {loading ? (
                <section className="staff-empty-box">
                    <p>Đang tải danh sách thanh toán...</p>
                </section>
            ) : orders.length ? (
                <section className="payment-grid">
                    {orders.map((order) => (
                        <article className="payment-card" key={order.id}>
                            <div className="payment-card-head">
                                <div>
                                    <h2>{tableLabel(order)}</h2>
                                    <p>
                                        {order.isMerged
                                            ? `Ghép ${order.orderNumbers.length} đơn: #${order.orderNumbers.join(', #')}`
                                            : `Đơn hàng #${order.orderNumber || order.id}`}
                                    </p>
                                    <span>{dateText(order.updatedAt || order.createdAt)}</span>
                                </div>

                                <strong style={{ color: '#e63917', fontSize: 18 }}>{money(order.totalAmount)}</strong>
                            </div>

                            <div className="payment-items">
                                {Array.isArray(order.items) && order.items.length ? (
                                    order.items.map((item) => (
                                        <div className="payment-item" key={item.detailId}>
                                            <div>
                                                <b>{item.quantity}x {item.foodName}</b>
                                                <span>{itemStatusLabel(item.status)}</span>
                                            </div>

                                            <strong>{money(item.total)}</strong>
                                        </div>
                                    ))
                                ) : (
                                    <p>Không có chi tiết món.</p>
                                )}
                            </div>

                            <div className="payment-summary">
                                <div>
                                    <span>Tạm tính</span>
                                    <b>{money(order.subTotal)}</b>
                                </div>

                                {Number(order.discountAmount || 0) > 0 && (
                                    <div className="discount">
                                        <span>
                                            Giảm giá {order.promotionName ? `(${order.promotionName})` : ''}
                                        </span>
                                        <b>-{money(order.discountAmount)}</b>
                                    </div>
                                )}

                                <div className="total">
                                    <span>Tổng cộng</span>
                                    <b>{money(order.totalAmount)}</b>
                                </div>
                            </div>

                            {activeTab === 'PENDING' ? (
                                <button
                                    className="payment-confirm-btn"
                                    type="button"
                                    onClick={() => openConfirmModal(order)}
                                    disabled={processingId === order.id}
                                >
                                    Xác nhận thanh toán
                                </button>
                            ) : (
                                <button
                                    className="payment-print-btn"
                                    type="button"
                                    onClick={() => printInvoice(order)}
                                    disabled={processingId === order.id}
                                >
                                    <Printer size={16} />
                                    {processingId === order.id ? 'Đang mở hóa đơn...' : 'In hóa đơn'}
                                </button>
                            )}
                        </article>
                    ))}
                </section>
            ) : (
                <section className="staff-empty-box">
                    <h3>
                        {activeTab === 'PENDING'
                            ? 'Chưa có bàn yêu cầu thanh toán'
                            : 'Chưa có hóa đơn đã thanh toán'}
                    </h3>

                    <p>
                        {activeTab === 'PENDING'
                            ? 'Khi khách bấm thanh toán, đơn sẽ xuất hiện tại đây.'
                            : 'Các hóa đơn đã thanh toán sẽ hiển thị tại đây để in lại.'}
                    </p>
                </section>
            )}

            <PaymentConfirmModal
                order={confirmOrder}
                paidAmount={paidAmount}
                paymentMethod={paymentMethod}
                processing={Boolean(processingId)}
                error={paymentError}
                onClose={closeConfirmModal}
                onPaidAmountChange={(value) => {
                    setPaidAmount(value);
                    setPaymentError('');
                }}
                onPaymentMethodChange={setPaymentMethod}
                onConfirm={confirmPayment}
            />
        </main>
    );
}