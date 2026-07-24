import { RefreshCw, Search, Utensils } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api.js';
import './order-tracking.css';

function money(value) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(Number(value || 0));
}

function formatDateTime(value) {
    if (!value) return 'Không rõ thời gian';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return 'Không rõ thời gian';
    }

    return date.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

const STATUS_META = {
    WAITING: {
        label: 'Chờ làm',
        chip: 'Chờ làm',
        className: 'waiting',
        nextButton: 'Bắt đầu'
    },
    PREPARING: {
        label: 'Đang làm',
        chip: 'Đang làm',
        className: 'preparing',
        nextButton: 'Xong món'
    },
    DONE: {
        label: 'Đã xong',
        chip: 'Đã xong',
        className: 'done',
        nextButton: 'Đã phục vụ'
    },
    SERVED: {
        label: 'Đã phục vụ',
        chip: 'Đã phục vụ',
        className: 'served',
        nextButton: 'Đã phục vụ'
    }
};

const STATUS_FILTERS = [
    {
        value: 'ALL',
        label: 'Tất cả'
    },
    {
        value: 'WAITING',
        label: 'Chờ làm'
    },
    {
        value: 'PREPARING',
        label: 'Đang làm'
    },
    {
        value: 'DONE',
        label: 'Đã xong'
    },
    {
        value: 'SERVED',
        label: 'Đã phục vụ'
    }
];

function getStatusMeta(status) {
    return STATUS_META[status] || STATUS_META.WAITING;
}

function StatusButton({ item, onNextStatus, updatingId }) {
    const statusMeta = getStatusMeta(item.status);
    const isServed = item.status === 'SERVED';
    const isUpdating = updatingId === item.detailId;

    return (
        <button
            className={`status-action ${statusMeta.className}`}
            type="button"
            disabled={isServed || isUpdating}
            onClick={() => onNextStatus(item)}
        >
            {isUpdating ? 'Đang cập nhật...' : statusMeta.nextButton}
        </button>
    );
}

function OrderFoodLine({ item, onNextStatus, updatingId }) {
    const statusMeta = getStatusMeta(item.status);

    return (
        <article className="order-food-line">
            <div className="food-line-left">
                <div>
                    <b>
                        {item.quantity} x {item.foodName}
                    </b>

                    <span>{money(Number(item.price || 0) * Number(item.quantity || 0))}</span>
                </div>

                {item.foodType === 'combo' && <i>Combo</i>}
            </div>

            <div className="food-line-right">
                <span className={`food-status-chip ${statusMeta.className}`}>
                    {statusMeta.chip}
                </span>

                <StatusButton
                    item={item}
                    onNextStatus={onNextStatus}
                    updatingId={updatingId}
                />
            </div>
        </article>
    );
}

function OrderCard({ order, onNextStatus, updatingId }) {
    return (
        <section className="order-card">
            <header className="order-card-head">
                <div>
                    <h3>Bàn {order.tableNumber}</h3>
                    <p>{formatDateTime(order.createdAt)}</p>
                </div>

                <span>#{order.orderNumber}</span>
            </header>

            <div className="order-card-body">
                <p className="order-card-label">Món ăn:</p>

                {order.items.map((item) => (
                    <OrderFoodLine
                        key={item.detailId}
                        item={item}
                        onNextStatus={onNextStatus}
                        updatingId={updatingId}
                    />
                ))}
            </div>
        </section>
    );
}

function FoodOrderedCard({ item, onNextStatus, updatingId }) {
    const statusMeta = getStatusMeta(item.status);

    return (
        <article className={`food-ordered-card ${statusMeta.className}`}>
            <header className="food-ordered-head">
                <div>
                    <h3>{item.foodName}</h3>
                    <strong>x{item.quantity}</strong>
                </div>

                <span className={`food-status-chip ${statusMeta.className}`}>
                    {statusMeta.chip}
                </span>
            </header>

            <div className="food-ordered-info">
                <p>
                    Bàn: <b>{item.tableNumber}</b>
                </p>

                <p>
                    Thời gian: <b>{formatDateTime(item.createdAt)}</b>
                </p>

                <p>
                    Giá:{' '}
                    <b>
                        {money(Number(item.price || 0) * Number(item.quantity || 0))}
                    </b>
                </p>

                {item.foodType === 'combo' && <em>Combo</em>}
            </div>

            <StatusButton
                item={item}
                onNextStatus={onNextStatus}
                updatingId={updatingId}
            />
        </article>
    );
}

export default function OrderTrackingPage() {
    const [ordersByTable, setOrdersByTable] = useState([]);
    const [foodsOrdered, setFoodsOrdered] = useState([]);
    const [viewMode, setViewMode] = useState('order');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [loading, setLoading] = useState(false);
    const [updatingId, setUpdatingId] = useState('');
    const [message, setMessage] = useState('');

    const filteredFoodsOrdered = useMemo(() => {
        if (statusFilter === 'ALL') return foodsOrdered;

        return foodsOrdered.filter((item) => item.status === statusFilter);
    }, [foodsOrdered, statusFilter]);

    const statusCounts = useMemo(() => {
        return foodsOrdered.reduce(
            (result, item) => {
                result.ALL += 1;
                result[item.status] = (result[item.status] || 0) + 1;
                return result;
            },
            {
                ALL: 0,
                WAITING: 0,
                PREPARING: 0,
                DONE: 0,
                SERVED: 0
            }
        );
    }, [foodsOrdered]);

    const loadData = async () => {
        setLoading(true);
        setMessage('');

        try {
            const [ordersData, foodsData] = await Promise.all([
                api('/api/staff/order-tracking/by-table'),
                api('/api/staff/order-tracking/by-food')
            ]);

            setOrdersByTable(Array.isArray(ordersData) ? ordersData : []);
            setFoodsOrdered(Array.isArray(foodsData) ? foodsData : []);
        } catch (err) {
            setMessage(err.message || 'Hệ thống tải trang không thành công.');
        } finally {
            setLoading(false);
        }
    };

    const updateItemInState = (updatedItem) => {
        setFoodsOrdered((currentFoods) =>
            currentFoods.map((item) =>
                item.detailId === updatedItem.detailId
                    ? {
                        ...item,
                        ...updatedItem
                    }
                    : item
            )
        );

        setOrdersByTable((currentOrders) =>
            currentOrders.map((order) => ({
                ...order,
                items: order.items.map((item) =>
                    item.detailId === updatedItem.detailId
                        ? {
                            ...item,
                            quantity: updatedItem.quantity,
                            price: updatedItem.price,
                            status: updatedItem.status,
                            foodName: updatedItem.foodName,
                            foodImage: updatedItem.foodImage,
                            foodType: updatedItem.foodType
                        }
                        : item
                )
            }))
        );
    };

    const nextStatus = async (item) => {
        if (item.status === 'SERVED') return;

        setUpdatingId(item.detailId);
        setMessage('');

        try {
            const updatedItem = await api(
                `/api/staff/order-tracking/details/${item.detailId}/status`,
                {
                    method: 'PATCH',
                    body: {
                        action: 'NEXT'
                    }
                }
            );

            updateItemInState(updatedItem);
            setMessage(`Đã cập nhật trạng thái món ${updatedItem.foodName}.`);
        } catch (err) {
            setMessage(err.message || 'Không cập nhật được trạng thái món ăn.');
        } finally {
            setUpdatingId('');
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    return (
        <main className="staff-page">
            <section className="order-toolbar">
                <div>
                    <h1>Theo dõi Đơn hàng</h1>
                    <p>Xem danh sách món ăn được đặt và cập nhật trạng thái món.</p>
                </div>

                <button type="button" onClick={loadData} disabled={loading}>
                    <RefreshCw size={16} />
                    {loading ? 'Đang tải...' : 'Làm mới'}
                </button>
            </section>

            <section className="order-view-tabs">
                <button
                    type="button"
                    className={viewMode === 'order' ? 'active orange' : ''}
                    onClick={() => setViewMode('order')}
                >
                    Xem theo Đơn hàng
                </button>

                <button
                    type="button"
                    className={viewMode === 'food' ? 'active purple' : ''}
                    onClick={() => setViewMode('food')}
                >
                    Xem theo Món ăn
                </button>
            </section>

            {viewMode === 'food' && (
                <section className="food-filter-tabs">
                    {STATUS_FILTERS.map((filter) => (
                        <button
                            key={filter.value}
                            type="button"
                            className={statusFilter === filter.value ? 'active' : ''}
                            onClick={() => setStatusFilter(filter.value)}
                        >
                            {filter.label}
                            <span>{statusCounts[filter.value] || 0}</span>
                        </button>
                    ))}
                </section>
            )}

            {message && <div className="staff-message">{message}</div>}

            {loading ? (
                <section className="order-empty">
                    <Utensils size={38} />
                    <p>Đang tải danh sách món ăn được đặt...</p>
                </section>
            ) : viewMode === 'order' ? (
                ordersByTable.length ? (
                    <section className="order-grid">
                        {ordersByTable.map((order) => (
                            <OrderCard
                                key={order.orderId}
                                order={order}
                                onNextStatus={nextStatus}
                                updatingId={updatingId}
                            />
                        ))}
                    </section>
                ) : (
                    <section className="order-empty">
                        <Search size={38} />
                        <h3>Chưa có đơn hàng</h3>
                        <p>Khi khách đặt món, danh sách đơn hàng sẽ hiển thị tại đây.</p>
                    </section>
                )
            ) : filteredFoodsOrdered.length ? (
                <section className="food-ordered-grid">
                    {filteredFoodsOrdered.map((item) => (
                        <FoodOrderedCard
                            key={item.detailId}
                            item={item}
                            onNextStatus={nextStatus}
                            updatingId={updatingId}
                        />
                    ))}
                </section>
            ) : (
                <section className="order-empty">
                    <Search size={38} />
                    <h3>Không có món ăn phù hợp</h3>
                    <p>Không có món ăn nào trong trạng thái đang chọn.</p>
                </section>
            )}
        </main>
    );
}