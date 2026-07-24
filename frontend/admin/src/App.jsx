import { useState } from 'react';
import {
  Gift,
  Grid2X2,
  LayoutDashboard,
  LogOut,
  MenuSquare,
  Table2,
  UsersRound
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

import './pages/admin-dashboard.css';
import './pages/admin-users.css';
import './pages/admin-promotions.css';
import './pages/admin-menu.css';
import './pages/admin-tables.css';
import './styles.css';

const MENU_ITEMS = [
  {
    key: 'overview',
    label: 'Tổng quan',
    icon: LayoutDashboard
  },
  {
    key: 'users',
    label: 'Người dùng',
    icon: UsersRound
  },
  {
    key: 'menu',
    label: 'Thực đơn',
    icon: MenuSquare
  },
  {
    key: 'promotions',
    label: 'Khuyến mãi',
    icon: Gift
  },
  {
    key: 'tables',
    label: 'Bàn',
    icon: Table2
  }
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
    value === 'PHAN_TRAM' ||
    value === 'PHẦN TRĂM' ||
    value === 'PHẦN TRĂM (%)' ||
    value.includes('PERCENT') ||
    value.includes('PHAN') ||
    value.includes('%')
  ) {
    return 'PERCENT';
  }

  if (
    value === 'AMOUNT' ||
    value === 'FIXED' ||
    value === 'FIXED_AMOUNT' ||
    value === 'MONEY' ||
    value === 'CASH' ||
    value === 'SO_TIEN' ||
    value === 'SỐ TIỀN' ||
    value.includes('AMOUNT') ||
    value.includes('MONEY') ||
    value.includes('TIEN') ||
    value.includes('TIỀN')
  ) {
    return 'AMOUNT';
  }

  return 'AMOUNT';
}

function promotionTypeLabel(type) {
  return normalizePromotionType(type) === 'PERCENT'
    ? 'Phần trăm'
    : 'Số tiền';
}

function formatPromotionValue(type, value) {
  const numberValue = Number(value || 0);

  if (normalizePromotionType(type) === 'PERCENT') {
    return `${numberValue}%`;
  }

  return `${new Intl.NumberFormat('vi-VN').format(numberValue)} đ`;
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
  const [form, setForm] = useState({
    phone: '',
    password: ''
  });

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
        body: {
          phone: form.phone,
          password: form.password
        }
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
        <h1>Lemonde Steak</h1>
        <p>Đăng nhập tài khoản quản trị để quản lý hệ thống.</p>

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
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
      </section>
    </main>
  );
}

export default function App() {
  const [auth, setAuth] = useState(getAdminAuth());
  const [activeMenu, setActiveMenu] = useState('overview');

  const logout = () => {
    clearAdminAuth();
    setAuth(null);
    setActiveMenu('overview');
  };

  if (!auth) {
    return <AdminLogin onLogin={setAuth} />;
  }

  return (
    <div className="admin-app">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <Grid2X2 size={19} />
          <strong>Lemonde Steak</strong>
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

      <section className="admin-main">
        <header className="admin-topbar">
          <span>Xin chào, {auth.fullName || auth.username || 'admin'}</span>

          <button type="button" onClick={logout}>
            <LogOut size={16} />
            Đăng xuất
          </button>
        </header>

        {activeMenu === 'overview' && <DashboardPage />}

        {activeMenu === 'users' && <UserManagementPage />}

        {activeMenu === 'menu' && <MenuManagementPage />}

        {activeMenu === 'promotions' && (
          <PromotionManagementPage
            normalizePromotionType={normalizePromotionType}
            promotionTypeLabel={promotionTypeLabel}
            formatPromotionValue={formatPromotionValue}
            buildPromotionPayload={buildPromotionPayload}
          />
        )}

        {activeMenu === 'tables' && <TableManagementPage />}
      </section>
    </div>
  );
}