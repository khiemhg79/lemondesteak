import { useState, useEffect, useMemo } from 'react';
import { Clock, CheckCircle2, ShoppingBag, Eye, Search, RefreshCw, CookingPot, AlertCircle, X, Check, Utensils } from 'lucide-react';
import { api } from '../services/api.js';
import { money } from '../utils/format.js';
import './admin-dashboard.css';

function formatDate(value) {
  if (!value) return 'Realtime';
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${hours}:${mins} - ${day}/${month}`;
  } catch {
    return String(value);
  }
}

function statusBadge(status) {
  const st = String(status || '').toUpperCase();
  if (st === 'PENDING' || st === 'CHO_XAC_NHAN') return { label: 'Đang chờ xác nhận', cls: 'warning' };
  if (st === 'PREPARING' || st === 'COOKING' || st === 'DANG_CHUYEN') return { label: 'Đang chế biến', cls: 'warning' };
  if (st === 'SERVED' || st === 'DA_RA_MON') return { label: 'Đã phục vụ', cls: 'info' };
  if (st === 'PAID' || st === 'COMPLETED' || st === 'DA_THANH_TOAN') return { label: 'Đã thanh toán', cls: 'success' };
  if (st === 'CANCELLED' || st === 'DA_HUY') return { label: 'Đã hủy', cls: 'danger' };
  return { label: st || 'Mới', cls: 'info' };
}

export default function OrdersPage() {
  const [rawOrders, setRawOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchLiveOrders = async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    setRefreshing(true);
    try {
      const res = await api('/api/staff/orders');
      if (Array.isArray(res)) {
        setRawOrders(res);
      }
    } catch {
      // Keep existing orders if network error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLiveOrders(true);
    // Poll CSDL REST API every 5 seconds for real-time live sync
    const timer = setInterval(() => {
      fetchLiveOrders(false);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Format and group order items logically
  const processedOrders = useMemo(() => {
    return rawOrders.map((o) => {
      const items = Array.isArray(o.items) ? o.items : Array.isArray(o.details) ? o.details : [];
      const totalAmount = o.totalAmount || o.totalPrice || items.reduce((sum, it) => sum + (Number(it.price || 0) * Number(it.quantity || 1)), 0);
      const totalItemsCount = items.reduce((sum, it) => sum + Number(it.quantity || 1), 0);

      return {
        id: o.orderId || o.id || o.orderNumber || 'N/A',
        orderNumber: o.orderNumber || o.orderId || o.id || 'N/A',
        tableNumber: o.tableNumber || o.tableName || (o.tableId ? String(o.tableId).replace(/[^\d]/g, '') : '??'),
        createdAt: formatDate(o.orderCreatedAt || o.createdAt),
        status: o.orderStatus || o.status || 'PENDING',
        totalAmount,
        totalItemsCount,
        items,
        customerName: o.customerName || 'Khách tại bàn'
      };
    });
  }, [rawOrders]);

  // Stat summary counters
  const stats = useMemo(() => {
    const total = processedOrders.length;
    const pending = processedOrders.filter((o) => ['PENDING', 'CHO_XAC_NHAN', 'PREPARING', 'COOKING'].includes(String(o.status).toUpperCase())).length;
    const served = processedOrders.filter((o) => ['SERVED', 'DA_RA_MON'].includes(String(o.status).toUpperCase())).length;
    const paid = processedOrders.filter((o) => ['PAID', 'COMPLETED', 'DA_THANH_TOAN'].includes(String(o.status).toUpperCase())).length;
    const totalRev = processedOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
    return { total, pending, served, paid, totalRev };
  }, [processedOrders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return processedOrders.filter((o) => {
      const st = String(o.status).toUpperCase();
      let matchStatus = true;
      if (statusFilter === 'PENDING') matchStatus = ['PENDING', 'CHO_XAC_NHAN', 'PREPARING', 'COOKING'].includes(st);
      else if (statusFilter === 'SERVED') matchStatus = ['SERVED', 'DA_RA_MON'].includes(st);
      else if (statusFilter === 'PAID') matchStatus = ['PAID', 'COMPLETED', 'DA_THANH_TOAN'].includes(st);
      else if (statusFilter === 'CANCELLED') matchStatus = ['CANCELLED', 'DA_HUY'].includes(st);

      const query = searchTerm.toLowerCase().trim();
      const matchSearch = !query || String(o.orderNumber).toLowerCase().includes(query) || String(o.tableNumber).toLowerCase().includes(query);
      return matchStatus && matchSearch;
    });
  }, [processedOrders, statusFilter, searchTerm]);

  return (
    <main className="admin-content bright-theme">
      {/* Page Header Bar */}
      <section className="admin-page-head">
        <div>
          <h1 className="head-title">Quản lý Đơn hàng Realtime (CSDL MySQL)</h1>
          <p className="head-sub">Tự động đồng bộ các đơn từ app Khách hàng & Nhân viên phục vụ theo thời gian thực.</p>
        </div>

        <div className="admin-head-actions">
          <button
            type="button"
            className="admin-refresh-btn bright"
            onClick={() => fetchLiveOrders(true)}
            disabled={refreshing}
          >
            <RefreshCw size={16} className={refreshing ? 'spin-icon' : ''} />
            {refreshing ? 'Đang cập nhật CSDL...' : 'Làm mới ngay'}
          </button>
        </div>
      </section>

      {/* Summary Metrics Grid */}
      <section className="dashboard-stats-grid">
        <article className="stat-card primary">
          <span className="stat-label">Tổng Số Đơn Hàng</span>
          <h2 className="stat-main-value">{stats.total} đơn</h2>
          <div className="stat-comparison">
            <span className="growth-up">Dữ liệu CSDL</span>
            <small>Đang đồng bộ realtime</small>
          </div>
        </article>

        <article className="stat-card">
          <span className="stat-label">Đơn Đang Chờ / Chế Biến</span>
          <h2 className="stat-main-value text-red">{stats.pending} đơn</h2>
          <div className="stat-comparison">
            <span className="growth-down">Cần bếp làm ngay</span>
            <small>Đơn mới & đang nấu</small>
          </div>
        </article>

        <article className="stat-card">
          <span className="stat-label">Đơn Đã Phục Vụ</span>
          <h2 className="stat-main-value">{stats.served} đơn</h2>
          <div className="stat-comparison">
            <span className="growth-neutral">Đã lên bàn</span>
            <small>Khách đang thưởng thức</small>
          </div>
        </article>

        <article className="stat-card">
          <span className="stat-label">Tổng Doanh Thu Đơn</span>
          <h2 className="stat-main-value">{money(stats.totalRev)}</h2>
          <div className="stat-comparison">
            <span className="growth-up">{stats.paid} đơn đã thu tiền</span>
            <small>Tính tất cả đơn</small>
          </div>
        </article>
      </section>

      {/* Filter and Search Bar */}
      <section className="time-filter-bar">
        <div
          className="search-box-input"
          style={{
            flex: 1,
            maxWidth: 320,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: '#fff',
            border: '1px solid #cbd5e1',
            padding: '8px 14px',
            borderRadius: 12
          }}
        >
          <Search size={16} color="#64748b" />
          <input
            type="text"
            placeholder="Tìm mã đơn hoặc số bàn..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ border: 0, outline: 'none', width: '100%', fontSize: 13.5 }}
          />
        </div>

        <div className="filter-tabs">
          <button
            type="button"
            className={`filter-btn ${statusFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setStatusFilter('ALL')}
          >
            Tất cả ({processedOrders.length})
          </button>
          <button
            type="button"
            className={`filter-btn ${statusFilter === 'PENDING' ? 'active' : ''}`}
            onClick={() => setStatusFilter('PENDING')}
          >
            Đang chế biến ({stats.pending})
          </button>
          <button
            type="button"
            className={`filter-btn ${statusFilter === 'SERVED' ? 'active' : ''}`}
            onClick={() => setStatusFilter('SERVED')}
          >
            Đã phục vụ ({stats.served})
          </button>
          <button
            type="button"
            className={`filter-btn ${statusFilter === 'PAID' ? 'active' : ''}`}
            onClick={() => setStatusFilter('PAID')}
          >
            Đã thanh toán ({stats.paid})
          </button>
        </div>
      </section>

      {/* Orders Table */}
      {loading ? (
        <div className="admin-loading-box">
          <div className="admin-loading-spinner" />
          <p className="admin-loading-text">Đang tải danh sách đơn hàng từ CSDL MySQL...</p>
          <small className="admin-loading-sub">Tự động làm mới mỗi 5 giây</small>
        </div>
      ) : filteredOrders.length > 0 ? (
        <article className="admin-table-card">
          <table className="admin-menu-table">
            <thead>
              <tr>
                <th>Mã Đơn</th>
                <th>Bàn</th>
                <th>Thời Gian</th>
                <th>Món Đã Đặt</th>
                <th>Số Món</th>
                <th>Tổng Tiền</th>
                <th>Trạng Thái</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((o) => {
                const badge = statusBadge(o.status);
                const itemsSummary = o.items.map((it) => `${it.foodName || it.name || 'Món ăn'} (x${it.quantity || 1})`).join(', ');

                return (
                  <tr key={o.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedOrder(o)}>
                    <td>
                      <strong style={{ color: '#0f172a', fontWeight: 900 }}>#{o.orderNumber}</strong>
                    </td>
                    <td>
                      <span
                        style={{
                          background: '#fff5f2',
                          color: '#e63917',
                          border: '1px solid #feccae',
                          padding: '4px 10px',
                          borderRadius: 8,
                          fontWeight: 850,
                          fontSize: 12.5
                        }}
                      >
                        Bàn {o.tableNumber}
                      </span>
                    </td>
                    <td>{o.createdAt}</td>
                    <td>
                      <div style={{ maxWidth: 260, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 13, color: '#475569' }}>
                        {itemsSummary || 'Chi tiết đơn...'}
                      </div>
                    </td>
                    <td>{o.totalItemsCount} món</td>
                    <td>
                      <strong className="text-red" style={{ fontSize: 14, fontWeight: 900 }}>
                        {money(o.totalAmount)}
                      </strong>
                    </td>
                    <td>
                      <span className={`menu-status-chip ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="custom-file-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrder(o);
                        }}
                        style={{ padding: '6px 12px', margin: 0 }}
                      >
                        <Eye size={14} /> Chi tiết
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </article>
      ) : (
        <div className="admin-empty">
          <ShoppingBag size={40} color="#94a3b8" />
          <h3>Chưa có đơn hàng nào trong mục này</h3>
          <p>Tất cả các đơn đặt từ app Khách hàng & Nhân viên phục vụ sẽ xuất hiện tại đây.</p>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedOrder(null)}>
          <div
            className="admin-item-modal modal-card scale-up"
            style={{ width: 'min(580px, 94vw)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <header className="item-modal-head-clean">
              <div className="item-modal-head-top">
                <span className="item-modal-badge">Đơn Hàng Live CSDL</span>
                <button
                  type="button"
                  className="modal-close-icon-btn"
                  onClick={() => setSelectedOrder(null)}
                >
                  <X size={18} />
                </button>
              </div>

              <h2 className="item-modal-title">Chi Tiết Đơn Hàng #{selectedOrder.orderNumber}</h2>
              <p className="item-modal-subcat">
                Bàn {selectedOrder.tableNumber} • {selectedOrder.createdAt}
              </p>
            </header>

            <div style={{ margin: '20px 0' }}>
              <div style={{ background: '#f8fafc', borderRadius: 16, padding: 16, border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 900, color: '#0f172a' }}>
                  Danh sách món ăn ({selectedOrder.items.length} món)
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {selectedOrder.items.map((it, idx) => (
                    <div
                      key={it.detailId || idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingBottom: 8,
                        borderBottom: idx < selectedOrder.items.length - 1 ? '1px dashed #e2e8f0' : 'none'
                      }}
                    >
                      <div>
                        <strong style={{ display: 'block', fontSize: 13.5, color: '#0f172a' }}>
                          {it.foodName || it.name || `Món ăn #${idx + 1}`}
                        </strong>
                        <small style={{ color: '#64748b' }}>
                          Số lượng: x{it.quantity || 1} • Giá: {money(it.price)}
                        </small>
                      </div>
                      <strong style={{ fontSize: 14, color: '#e63917' }}>
                        {money(Number(it.price || 0) * Number(it.quantity || 1))}
                      </strong>
                    </div>
                  ))}
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 16,
                  padding: '14px 18px',
                  background: '#fff5f2',
                  border: '1px solid #feccae',
                  borderRadius: 14
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>Tổng Cần Thanh Toán:</span>
                <strong style={{ fontSize: 20, fontWeight: 950, color: '#e63917' }}>
                  {money(selectedOrder.totalAmount)}
                </strong>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="admin-add-btn"
                onClick={() => setSelectedOrder(null)}
                style={{ width: '100%' }}
              >
                Đóng Cửa Sổ
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
