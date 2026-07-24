import {
    Copy,
    CreditCard,
    Printer,
    QrCode,
    ReceiptText,
    RefreshCw,
    Utensils,
    X
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api.js';
import {
    buildTableQrLink,
    getQrImageUrl,
    printQr
} from '../utils/qr.js';
import {
    money,
    paymentMethodLabel,
    printInvoice
} from '../utils/invoice.js';
import './table-management.css';
import './invoice-payment.css';

const TABLE_STATUS_OPTIONS = [
    {
        value: 'EMPTY',
        label: 'Trống',
        className: 'empty'
    },
    {
        value: 'OCCUPIED',
        label: 'Đang dùng bữa',
        className: 'occupied'
    },
    {
        value: 'PAYMENT_REQUEST',
        label: 'Yêu cầu thanh toán',
        className: 'payment'
    }
];

function getStatusOption(status) {
    return (
        TABLE_STATUS_OPTIONS.find((item) => item.value === status) ||
        TABLE_STATUS_OPTIONS[0]
    );
}

function sortTables(tables) {
    return [...tables].sort((a, b) => {
        const numberA = Number(String(a.tableNumber || '').replace(/\D/g, ''));
        const numberB = Number(String(b.tableNumber || '').replace(/\D/g, ''));

        if (!Number.isNaN(numberA) && !Number.isNaN(numberB)) {
            return numberA - numberB;
        }

        return String(a.tableNumber || '').localeCompare(
            String(b.tableNumber || ''),
            'vi'
        );
    });
}

function QrModal({ table, onClose }) {
    const [copied, setCopied] = useState(false);

    const qrLink = useMemo(() => buildTableQrLink(table), [table]);
    const qrImageUrl = useMemo(() => getQrImageUrl(qrLink, 260), [qrLink]);

    const copyLink = async () => {
        await navigator.clipboard.writeText(qrLink);
        setCopied(true);

        setTimeout(() => {
            setCopied(false);
        }, 1600);
    };

    const handlePrint = () => {
        printQr({
            table,
            qrLink,
            qrImageUrl
        });
    };

    return (
        <div className="qr-modal-backdrop" onClick={onClose}>
            <section className="qr-modal" onClick={(event) => event.stopPropagation()}>
                <header className="qr-modal-head">
                    <div>
                        <h2>Mã QR Đặt Món</h2>
                        <p>Quét mã QR để xem thực đơn và đặt món cho bàn {table.tableNumber}.</p>
                    </div>

                    <button className="qr-close" type="button" onClick={onClose}>
                        <X size={18} />
                    </button>
                </header>

                <div className="qr-code-box">
                    <img src={qrImageUrl} alt={`QR bàn ${table.tableNumber}`} />
                </div>

                <div className="qr-link-box">
                    <label>Link đặt món</label>

                    <div className="qr-link-row">
                        <input value={qrLink} readOnly />

                        <button type="button" onClick={copyLink}>
                            <Copy size={15} />
                            {copied ? 'Đã copy' : 'Copy'}
                        </button>
                    </div>
                </div>

                <p className="qr-note">
                    Mỗi mã QR chứa mã bàn và thời gian tạo. QR có hiệu lực trong 12 giờ kể
                    từ lúc tạo.
                </p>

                <div className="qr-modal-actions">
                    <button className="qr-print-btn" type="button" onClick={handlePrint}>
                        <Printer size={16} />
                        In QR
                    </button>
                </div>
            </section>
        </div>
    );
}

function PaymentModal({ table, onClose, onPaid }) {
    const [order, setOrder] = useState(null);
    const [paidAmount, setPaidAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('CASH');
    const [loading, setLoading] = useState(false);
    const [paying, setPaying] = useState(false);
    const [error, setError] = useState('');

    const totalAmount = Number(order?.totalAmount || 0);
    const receivedAmount = Number(paidAmount || 0);
    const changeAmount = Math.max(0, receivedAmount - totalAmount);
    const isEnoughMoney = receivedAmount >= totalAmount;

    const loadOrder = async () => {
        setLoading(true);
        setError('');

        try {
            const data = await api(`/api/staff/billing/tables/${table.id}/active-order`);
            setOrder(data);
            setPaidAmount(String(Math.round(Number(data.totalAmount || 0))));
        } catch (err) {
            setError(err.message || 'Không tải được hóa đơn của bàn.');
        } finally {
            setLoading(false);
        }
    };

    const confirmPayment = async () => {
        if (!order) return;

        if (!isEnoughMoney) {
            setError(
                `Số tiền nhận phải lớn hơn hoặc bằng ${money(order.totalAmount)}`
            );
            return;
        }

        setPaying(true);
        setError('');

        try {
            const invoice = await api(`/api/staff/billing/orders/${order.orderId}/pay`, {
                method: 'POST',
                body: {
                    paidAmount: receivedAmount,
                    paymentMethod,
                    note: ''
                }
            });

            printInvoice(invoice);
            onPaid(invoice);
        } catch (err) {
            setError(err.message || 'Xác nhận thanh toán thất bại.');
        } finally {
            setPaying(false);
        }
    };

    useEffect(() => {
        loadOrder();
    }, [table.id]);

    return (
        <div className="payment-backdrop" onClick={onClose}>
            <section className="payment-modal" onClick={(event) => event.stopPropagation()}>
                <header className="payment-head">
                    <div>
                        <h2>Xác nhận Thanh toán</h2>
                        <p>Bàn {table.tableNumber}</p>
                    </div>

                    <button type="button" onClick={onClose}>
                        <X size={18} />
                    </button>
                </header>

                {loading ? (
                    <div className="payment-loading">
                        <CreditCard size={32} />
                        <p>Đang tải hóa đơn...</p>
                    </div>
                ) : error && !order ? (
                    <div className="payment-error-box">
                        <ReceiptText size={34} />
                        <h3>Không có hóa đơn</h3>
                        <p>{error}</p>

                        <button type="button" onClick={onClose}>
                            Đóng
                        </button>
                    </div>
                ) : order ? (
                    <>
                        <section className="payment-total-box">
                            <span>Đơn hàng #{order.orderNumber}</span>
                            <strong>{money(order.totalAmount)}</strong>
                        </section>

                        <section className="payment-lines">
                            <h3>Chi tiết món đã gọi</h3>

                            {order.items.map((item) => (
                                <article key={item.detailId} className="payment-line">
                                    <div>
                                        <b>{item.foodName}</b>
                                        <span>
                                            {item.foodType === 'combo' ? 'Combo' : 'Món lẻ'} · SL: {item.quantity}
                                        </span>
                                    </div>

                                    <div>
                                        <strong>{money(item.lineTotal)}</strong>
                                        <small>
                                            {money(item.price)} / phần
                                        </small>
                                    </div>
                                </article>
                            ))}
                        </section>

                        <section className="payment-field">
                            <label>
                                Số tiền nhận (đ) <b>*</b>
                            </label>

                            <input
                                value={paidAmount}
                                onChange={(event) =>
                                    setPaidAmount(event.target.value.replace(/[^\d]/g, ''))
                                }
                                inputMode="numeric"
                                placeholder="Nhập số tiền khách đưa"
                            />

                            {!isEnoughMoney && (
                                <p className="payment-warning">
                                    Số tiền nhận phải lớn hơn hoặc bằng {money(order.totalAmount)}
                                </p>
                            )}

                            {isEnoughMoney && receivedAmount > totalAmount && (
                                <div className="payment-change">
                                    <span>Tiền thừa:</span>
                                    <strong>{money(changeAmount)}</strong>
                                </div>
                            )}
                        </section>

                        <section className="payment-field">
                            <label>Phương thức thanh toán</label>

                            <select
                                value={paymentMethod}
                                onChange={(event) => setPaymentMethod(event.target.value)}
                            >
                                <option value="CASH">Tiền mặt</option>
                                <option value="CARD">Thẻ</option>
                                <option value="MOMO">Momo</option>
                                <option value="BANK_TRANSFER">Chuyển khoản</option>
                            </select>

                            <small>Đang chọn: {paymentMethodLabel(paymentMethod)}</small>
                        </section>

                        {error && <div className="payment-error">{error}</div>}

                        <footer className="payment-actions">
                            <button className="payment-cancel" type="button" onClick={onClose}>
                                Hủy
                            </button>

                            <button
                                className="payment-confirm"
                                type="button"
                                disabled={paying || !isEnoughMoney}
                                onClick={confirmPayment}
                            >
                                {paying ? 'Đang xác nhận...' : 'Xác nhận'}
                            </button>
                        </footer>
                    </>
                ) : null}
            </section>
        </div>
    );
}

function TableCard({
    table,
    onChangeStatus,
    onOpenQr,
    onOpenPayment,
    onMessage
}) {
    const statusOption = getStatusOption(table.status);
    const canCreateQr = table.status === 'EMPTY';
    const canPay = table.status === 'OCCUPIED' || table.status === 'PAYMENT_REQUEST';

    const handleCardClick = () => {
        if (canCreateQr) {
            onOpenQr(table);
            return;
        }

        if (canPay) {
            onOpenPayment(table);
            return;
        }

        onMessage(`Không thể thao tác với trạng thái bàn ${table.tableNumber}.`);
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            handleCardClick();
        }
    };

    const stopOpen = (event) => {
        event.stopPropagation();
    };

    return (
        <article
            className={`staff-table-card ${statusOption.className}`}
            onClick={handleCardClick}
            onKeyDown={handleKeyDown}
            role="button"
            tabIndex={0}
            title={
                canCreateQr
                    ? 'Bấm để tạo mã QR đặt món'
                    : 'Bấm để xem và xuất hóa đơn'
            }
        >
            <div className="staff-table-content">
                <h3>Bàn {table.tableNumber}</h3>

                <p>{table.capacity} chỗ ngồi</p>

                <span className="staff-table-status">{statusOption.label}</span>

                <small className="staff-table-hint">
                    {canCreateQr ? 'Bấm để tạo QR' : 'Bấm để thanh toán'}
                </small>
            </div>

            <div className="staff-table-actions" onClick={stopOpen}>
                <select
                    value={table.status}
                    onChange={(event) => onChangeStatus(table, event.target.value)}
                >
                    {TABLE_STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>

                {canCreateQr ? (
                    <button
                        className="staff-qr-btn"
                        type="button"
                        onClick={() => onOpenQr(table)}
                    >
                        <QrCode size={15} />
                        QR
                    </button>
                ) : (
                    <button
                        className="staff-pay-btn"
                        type="button"
                        onClick={() => onOpenPayment(table)}
                    >
                        <ReceiptText size={15} />
                        HĐ
                    </button>
                )}
            </div>
        </article>
    );
}

export default function TableManagementPage() {
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(false);
    const [changingId, setChangingId] = useState('');
    const [message, setMessage] = useState('');
    const [qrTable, setQrTable] = useState(null);
    const [paymentTable, setPaymentTable] = useState(null);

    const sortedTables = useMemo(() => sortTables(tables), [tables]);

    const counts = useMemo(() => {
        return sortedTables.reduce(
            (result, table) => {
                if (table.status === 'OCCUPIED') result.occupied += 1;
                else if (table.status === 'PAYMENT_REQUEST') result.payment += 1;
                else result.empty += 1;

                return result;
            },
            {
                empty: 0,
                occupied: 0,
                payment: 0
            }
        );
    }, [sortedTables]);

    const loadTables = async () => {
        setLoading(true);
        setMessage('');

        try {
            const data = await api('/api/staff/tables');
            setTables(Array.isArray(data) ? data : []);
        } catch (err) {
            setMessage(err.message || 'Hệ thống tải trang không thành công.');
        } finally {
            setLoading(false);
        }
    };

    const changeTableStatus = async (table, nextStatus) => {
        if (table.status === nextStatus) return;

        setChangingId(table.id);
        setMessage('');

        try {
            const updatedTable = await api(`/api/staff/tables/${table.id}/status`, {
                method: 'PATCH',
                body: {
                    status: nextStatus
                }
            });

            setTables((currentTables) =>
                currentTables.map((item) =>
                    item.id === table.id ? updatedTable : item
                )
            );

            setMessage(`Đã cập nhật trạng thái bàn ${table.tableNumber}.`);
        } catch (err) {
            setMessage(err.message || 'Không cập nhật được trạng thái bàn ăn.');
        } finally {
            setChangingId('');
        }
    };

    const handlePaid = (invoice) => {
        setPaymentTable(null);
        setMessage(
            `Đã thanh toán hóa đơn ${invoice.invoiceNumber}. Bàn ${invoice.tableNumber} đã chuyển về Trống.`
        );
        loadTables();
    };

    useEffect(() => {
        loadTables();
    }, []);

    return (
        <main className="staff-page">
            <section className="staff-toolbar">
                <div>
                    <h1>Quản lý Bàn</h1>
                    <p>
                        Bàn trống dùng để tạo QR. Bàn có khách dùng để xem và xuất hóa đơn.
                    </p>
                </div>

                <button type="button" onClick={loadTables} disabled={loading}>
                    <RefreshCw size={16} />
                    {loading ? 'Đang tải...' : 'Làm mới'}
                </button>
            </section>

            <section className="staff-legend">
                <span>
                    <i className="dot empty" />
                    Trống: {counts.empty}
                </span>

                <span>
                    <i className="dot occupied" />
                    Đang dùng bữa: {counts.occupied}
                </span>

                <span>
                    <i className="dot payment" />
                    Yêu cầu thanh toán: {counts.payment}
                </span>
            </section>

            {message && <div className="staff-message">{message}</div>}

            {loading ? (
                <section className="staff-empty">
                    <Utensils size={36} />
                    <p>Đang tải danh sách bàn ăn...</p>
                </section>
            ) : sortedTables.length ? (
                <section className="staff-table-grid">
                    {sortedTables.map((table) => (
                        <div
                            key={table.id}
                            className={changingId === table.id ? 'updating' : ''}
                        >
                            <TableCard
                                table={table}
                                onChangeStatus={changeTableStatus}
                                onOpenQr={setQrTable}
                                onOpenPayment={setPaymentTable}
                                onMessage={setMessage}
                            />
                        </div>
                    ))}
                </section>
            ) : (
                <section className="staff-empty">
                    <Utensils size={36} />
                    <h3>Chưa có bàn ăn</h3>
                    <p>Hệ thống chưa có dữ liệu bàn ăn để hiển thị.</p>
                </section>
            )}

            {qrTable && (
                <QrModal table={qrTable} onClose={() => setQrTable(null)} />
            )}

            {paymentTable && (
                <PaymentModal
                    table={paymentTable}
                    onClose={() => setPaymentTable(null)}
                    onPaid={handlePaid}
                />
            )}
        </main>
    );
}