import { useEffect, useMemo, useState } from 'react';
import { LogOut, QrCode, RefreshCw, X } from 'lucide-react';
import {
  api,
  clearStaffAuth,
  getStaffAuth,
  saveStaffAuth
} from './services/api.js';
import StaffOrderTracking from './features/orders/StaffOrderTracking.jsx';
import StaffPaymentPage from './features/payments/StaffPaymentPage.jsx';
import './styles.css';

const CUSTOMER_BASE_URL =
  import.meta.env.VITE_CUSTOMER_BASE_URL ||
  import.meta.env.VITE_CUSTOMER_URL ||
  'http://localhost:5173';

const REALTIME_TABLE_INTERVAL_MS = 1500;

const TABLE_STATUS_OPTIONS = [
  {
    value: 'EMPTY',
    label: 'Trống'
  },
  {
    value: 'USING',
    label: 'Đang dùng bữa'
  },
  {
    value: 'REQUEST_PAYMENT',
    label: 'Yêu cầu thanh toán'
  }
];

function normalizeStatus(status) {
  const value = String(status || '').trim().toUpperCase();

  if (
    value === 'EMPTY' ||
    value === 'TRỐNG' ||
    value === 'TRONG' ||
    value === 'FREE' ||
    value === 'AVAILABLE'
  ) {
    return 'EMPTY';
  }

  if (
    value === 'USING' ||
    value === 'OCCUPIED' ||
    value === 'DINING' ||
    value === 'IN_USE' ||
    value === 'ĐANG DÙNG BỮA' ||
    value === 'DANG_DUNG_BUA'
  ) {
    return 'USING';
  }

  if (
    value === 'REQUEST_PAYMENT' ||
    value === 'WAITING_PAYMENT' ||
    value === 'PAYMENT_REQUESTED' ||
    value === 'YÊU CẦU THANH TOÁN' ||
    value === 'YEU_CAU_THANH_TOAN'
  ) {
    return 'REQUEST_PAYMENT';
  }

  return 'EMPTY';
}

function statusLabel(status) {
  const normalized = normalizeStatus(status);
  const found = TABLE_STATUS_OPTIONS.find((item) => item.value === normalized);
  return found?.label || 'Trống';
}

function statusClass(status) {
  const normalized = normalizeStatus(status);

  if (normalized === 'USING') return 'using';
  if (normalized === 'REQUEST_PAYMENT') return 'payment';

  return 'empty';
}

function getTableNumber(table) {
  return table.tableNumber || table.name || table.code || '';
}

function getTableTitle(table) {
  const tableNumber = getTableNumber(table);

  if (String(tableNumber).toLowerCase().startsWith('bàn')) {
    return tableNumber;
  }

  return `Bàn ${tableNumber}`;
}

function buildQrUrl(table) {
  const tableId = table.id;
  const tableNumber = getTableNumber(table);

  return `${CUSTOMER_BASE_URL}/t/${encodeURIComponent(
    tableNumber
  )}?tableId=${encodeURIComponent(tableId)}`;
}

function buildQrImageUrl(table) {
  const qrValue = buildQrUrl(table);

  return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
    qrValue
  )}`;
}

function StaffLogin({ onLogin }) {
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

      const role = String(auth.role || '').toUpperCase();

      if (role !== 'STAFF' && role !== 'ADMIN') {
        throw new Error('Tài khoản này không có quyền nhân viên.');
      }

      saveStaffAuth(auth);
      onLogin(auth);
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="staff-login-page">
      <section className="staff-login-card">
        <h1>Lemonde Steak</h1>
        <p>Đăng nhập tài khoản nhân viên để quản lý bàn và đơn hàng.</p>

        <form onSubmit={submit}>
          <input
            value={form.phone}
            onChange={(event) => setValue('phone', event.target.value)}
            placeholder="Số điện thoại"
            inputMode="numeric"
          />

          <input
            value={form.password}
            onChange={(event) => setValue('password', event.target.value)}
            placeholder="Mật khẩu"
            type="password"
          />

          {error && <div className="staff-login-error">{error}</div>}

          <button type="submit" disabled={loading}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
      </section>
    </main>
  );
}

function QrModal({ table, onClose }) {
  if (!table) return null;

  const qrUrl = buildQrUrl(table);
  const qrImageUrl = buildQrImageUrl(table);

  const printQr = () => {
    const printWindow = window.open('', '_blank', 'width=720,height=900');

    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>In QR ${getTableTitle(table)}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              padding: 40px;
            }

            h1 {
              margin-bottom: 8px;
              font-size: 26px;
            }

            p {
              color: #555;
              margin-bottom: 18px;
            }

            img {
              width: 280px;
              height: 280px;
            }
          </style>
        </head>

        <body>
          <h1>Mã QR Đặt Món</h1>
          <p>${getTableTitle(table)} - Quét mã QR để xem thực đơn và đặt món</p>
          <img src="${qrImageUrl}" />
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  return (
    <div className="staff-modal-backdrop" onClick={onClose}>
      <section className="staff-qr-modal" onClick={(event) => event.stopPropagation()}>
        <button className="qr-close-btn" type="button" onClick={onClose}>
          <X size={16} />
        </button>

        <h2>Mã QR Đặt Món</h2>
        <p>Quét mã QR để xem thực đơn và đặt món</p>

        <div className="qr-box">
          <img className="qr-image" src={qrImageUrl} alt="Mã QR đặt món" />
        </div>

        <button className="qr-print-btn" type="button" onClick={printQr}>
          In QR
        </button>
      </section>
    </div>
  );
}

function StaffTablePage() {
  const [activeTab, setActiveTab] = useState('tables');
  const [tables, setTables] = useState([]);
  const [qrTable, setQrTable] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const summary = useMemo(() => {
    return tables.reduce(
      (result, table) => {
        const status = normalizeStatus(table.status);

        if (status === 'EMPTY') result.empty += 1;
        if (status === 'USING') result.using += 1;
        if (status === 'REQUEST_PAYMENT') result.payment += 1;

        return result;
      },
      {
        empty: 0,
        using: 0,
        payment: 0
      }
    );
  }, [tables]);

  const loadTables = async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setMessage('');
    }

    try {
      const data = await api('/api/staff/tables');
      setTables(Array.isArray(data) ? data : []);
    } catch (err) {
      if (!silent) {
        setTables([]);
        setMessage(err.message || 'Hệ thống tải trang không thành công.');
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const handleTableClick = (table) => {
    const status = normalizeStatus(table.status);

    if (status === 'EMPTY') {
      setQrTable(table);
      return;
    }

    if (status === 'USING') {
      setMessage('Bàn đang dùng bữa.');
      return;
    }

    if (status === 'REQUEST_PAYMENT') {
      setMessage('Bàn đang yêu cầu thanh toán. Hãy xử lý ở chức năng Thanh toán.');
      return;
    }

    setMessage('Không thể thao tác với trạng thái bàn này.');
  };

  const handleStatusSelect = (event) => {
    event.stopPropagation();
    setMessage(
      'Trạng thái bàn được hệ thống cập nhật theo đơn hàng và thanh toán.'
    );
  };

  useEffect(() => {
    if (activeTab !== 'tables') {
      return undefined;
    }

    loadTables(false);

    const timer = window.setInterval(() => {
      loadTables(true);
    }, REALTIME_TABLE_INTERVAL_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [activeTab]);

  return (
    <>
      <section className="staff-tabs">
        <button
          type="button"
          className={activeTab === 'tables' ? 'active' : ''}
          onClick={() => setActiveTab('tables')}
        >
          Quản lý Bàn
        </button>

        <button
          type="button"
          className={activeTab === 'orders' ? 'active' : ''}
          onClick={() => setActiveTab('orders')}
        >
          Theo dõi Đơn hàng
        </button>

        <button
          type="button"
          className={activeTab === 'payments' ? 'active' : ''}
          onClick={() => setActiveTab('payments')}
        >
          Thanh toán
        </button>
      </section>

      {activeTab === 'tables' && (
        <main className="staff-page">
          <section className="staff-page-head">
            <div>
              <h1>Quản lý Bàn</h1>
            </div>

            <button
              className="staff-refresh-btn"
              type="button"
              onClick={() => loadTables(false)}
              disabled={loading}
            >
              <RefreshCw size={16} />
              Làm mới
            </button>
          </section>

          <section className="staff-table-summary">
            <div>
              <span className="dot empty" />
              Trống
            </div>

            <div>
              <span className="dot using" />
              Đang dùng bữa
            </div>

            <div>
              <span className="dot payment" />
              Yêu cầu thanh toán
            </div>
          </section>

          {message && <div className="staff-message">{message}</div>}

          {loading ? (
            <section className="staff-empty-box">
              <p>Đang tải danh sách bàn...</p>
            </section>
          ) : tables.length ? (
            <section className="staff-table-grid">
              {tables.map((table) => {
                const status = normalizeStatus(table.status);

                return (
                  <article
                    key={table.id}
                    className={`staff-table-card ${statusClass(status)}`}
                    onClick={() => handleTableClick(table)}
                  >
                    <h2>{getTableTitle(table)}</h2>
                    <p>{table.capacity || 0} chỗ ngồi</p>

                    <span className={`table-status ${statusClass(status)}`}>
                      {statusLabel(status)}
                    </span>

                    <select
                      value={status}
                      onClick={(event) => event.stopPropagation()}
                      onChange={handleStatusSelect}
                    >
                      {TABLE_STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </article>
                );
              })}
            </section>
          ) : (
            <section className="staff-empty-box">
              <QrCode size={38} />
              <h3>Chưa có bàn ăn</h3>
              <p>Hệ thống chưa có dữ liệu bàn ăn để hiển thị.</p>
            </section>
          )}
        </main>
      )}

      {activeTab === 'orders' && (
        <main className="staff-page">
          <StaffOrderTracking />
        </main>
      )}

      {activeTab === 'payments' && <StaffPaymentPage />}

      <QrModal table={qrTable} onClose={() => setQrTable(null)} />
    </>
  );
}

export default function App() {
  const [auth, setAuth] = useState(getStaffAuth());

  const logout = () => {
    clearStaffAuth();
    setAuth(null);
  };

  if (!auth) {
    return <StaffLogin onLogin={setAuth} />;
  }

  return (
    <div className="staff-app">
      <header className="staff-topbar">
        <strong>Lemonde Steak</strong>

        <div>
          <span>Xin chào, {auth.fullName || auth.username || 'Staff Lemonde Steak'}</span>

          <button type="button" onClick={logout}>
            <LogOut size={16} />
            Đăng xuất
          </button>
        </div>
      </header>

      <StaffTablePage />
    </div>
  );
}