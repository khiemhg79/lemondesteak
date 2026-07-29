import { useState, useEffect } from 'react';
import {
  Bell,
  Boxes,
  CalendarCheck,
  CookingPot,
  FileSpreadsheet,
  Gift,
  Grid2X2,
  LayoutDashboard,
  LogOut,
  MenuSquare,
  QrCode,
  Settings,
  ShoppingBag,
  UserCheck,
  Users,
  UtensilsCrossed,
  X
} from 'lucide-react';

import {
  api,
  clearAdminAuth,
  getAdminAuth,
  saveAdminAuth
} from './services/api.js';

import DashboardPage from './pages/DashboardPage.jsx';
import UserManagementPage from './pages/UserManagementPage.jsx';
import PromotionManagementPage from './pages/PromotionManagementPage.jsx';
import MenuManagementPage from './pages/MenuManagementPage.jsx';
import TableManagementPage from './pages/TableManagementPage.jsx';
import OrdersPage from './pages/OrdersPage.jsx';
import KitchenPage from './pages/KitchenPage.jsx';
import ReservationsPage from './pages/ReservationsPage.jsx';
import InventoryPage from './pages/InventoryPage.jsx';
import CustomersPage from './pages/CustomersPage.jsx';
import FinancialReportsPage from './pages/FinancialReportsPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';

import './pages/admin-dashboard.css';
import './pages/admin-users.css';
import './pages/admin-promotions.css';
import './pages/admin-menu.css';
import './pages/admin-tables.css';
import './styles.css';

// 12-Item Navigation Menu as requested
const MENU_ITEMS = [
  { key: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
  { key: 'orders', label: 'Đơn hàng', icon: ShoppingBag },
  { key: 'kitchen', label: 'Bếp', icon: CookingPot },
  { key: 'reservations', label: 'Đặt bàn', icon: CalendarCheck },
  { key: 'tables', label: 'Bàn & mã QR', icon: QrCode },
  { key: 'menu', label: 'Thực đơn', icon: MenuSquare },
  { key: 'promotions', label: 'Khuyến mãi', icon: Gift },
  { key: 'inventory', label: 'Kho nguyên liệu', icon: Boxes },
  { key: 'customers', label: 'Khách hàng', icon: Users },
  { key: 'users', label: 'Nhân viên', icon: UserCheck },
  { key: 'reports', label: 'Báo cáo', icon: FileSpreadsheet },
  { key: 'settings', label: 'Cài đặt', icon: Settings }
];

function normalizeRole(role) {
  return String(role || '').trim().toUpperCase();
}

function normalizePromotionType(type) {
  const value = String(type || '').trim().toUpperCase();

  if (
    value === 'PERCENT' ||
    value === 'PERCENTAGE' ||
    value === 'PERCENTAGE_DISCOUNT' ||
    value.includes('PERCENT') ||
    value.includes('%')
  ) {
    return 'PERCENT';
  }

  return 'AMOUNT';
}

function promotionTypeLabel(type) {
  return normalizePromotionType(type) === 'PERCENT' ? 'Phần trăm' : 'Số tiền';
}

function formatPromotionValue(type, value) {
  const numberValue = Number(value || 0);

  if (normalizePromotionType(type) === 'PERCENT') {
    return `${numberValue}%`;
  }

  return `${new Intl.NumberFormat('vi-VN').format(numberValue)} ₫`;
}

function buildPromotionPayload(form) {
  return {
    ...form,
    type: normalizePromotionType(form.type),
    value: Number(form.value || 0),
    minOrderAmount: Number(form.minOrderAmount || 0),
    maxDiscount:
      form.maxDiscount === '' || form.maxDiscount === null || form.maxDiscount === undefined
        ? null
        : Number(form.maxDiscount),
    usageLimit:
      form.usageLimit === '' || form.usageLimit === null || form.usageLimit === undefined
        ? null
        : Number(form.usageLimit),
    isActive: Boolean(form.isActive)
  };
}

function AdminLogin({ onLogin }) {
  const [form, setForm] = useState({ phone: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const setValue = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: key === 'phone' ? value.replace(/\D/g, '').slice(0, 10) : value
    }));
    setError('');
  };

  const submit = async (event) => {
    event.preventDefault();

    if (!form.phone || !form.password) {
      setError('Vui lòng nhập số điện thoại và mật khẩu.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const auth = await api('/api/auth/login', {
        method: 'POST',
        body: { phone: form.phone, password: form.password }
      });

      if (normalizeRole(auth.role) !== 'ADMIN') {
        throw new Error('Tài khoản này không có quyền quản trị.');
      }

      saveAdminAuth(auth);
      onLogin(auth);
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        <div style={{ textAlign: 'center', marginBottom: 14 }}>
          <img src="/logo.png" alt="LeMonde Steak" style={{ height: 64, borderRadius: 12 }} />
        </div>
        <h1>LeMonde Steak</h1>
        <p>Đăng nhập tài khoản quản trị hệ thống.</p>

        <form onSubmit={submit}>
          <input
            value={form.phone}
            onChange={(event) => setValue('phone', event.target.value)}
            placeholder="Số điện thoại admin"
            inputMode="numeric"
            maxLength={10}
          />

          <input
            value={form.password}
            onChange={(event) => setValue('password', event.target.value)}
            placeholder="Mật khẩu"
            type="password"
          />

          {error && <div className="admin-login-error">{error}</div>}

          <button type="submit" disabled={loading}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập Quản trị'}
          </button>
        </form>
      </section>
    </main>
  );
}

export default function App() {
  const [auth, setAuth] = useState(getAdminAuth());
  const [activeMenu, setActiveMenu] = useState('overview');
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Fetch 100% Dynamic Realtime Notifications from CSDL Backend
  useEffect(() => {
    if (!auth) return;

    const fetchNotifications = async () => {
      try {
        const [orders, tables] = await Promise.all([
          api('/api/staff/orders').catch(() => []),
          api('/api/staff/tables').catch(() => [])
        ]);

        const notifs = [];

        // 1. Unapproved Pending Orders
        const pending = Array.isArray(orders) ? orders.filter((o) => o.orderStatus === 'PENDING' || o.status === 'PENDING') : [];
        if (pending.length > 0) {
          notifs.push({
            id: 'pending',
            text: `🟡 Có ${pending.length} đơn hàng mới từ khách cần duyệt`,
            time: 'Vừa tạo'
          });
        }

        // 2. VietQR Unpaid Orders
        const bankOrders = Array.isArray(orders) ? orders.filter((o) => o.paymentMethod === 'BANK_TRANSFER' && o.orderStatus !== 'PAID') : [];
        if (bankOrders.length > 0) {
          notifs.push({
            id: 'vietqr',
            text: `🟠 Có ${bankOrders.length} đơn hàng chờ xác nhận thanh toán VietQR`,
            time: 'Vừa xong'
          });
        }

        // 3. Occupied Tables
        const usingTables = Array.isArray(tables) ? tables.filter((t) => t.status === 'USING') : [];
        if (usingTables.length > 0) {
          notifs.push({
            id: 'table',
            text: `🔴 Đang có ${usingTables.length} bàn có khách đang ăn tại nhà hàng`,
            time: 'Realtime'
          });
        }

        if (notifs.length === 0) {
          notifs.push({
            id: 'ok',
            text: `🟢 Hệ thống nhà hàng đang vận hành ổn định`,
            time: 'Hôm nay'
          });
        }

        setNotifications(notifs);
      } catch (err) {
        console.error('Lỗi tải thông báo khẩn cấp CSDL:', err);
      }
    };

    fetchNotifications();
    const timer = setInterval(fetchNotifications, 8000);
    return () => clearInterval(timer);
  }, [auth]);

  const logout = () => {
    clearAdminAuth();
    setAuth(null);
    setActiveMenu('overview');
  };

  if (!auth) {
    return <AdminLogin onLogin={setAuth} />;
  }

  return (
    <div className="admin-app bright-theme">
      {/* Sidebar Navigation */}
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <UtensilsCrossed size={22} color="#e63917" />
          <strong>LeMonde Steak</strong>
        </div>

        <nav className="admin-menu">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.key}
                type="button"
                className={activeMenu === item.key ? 'active' : ''}
                onClick={() => setActiveMenu(item.key)}
              >
                <Icon size={17} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content & Topbar */}
      <section className="admin-main">
        <header className="admin-topbar">
          <div className="topbar-right-group" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Notification Bell */}
            <div className="notif-bell-container" style={{ position: 'relative' }}>
              <button
                type="button"
                className="notif-bell-btn"
                onClick={() => setNotifOpen(!notifOpen)}
                title="Thông báo khẩn cấp"
                style={{ position: 'relative', background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#1e293b', width: 38, height: 38, borderRadius: 10, display: 'grid', placeItems: 'center', padding: 0 }}
              >
                <Bell size={18} />
                <span className="notif-badge-dot" style={{ position: 'absolute', top: -3, right: -3, background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 900, width: 18, height: 18, borderRadius: '50%', display: 'grid', placeItems: 'center' }}>
                  {notifications.length}
                </span>
              </button>

              {/* Notification Dropdown Popover */}
              {notifOpen && (
                <div className="notif-dropdown fade-in" style={{ position: 'absolute', top: 48, right: 0, width: 320, background: '#fff', borderRadius: 16, boxShadow: '0 12px 32px rgba(0,0,0,0.15)', border: '1px solid #e2e8f0', padding: 14, zIndex: 9999 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, borderBottom: '1px solid #f1f5f9', pb: 8 }}>
                    <strong style={{ fontSize: 13, color: '#0f172a' }}>Thông Báo Khẩn Cấp ({notifications.length})</strong>
                    <button type="button" onClick={() => setNotifOpen(false)} style={{ border: 0, background: 'none', cursor: 'pointer', padding: 0, color: '#64748b' }}>
                      <X size={16} />
                    </button>
                  </div>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {notifications.map((n) => (
                      <div key={n.id} style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: 10, fontSize: 12, borderLeft: '4px solid #ef4444' }}>
                        <div style={{ fontWeight: 700, color: '#1e293b' }}>{n.text}</div>
                        <small style={{ color: '#64748b' }}>{n.time}</small>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <span className="admin-user-name" style={{ color: '#1e293b', fontWeight: 800 }}>
              Xin chào, {auth.fullName || auth.username || 'Admin'}
            </span>

            <button type="button" onClick={logout} style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
              <LogOut size={16} />
              Đăng xuất
            </button>
          </div>
        </header>

        {/* Dynamic Page Views */}
        {activeMenu === 'overview' && <DashboardPage />}
        {activeMenu === 'orders' && <OrdersPage />}
        {activeMenu === 'kitchen' && <KitchenPage />}
        {activeMenu === 'reservations' && <ReservationsPage />}
        {activeMenu === 'tables' && <TableManagementPage />}
        {activeMenu === 'menu' && <MenuManagementPage />}
        {activeMenu === 'promotions' && (
          <PromotionManagementPage
            normalizePromotionType={normalizePromotionType}
            promotionTypeLabel={promotionTypeLabel}
            formatPromotionValue={formatPromotionValue}
            buildPromotionPayload={buildPromotionPayload}
          />
        )}
        {activeMenu === 'inventory' && <InventoryPage />}
        {activeMenu === 'customers' && <CustomersPage />}
        {activeMenu === 'users' && <UserManagementPage />}
        {activeMenu === 'reports' && <FinancialReportsPage />}
        {activeMenu === 'settings' && <SettingsPage />}
      </section>
    </div>
  );
}