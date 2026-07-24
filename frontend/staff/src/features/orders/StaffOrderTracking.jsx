import { useEffect, useMemo, useState } from 'react';
import './orderTracking.css';

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    'http://localhost:8080';

function getAuth() {
    const keys = [
        'staffAuth',
        'adminAuth',
        'auth',
        'userAuth',
        'customerAuth'
    ];

    for (const key of keys) {
        try {
            const value = JSON.parse(localStorage.getItem(key) || 'null');
            if (value) return value;
        } catch {
            // bỏ qua
        }
    }

    return null;
}

function getToken() {
    const auth = getAuth();
    return auth?.token || auth?.accessToken || auth?.jwt || '';
}

async function apiFetch(path, options = {}) {
    const token = getToken();

    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined
    });

    const text = await response.text();

    let data = null;

    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        data = text;
    }

    if (!response.ok) {
        throw new Error(data?.message || data?.error || data || `Lỗi ${response.status}`);
    }

    return data;
}

function money(value) {
    return new Intl.NumberFormat('vi-VN').format(Number(value || 0)) + 'đ';
}

function formatTime(value) {
    if (!value) return '--:--';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value).slice(11, 19);
    }

    return date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

function formatDate(value) {
    if (!value) return '';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value).slice(0, 10);
    }

    return date.toLocaleDateString('vi-VN');
}

function normalizeStatus(status) {
    return String(status || 'WAITING').toUpperCase();
}

function statusLabel(status) {
    const value = normalizeStatus(status);

    if (value === 'COOKING') return 'Đang làm';
    if (value === 'DONE') return 'Xong món';
    if (value === 'SERVED') return 'Đã phục vụ';

    return 'Chờ làm';
}

function statusClass(status) {
    const value = normalizeStatus(status);

    if (value === 'COOKING') return 'is-cooking';
    if (value === 'DONE') return 'is-done';
    if (value === 'SERVED') return 'is-served';

    return 'is-waiting';
}

function nextStatus(status) {
    const value = normalizeStatus(status);

    if (value === 'WAITING') return 'COOKING';
    if (value === 'COOKING') return 'DONE';
    if (value === 'DONE') return 'SERVED';

    return null;
}

function actionLabel(status) {
    const value = normalizeStatus(status);

    if (value === 'WAITING') return '▶ Bắt đầu';
    if (value === 'COOKING') return '✓ Xong món';
    if (value === 'DONE') return '✓ Đã phục vụ';

    return 'Đã phục vụ';
}

function tableName(value) {
    if (!value || value === 'N/A') return 'N/A';

    const text = String(value).trim();

    if (text.toLowerCase().startsWith('bàn')) return text;

    return `Bàn ${text}`;
}

function normalizeOrders(data) {
    if (!Array.isArray(data)) return [];

    return data.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        createdAt: order.createdAt,
        orderStatus: order.orderStatus,
        tableId: order.tableId,
        tableNumber: order.tableNumber || 'N/A',
        details: Array.isArray(order.details) ? order.details : []
    }));
}

export default function StaffOrderTracking() {
    const [orders, setOrders] = useState([]);
    const [viewMode, setViewMode] = useState('byOrder');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [loading, setLoading] = useState(false);
    const [updatingId, setUpdatingId] = useState('');
    const [error, setError] = useState('');

    const loadOrders = async () => {
        setLoading(true);
        setError('');

        try {
            const data = await apiFetch('/api/staff/orders');
            setOrders(normalizeOrders(data));
        } catch (err) {
            setError(
                err.message ||
                'Không tải được danh sách đơn hàng. Kiểm tra backend đã có API /api/staff/orders chưa.'
            );
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (detailId, currentStatus) => {
        const next = nextStatus(currentStatus);

        if (!next) return;

        setUpdatingId(detailId);
        setError('');

        try {
            await apiFetch(`/api/staff/order-details/${detailId}/status`, {
                method: 'PATCH',
                body: {
                    status: next
                }
            });

            await loadOrders();
        } catch (err) {
            setError(err.message || 'Không cập nhật được trạng thái món.');
        } finally {
            setUpdatingId('');
        }
    };

    const filteredOrders = useMemo(() => {
        if (statusFilter === 'ALL') return orders;

        return orders
            .map((order) => ({
                ...order,
                details: order.details.filter(
                    (detail) => normalizeStatus(detail.status) === statusFilter
                )
            }))
            .filter((order) => order.details.length > 0);
    }, [orders, statusFilter]);

    const flatItems = useMemo(() => {
        return filteredOrders.flatMap((order) =>
            order.details.map((detail) => ({
                ...detail,
                orderId: order.id,
                orderNumber: order.orderNumber,
                createdAt: order.createdAt,
                tableId: order.tableId,
                tableNumber: order.tableNumber
            }))
        );
    }, [filteredOrders]);

    useEffect(() => {
        loadOrders();
    }, []);

    return (
        <section className="lemon-staff-orders">
            <div className="lemon-view-tabs">
                <button
                    type="button"
                    className={viewMode === 'byOrder' ? 'active' : ''}
                    onClick={() => setViewMode('byOrder')}
                >
                    Xem theo Đơn hàng
                </button>

                <button
                    type="button"
                    className={viewMode === 'byItem' ? 'active purple' : ''}
                    onClick={() => setViewMode('byItem')}
                >
                    Xem theo Món ăn
                </button>
            </div>

            {viewMode === 'byItem' && (
                <div className="lemon-status-filter">
                    {[
                        ['ALL', 'Tất cả'],
                        ['WAITING', 'Chờ làm'],
                        ['COOKING', 'Đang làm'],
                        ['DONE', 'Đã xong']
                    ].map(([value, label]) => (
                        <button
                            key={value}
                            type="button"
                            className={statusFilter === value ? `active ${value.toLowerCase()}` : ''}
                            onClick={() => setStatusFilter(value)}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            )}

            <div className="lemon-order-actions">
                <button type="button" onClick={loadOrders} disabled={loading}>
                    ↻ Làm mới
                </button>
            </div>

            {error && <div className="lemon-order-error">Lỗi hệ thống: {error}</div>}

            {loading && <div className="lemon-order-empty">Đang tải đơn hàng...</div>}

            {!loading && viewMode === 'byOrder' && (
                <>
                    {filteredOrders.length > 0 ? (
                        <div className="lemon-order-grid">
                            {filteredOrders.map((order) => (
                                <article className="lemon-order-card" key={order.id}>
                                    <div className="order-card-title">
                                        <div>
                                            <h3>{tableName(order.tableNumber)}</h3>
                                            <p>
                                                {formatTime(order.createdAt)} {formatDate(order.createdAt)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="order-card-section-title">Món ăn:</div>

                                    <div className="order-items-list">
                                        {order.details.map((detail) => (
                                            <div className="order-item-line" key={detail.id}>
                                                <div className="order-item-info">
                                                    <strong>
                                                        {detail.quantity}x {detail.foodName}
                                                    </strong>

                                                    {detail.type === 'COMBO' && <span>Combo</span>}

                                                    <small>
                                                        {money(Number(detail.price || 0) * Number(detail.quantity || 0))}
                                                    </small>
                                                </div>

                                                <button
                                                    type="button"
                                                    className={`order-status-btn ${statusClass(detail.status)}`}
                                                    disabled={!nextStatus(detail.status) || updatingId === detail.id}
                                                    onClick={() => updateStatus(detail.id, detail.status)}
                                                >
                                                    {updatingId === detail.id ? '...' : actionLabel(detail.status)}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <div className="lemon-order-empty">Chưa có đơn hàng đang hoạt động.</div>
                    )}
                </>
            )}

            {!loading && viewMode === 'byItem' && (
                <>
                    {flatItems.length > 0 ? (
                        <div className="lemon-food-grid">
                            {flatItems.map((item) => (
                                <article
                                    className={`lemon-food-card ${statusClass(item.status)}`}
                                    key={item.id}
                                >
                                    <div className="food-card-top">
                                        <h3>{item.foodName}</h3>
                                        <span>{statusLabel(item.status)}</span>
                                    </div>

                                    <b>x{item.quantity}</b>

                                    <p>
                                        Bàn: <strong>{item.tableNumber}</strong>
                                    </p>

                                    <p>Thời gian: {formatTime(item.createdAt)}</p>

                                    <p>
                                        Giá:{' '}
                                        {money(Number(item.price || 0) * Number(item.quantity || 0))}
                                    </p>

                                    <button
                                        type="button"
                                        disabled={!nextStatus(item.status) || updatingId === item.id}
                                        onClick={() => updateStatus(item.id, item.status)}
                                    >
                                        {updatingId === item.id ? 'Đang cập nhật...' : actionLabel(item.status)}
                                    </button>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <div className="lemon-order-empty">Không có món ăn phù hợp.</div>
                    )}
                </>
            )}
        </section>
    );
}