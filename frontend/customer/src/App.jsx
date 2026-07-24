import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ClipboardList,
  History,
  Home,
  LogIn,
  Search,
  ShoppingCart,
  UserRound,
  X
} from 'lucide-react';
import './styles.css';

const CURRENT_HOST = window.location.hostname;

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  (
    CURRENT_HOST === 'localhost' || CURRENT_HOST === '127.0.0.1'
      ? 'http://localhost:8080'
      : `http://${CURRENT_HOST}:8080`
  );

const AUTH_KEY = 'customerAuth';
const CART_KEY_PREFIX = 'lemondesteakCustomerCart';
const CURRENT_ORDER_KEY_PREFIX = 'lemondesteakCurrentOrder';

function getCustomerAuth() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null');
  } catch {
    return null;
  }
}

function saveCustomerAuth(auth) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
}

function clearCustomerAuth() {
  localStorage.removeItem(AUTH_KEY);
}

function getAuthId(auth) {
  return (
    auth?.userId ||
    auth?.id ||
    auth?.customerId ||
    auth?.phone ||
    auth?.username ||
    ''
  );
}

function getCartKey(auth) {
  const authId = getAuthId(auth);
  if (!authId) return '';
  return `${CART_KEY_PREFIX}:${authId}`;
}

function getCurrentOrderKey(auth) {
  const authId = getAuthId(auth);
  if (!authId) return '';
  return `${CURRENT_ORDER_KEY_PREFIX}:${authId}`;
}

function readCart(auth) {
  const key = getCartKey(auth);
  if (!key) return [];

  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    return [];
  }
}

function writeCart(auth, cart) {
  const key = getCartKey(auth);
  if (!key) return;
  localStorage.setItem(key, JSON.stringify(cart));
}

function clearCartStorage(auth) {
  const key = getCartKey(auth);
  if (!key) return;
  localStorage.removeItem(key);
}

function readCurrentOrder(auth) {
  const key = getCurrentOrderKey(auth);
  if (!key) return null;

  try {
    return JSON.parse(localStorage.getItem(key) || 'null');
  } catch {
    return null;
  }
}

function writeCurrentOrder(auth, order) {
  const key = getCurrentOrderKey(auth);
  if (!key) return;

  if (!order) {
    localStorage.removeItem(key);
    return;
  }

  localStorage.setItem(key, JSON.stringify(order));
}

function clearCurrentOrderStorage(auth) {
  const key = getCurrentOrderKey(auth);
  if (!key) return;
  localStorage.removeItem(key);
}

function getToken() {
  const auth = getCustomerAuth();
  return auth?.token || auth?.accessToken || auth?.jwt || '';
}

async function apiFetch(path, options = {}) {
  const token = getToken();

  const headers = {
    Accept: 'application/json',
    ...(options.headers || {})
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    body:
      options.body instanceof FormData
        ? options.body
        : options.body
          ? JSON.stringify(options.body)
          : undefined
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

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function numberValue(value) {
  return Number(value || 0);
}

function getTableInfo() {
  const url = new URL(window.location.href);
  const parts = url.pathname.split('/').filter(Boolean);

  let tableNumber =
    url.searchParams.get('tableNumber') ||
    url.searchParams.get('table') ||
    '';

  const tableId = url.searchParams.get('tableId') || '';

  if (parts[0] === 't' && parts[1]) {
    tableNumber = decodeURIComponent(parts[1]);
  }

  return {
    tableId,
    tableNumber
  };
}

function tableLabel(tableNumber) {
  if (!tableNumber) return '';

  const text = String(tableNumber).trim();

  if (text.toLowerCase().startsWith('bàn')) {
    return text;
  }

  return `Bàn ${text}`;
}

function imageUrl(image) {
  if (!image) {
    return 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=700&q=80';
  }

  const value = String(image);

  if (value.startsWith('http')) return value;
  if (value.startsWith('/')) return `${API_BASE_URL}${value}`;

  return value;
}

function sanitizeItems(items) {
  return items
    .filter(Boolean)
    .map((item) => ({
      id: item.id,
      name: item.name || item.itemName || 'Món ăn',
      description: item.description || '',
      price: Number(item.price || 0),
      image: item.image || item.imageUrl || '',
      categoryId:
        item.categoryId ||
        item.category?.id ||
        item.categoryName ||
        item.category ||
        'other',
      categoryName:
        item.categoryName ||
        item.category?.categoryName ||
        item.category?.name ||
        item.category ||
        'Khác',
      type: 'ITEM'
    }))
    .filter((item) => item.id);
}

function sanitizeCombos(combos) {
  return combos
    .filter(Boolean)
    .map((combo) => ({
      id: combo.id,
      name: combo.name || 'Combo',
      description: combo.description || '',
      price: Number(combo.price || 0),
      image: combo.image || combo.imageUrl || '',
      categoryId: 'combo',
      categoryName: 'Combo',
      type: 'COMBO'
    }))
    .filter((combo) => combo.id);
}

function normalizeOrderItems(items) {
  return (items || [])
    .filter(Boolean)
    .map((item) => ({
      id: item.id || item.detailId || item.itemId || item.comboId,
      detailId: item.detailId || item.id,
      itemId: item.itemId || null,
      comboId: item.comboId || null,
      type: item.type || (item.comboId ? 'COMBO' : 'ITEM'),
      name: item.name || item.foodName || item.itemName || item.comboName || 'Món ăn',
      image: item.image || '',
      quantity: Number(item.quantity || 1),
      price: Number(item.price || item.unitPrice || 0),
      status: String(item.status || 'WAITING').toUpperCase()
    }));
}

function detailStatusLabel(status) {
  const value = String(status || '').toUpperCase();

  if (value === 'WAITING') return 'Đang chờ';
  if (value === 'COOKING' || value === 'PREPARING') return 'Đang làm';
  if (value === 'DONE') return 'Đã xong';
  if (value === 'SERVED') return 'Đã phục vụ';

  return 'Đang chờ';
}

function orderStatusLabel(status) {
  const value = String(status || '').toUpperCase();

  if (value === 'PENDING') return 'PENDING';
  if (value === 'SERVED') return 'SERVED';
  if (value === 'REQUEST_PAYMENT') return 'REQUEST PAYMENT';
  if (value === 'PAID') return 'PAID';

  return value || 'PENDING';
}

function promotionValueText(promotion) {
  const type = String(promotion?.type || '').toUpperCase();
  const value = Number(promotion?.value || 0);

  if (type === 'PERCENT' || type === 'PERCENTAGE') {
    return `Giảm ${value}%`;
  }

  return `Giảm ${money(value)}`;
}

function AuthModal({ open, onClose, onLoggedIn }) {
  const [mode, setMode] = useState('login');

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const setValue = (key, value) => {
    const nextValue = key === 'phone' ? value.replace(/\D/g, '').slice(0, 10) : value;

    setForm((current) => ({
      ...current,
      [key]: nextValue
    }));

    setError('');
    setSuccess('');
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError('');
    setSuccess('');
  };

  const validatePhone = () => {
    if (!form.phone.trim()) {
      return 'Vui lòng nhập số điện thoại.';
    }

    if (!/^0\d{9}$/.test(form.phone.trim())) {
      return 'Số điện thoại không hợp lệ.';
    }

    return '';
  };

  const validate = () => {
    const phoneError = validatePhone();

    if (mode === 'register' && !form.fullName.trim()) {
      return 'Vui lòng nhập họ tên.';
    }

    if (phoneError) {
      return phoneError;
    }

    if (!form.password) {
      return 'Vui lòng nhập mật khẩu.';
    }

    if (mode === 'register' && form.password.length < 8) {
      return 'Mật khẩu phải có ít nhất 8 ký tự.';
    }

    if (mode === 'register' && !form.confirmPassword) {
      return 'Vui lòng nhập lại mật khẩu.';
    }

    if (mode === 'register' && form.password !== form.confirmPassword) {
      return 'Mật khẩu nhập lại không khớp.';
    }

    return '';
  };

  const submit = async (event) => {
    event.preventDefault();

    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (mode === 'login') {
        const auth = await apiFetch('/api/auth/login', {
          method: 'POST',
          body: {
            phone: form.phone.trim(),
            password: form.password
          }
        });

        saveCustomerAuth(auth);
        onLoggedIn(auth);
        onClose();
        return;
      }

      await apiFetch('/api/auth/register', {
        method: 'POST',
        body: {
          fullName: form.fullName.trim(),
          username: form.fullName.trim(),
          phone: form.phone.trim(),
          password: form.password
        }
      });

      setMode('login');
      setSuccess('Đăng ký thành công, hãy đăng nhập.');
      setForm((current) => ({
        fullName: '',
        phone: current.phone,
        password: '',
        confirmPassword: ''
      }));
    } catch (err) {
      const message = String(err.message || 'Thao tác thất bại.');

      if (message.toLowerCase().includes('tồn tại') || message.toLowerCase().includes('exist')) {
        setError('Số điện thoại đã tồn tại.');
      } else if (message.toLowerCase().includes('invalid') || message.toLowerCase().includes('không hợp lệ')) {
        setError('Số điện thoại hoặc mật khẩu không hợp lệ.');
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="customer-modal-backdrop auth-backdrop" onClick={onClose}>
      <section className="auth-sheet" onClick={(event) => event.stopPropagation()}>
        <button className="sheet-close" type="button" onClick={onClose}>
          <X size={18} />
        </button>

        <div className="auth-logo">🍲</div>

        <h2>Chào mừng bạn đến Le Monde Steak</h2>
        <p>Hãy đăng nhập hoặc tạo tài khoản để tiếp tục</p>

        <div className="auth-tabs">
          <button
            type="button"
            className={mode === 'login' ? 'active' : ''}
            onClick={() => switchMode('login')}
          >
            <LogIn size={15} />
            Đăng nhập
          </button>

          <button
            type="button"
            className={mode === 'register' ? 'active' : ''}
            onClick={() => switchMode('register')}
          >
            <UserRound size={15} />
            Đăng ký
          </button>
        </div>

        <form className="auth-form" onSubmit={submit}>
          {success && <div className="auth-success">{success}</div>}
          {error && <div className="auth-error">{error}</div>}

          {mode === 'register' && (
            <input
              value={form.fullName}
              onChange={(event) => setValue('fullName', event.target.value)}
              placeholder="Họ và tên"
              maxLength={100}
              autoComplete="name"
            />
          )}

          <input
            value={form.phone}
            onChange={(event) => setValue('phone', event.target.value)}
            placeholder="Số điện thoại"
            inputMode="numeric"
            maxLength={10}
            autoComplete="tel"
          />

          <input
            value={form.password}
            onChange={(event) => setValue('password', event.target.value)}
            placeholder="Mật khẩu"
            type="password"
            maxLength={50}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />

          {mode === 'register' && (
            <input
              value={form.confirmPassword}
              onChange={(event) => setValue('confirmPassword', event.target.value)}
              placeholder="Nhập lại mật khẩu"
              type="password"
              maxLength={50}
              autoComplete="new-password"
            />
          )}

          <button type="submit" disabled={loading}>
            {loading ? 'Đang xử lý...' : mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
          </button>
        </form>
      </section>
    </div>
  );
}

function FoodDetailModal({ food, onClose, onAdd }) {
  if (!food) return null;

  return (
    <div className="customer-modal-backdrop detail-backdrop" onClick={onClose}>
      <section className="food-detail-sheet" onClick={(event) => event.stopPropagation()}>
        <button className="sheet-close" type="button" onClick={onClose}>
          <X size={18} />
        </button>

        <h2>{food.name}</h2>

        <img src={imageUrl(food.image)} alt={food.name} />

        <p>{food.description || 'Món ăn thơm ngon được chế biến theo phong cách Lemonde Steak.'}</p>

        <div className="food-detail-bottom">
          <b>{money(food.price)}</b>

          <button type="button" onClick={() => onAdd(food)}>
            + Thêm vào giỏ
          </button>
        </div>
      </section>
    </div>
  );
}

function CartSheet({
  open,
  cart,
  ordering,
  orderSuccess,
  onClose,
  onChangeQty,
  onRemove,
  onClear,
  onOrder,
  onCloseSuccess
}) {
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (!open) return null;

  return (
    <div className="customer-modal-backdrop cart-backdrop" onClick={onClose}>
      <section className="cart-sheet" onClick={(event) => event.stopPropagation()}>
        <button className="sheet-close" type="button" onClick={onClose}>
          <X size={18} />
        </button>

        <div className="cart-head">
          <h2>Giỏ hàng ({cart.length})</h2>
        </div>

        {cart.length ? (
          <>
            <div className="cart-list">
              {cart.map((item) => (
                <article className="cart-item" key={`${item.type}-${item.id}`}>
                  <img src={imageUrl(item.image)} alt={item.name} />

                  <div className="cart-info">
                    <h3>{item.name}</h3>
                    <p>{money(item.price)} / món</p>
                    <b>{money(item.price * item.quantity)}</b>
                  </div>

                  <div className="cart-stepper">
                    <button
                      type="button"
                      onClick={() => onChangeQty(item, item.quantity - 1)}
                      disabled={ordering || Boolean(orderSuccess)}
                    >
                      -
                    </button>

                    <span>{item.quantity}</span>

                    <button
                      type="button"
                      onClick={() => onChangeQty(item, item.quantity + 1)}
                      disabled={ordering || Boolean(orderSuccess)}
                    >
                      +
                    </button>
                  </div>

                  <button
                    className="cart-remove-btn"
                    type="button"
                    onClick={() => onRemove(item)}
                    disabled={ordering || Boolean(orderSuccess)}
                  >
                    ×
                  </button>
                </article>
              ))}
            </div>

            <div className="cart-footer">
              <div className="cart-total">
                <span>Tạm tính</span>
                <b>{money(total)}</b>
              </div>

              <div className="cart-total cart-grand-total">
                <span>Tổng cộng</span>
                <b>{money(total)}</b>
              </div>

              <div className="cart-footer-actions">
                <button
                  className="order-btn"
                  type="button"
                  onClick={onOrder}
                  disabled={ordering || Boolean(orderSuccess)}
                >
                  {ordering ? 'Đang tạo đơn...' : 'Tiến hành đặt món'}
                </button>

                <button
                  className="clear-cart-btn"
                  type="button"
                  onClick={onClear}
                  disabled={ordering || Boolean(orderSuccess)}
                >
                  Xóa giỏ
                </button>
              </div>
            </div>

          </>
        ) : (
          <div className="cart-empty">Giỏ hàng đang trống.</div>
        )}

        {orderSuccess && (
          <div className="cart-success-modal">
            <section>
              <p>
                Đã tạo đơn
                {orderSuccess.orderNumber ? ` #${orderSuccess.orderNumber}` : ''}.
                {' '}
                Cảm ơn bạn!
              </p>

              <button type="button" onClick={onCloseSuccess}>
                Đóng
              </button>
            </section>
          </div>
        )}
      </section>
    </div>
  );
}

function CurrentOrderView({
  currentOrder,
  promotions,
  promotionsOpen,
  loadingPromotions,
  applyingPromotionId,
  requestingPayment,
  onTogglePromotions,
  onApplyPromotion,
  onRequestPayment
}) {
  if (!currentOrder) {
    return (
      <section className="current-empty">
        <h2>Đơn hiện tại</h2>
        <p>Đơn hiện tại chỉ hiển thị sau khi bạn đặt món thành công từ giỏ hàng.</p>
      </section>
    );
  }

  const items = normalizeOrderItems(currentOrder.items);
  const subTotal = numberValue(currentOrder.subTotal);
  const discountAmount = numberValue(currentOrder.discountAmount);
  const totalAmount = numberValue(currentOrder.totalAmount);
  const orderStatus = String(currentOrder.orderStatus || 'PENDING').toUpperCase();
  const promotionId = currentOrder.promotionId || currentOrder.promoCode || '';

  const allServed =
    items.length > 0 &&
    items.every((item) => String(item.status || '').toUpperCase() === 'SERVED');

  const canRequestPayment =
    allServed &&
    orderStatus !== 'REQUEST_PAYMENT' &&
    orderStatus !== 'PAID';

  return (
    <div className="current-order-page">
      <div className="current-order-list">
        {items.map((item) => (
          <div className="current-order-item" key={`${item.detailId || item.id}`}>
            <div className="current-order-info">
              <div className="current-order-name">
                {item.name}
                {item.type === 'COMBO' && <span>Combo</span>}
              </div>

              <div className="current-order-qty">
                {item.quantity}x {money(item.price)}
              </div>
            </div>

            <div className="current-order-right">
              <div className={`current-order-status status-${String(item.status || 'WAITING').toLowerCase()}`}>
                {detailStatusLabel(item.status)}
              </div>

              <strong>{money(item.price * item.quantity)}</strong>
            </div>
          </div>
        ))}
      </div>

      <div className="voucher-box">
        <div className="voucher-title">
          <span>◇</span>
          <b>Chọn mã giảm giá</b>

          <button type="button" onClick={onTogglePromotions}>
            {promotionsOpen ? 'Đóng' : 'Mở'}
          </button>
        </div>

        {currentOrder.promotionName && (
          <div className="applied-voucher-box">
            <div>
              <span>Voucher đang dùng</span>
              <b>{currentOrder.promotionName}</b>
            </div>

            <em>
              {String(currentOrder.promotionType || '').toUpperCase() === 'PERCENT'
                ? `Giảm ${Number(currentOrder.promotionValue || 0)}%`
                : discountAmount > 0
                  ? `Giảm ${money(discountAmount)}`
                  : 'Đã áp dụng'}
            </em>
          </div>
        )}

        {promotionsOpen && (
          <>
            {loadingPromotions ? (
              <div className="voucher-loading">Đang tải mã giảm giá...</div>
            ) : promotions.length ? (
              promotions.map((promotion) => {
                const selected = promotionId === promotion.id;

                return (
                  <div
                    className={`voucher-card ${selected ? 'selected' : ''}`}
                    key={promotion.id}
                  >
                    <div>
                      <b>{promotion.name}</b>
                      <span>{promotionValueText(promotion)}</span>
                      <p>{promotion.description || 'Mã giảm giá đang hoạt động.'}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onApplyPromotion(promotion)}
                      disabled={Boolean(applyingPromotionId) || selected}
                    >
                      {selected
                        ? 'Đang dùng'
                        : applyingPromotionId === promotion.id
                          ? 'Đang áp dụng...'
                          : 'Áp dụng'}
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="voucher-loading">Không có mã giảm giá khả dụng.</div>
            )}
          </>
        )}
      </div>

      <div className="current-total-box">
        <div className="current-order-code">
          Đơn #{currentOrder.orderNumber || currentOrder.id}
          <span>{orderStatusLabel(orderStatus)}</span>
        </div>

        <div className="total-row">
          <span>Tạm tính</span>
          <b>{money(subTotal)}</b>
        </div>

        {discountAmount > 0 && (
          <div className="total-row discount-row">
            <span>Giảm giá</span>
            <b>-{money(discountAmount)}</b>
          </div>
        )}

        <div className="grand-total-row">
          <span>Tổng cộng</span>
          <b>{money(totalAmount)}</b>
        </div>

        <div className="order-note">
          <span>ⓘ</span>
          <p>
            {allServed
              ? 'Tất cả món đã được phục vụ'
              : 'Món ăn đang được nhân viên xử lý'}
          </p>
        </div>

        <button
          className="pay-button"
          type="button"
          onClick={onRequestPayment}
          disabled={!canRequestPayment || requestingPayment}
        >
          {requestingPayment
            ? 'Đang gửi...'
            : orderStatus === 'REQUEST_PAYMENT'
              ? 'Đã yêu cầu thanh toán'
              : 'Thanh toán'}
        </button>
      </div>
    </div>
  );
}


function historyStatusInfo(status) {
  const value = String(status || '').toUpperCase();

  if (value === 'PAID' || value === 'COMPLETED') {
    return {
      label: 'Hoàn thành',
      className: 'done'
    };
  }

  if (value === 'SERVED' || value === 'REQUEST_PAYMENT' || value === 'PENDING') {
    return {
      label: 'Đã xác nhận',
      className: 'confirmed'
    };
  }

  if (value === 'CANCELLED') {
    return {
      label: 'Đã hủy',
      className: 'cancelled'
    };
  }

  return {
    label: 'Đã xác nhận',
    className: 'confirmed'
  };
}

function formatOrderDate(value) {
  if (!value) return '';

  try {
    return new Date(value).toLocaleDateString('vi-VN');
  } catch {
    return '';
  }
}

function formatOrderTime(value) {
  if (!value) return '';

  try {
    return new Date(value).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return '';
  }
}

function orderHistoryItemStatusInfo(status) {
  const value = String(status || '').toUpperCase();

  if (value === 'SERVED' || value === 'DONE' || value === 'COMPLETED') {
    return {
      label: 'Đã phục vụ',
      className: 'served'
    };
  }

  if (value === 'PROCESSING' || value === 'IN_PROGRESS' || value === 'PREPARING') {
    return {
      label: 'Đang làm',
      className: 'processing'
    };
  }

  return {
    label: 'Đang chờ',
    className: 'waiting'
  };
}

function getHistoryItemTypeLabel(type) {
  return String(type || '').toUpperCase() === 'COMBO' ? 'Combo' : 'Món';
}

function getHistoryLineTotal(item) {
  return Number(item?.quantity || 0) * Number(item?.price || 0);
}

function OrderHistoryView({
  auth,
  orders,
  loading,
  error,
  onReload,
  onSelectOrder
}) {
  if (!auth) {
    return (
      <section className="history-page">
        <h1>Lịch sử đặt món</h1>

        <div className="history-empty">
          <h3>Bạn chưa đăng nhập</h3>
          <p>Vui lòng đăng nhập để xem lịch sử đặt món.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="history-page">
      <div className="history-head">
        <h1>Lịch sử đặt món</h1>

        <button type="button" onClick={onReload} disabled={loading}>
          {loading ? 'Đang tải...' : 'Làm mới'}
        </button>
      </div>

      {error && <div className="history-error">{error}</div>}

      {loading ? (
        <div className="history-empty">
          <p>Đang tải lịch sử đặt món...</p>
        </div>
      ) : orders.length ? (
        <div className="history-list">
          {orders.map((order) => {
            const status = historyStatusInfo(order.orderStatus);

            return (
              <button
                type="button"
                className="history-card history-card-button"
                key={order.id}
                onClick={() => onSelectOrder?.(order)}
              >
                <div className="history-card-left">
                  <h2>Đơn #{order.orderNumber || order.id}</h2>

                  <div className="history-meta">
                    <span>▣ {formatOrderDate(order.createdAt)}</span>
                    <span>◷ {formatOrderTime(order.createdAt)}</span>
                  </div>
                </div>

                <div className="history-card-right">
                  <strong>{money(order.totalAmount)}</strong>

                  <span className={`history-badge ${status.className}`}>
                    {status.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="history-empty">
          <h3>Chưa có lịch sử đặt món</h3>
          <p>Sau khi bạn đặt món, đơn hàng sẽ xuất hiện tại đây.</p>
        </div>
      )}
    </section>
  );
}

function OrderHistoryDetailModal({
  open,
  loading,
  error,
  order,
  onClose,
  onRetry
}) {
  if (!open) return null;

  const items = Array.isArray(order?.items) ? order.items : [];

  return (
    <div className="history-detail-backdrop" onClick={onClose}>
      <section className="history-detail-modal" onClick={(event) => event.stopPropagation()}>
        <div className="history-detail-header">
          <div>
            <h2>Chi tiết đơn #{order?.orderNumber || order?.id || ''}</h2>
            <div className="history-detail-date-row">
              <span>◷ {formatOrderTime(order?.createdAt)}</span>
              <span>{formatOrderDate(order?.createdAt)}</span>
            </div>
          </div>

          <button type="button" className="history-detail-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div className="history-detail-loading">Đang tải chi tiết đơn...</div>
        ) : error ? (
          <div className="history-detail-error-box">
            <p>{error}</p>
            <button type="button" onClick={onRetry}>Tải lại</button>
          </div>
        ) : (
          <>
            <div className="history-detail-list">
              {items.map((item) => {
                const itemStatus = orderHistoryItemStatusInfo(item.status);

                return (
                  <article className="history-detail-item" key={item.detailId || item.id}>
                    <div className="history-detail-item-top">
                      <span className="history-detail-type-badge">
                        {getHistoryItemTypeLabel(item.type)}
                      </span>

                      <span className={`history-detail-status-badge ${itemStatus.className}`}>
                        {itemStatus.label}
                      </span>
                    </div>

                    <h3>{item.name}</h3>

                    <div className="history-detail-item-meta">
                      <span>Số lượng: {item.quantity || 0}</span>
                      <span>Đơn giá: {money(item.price)}</span>
                    </div>

                    <strong>{money(getHistoryLineTotal(item))}</strong>
                  </article>
                );
              })}
            </div>

            <div className="history-detail-total-box">
              <span>Tổng tiền</span>
              <strong>{money(order?.totalAmount)}</strong>
            </div>

            <button type="button" className="history-detail-button" onClick={onClose}>
              Đóng
            </button>
          </>
        )}
      </section>
    </div>
  );
}

function PaymentRequestSuccessModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="payment-success-backdrop" onClick={onClose}>
      <section className="payment-success-modal" onClick={(event) => event.stopPropagation()}>
        <button className="payment-success-close" type="button" onClick={onClose}>
          ×
        </button>

        <div className="payment-success-icon">🍜</div>

        <h2>Lemonde Steak xin cảm ơn quý khách đã sử dụng dịch vụ tại nhà hàng.</h2>

        <p>
          Quý khách vui lòng đợi một chút, nhân viên của Lemonde Steak sẽ gửi hóa đơn tới quý khách trong ít phút.
        </p>

        <button className="payment-success-button" type="button" onClick={onClose}>
          Đóng
        </button>
      </section>
    </div>
  );
}

function UserProfileView({ auth, onLoginClick, onSaveProfile }) {
  const [form, setForm] = useState({
    fullName: auth?.fullName || auth?.username || auth?.name || '',
    email: auth?.email || ''
  });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    setForm({
      fullName: auth?.fullName || auth?.username || auth?.name || '',
      email: auth?.email || ''
    });
    setNotice('');
  }, [auth]);

  if (!auth) {
    return (
      <section className="profile-page">
        <h1>Thông tin tài khoản</h1>

        <div className="profile-card profile-login-card">
          <h2>Bạn chưa đăng nhập</h2>
          <p>Đăng nhập để xem và chỉnh sửa thông tin tài khoản.</p>

          <button className="profile-save-btn" type="button" onClick={onLoginClick}>
            Đăng nhập / Đăng ký
          </button>
        </div>
      </section>
    );
  }

  const submit = async (event) => {
    event.preventDefault();

    if (!form.fullName.trim()) {
      setNotice('Vui lòng nhập họ và tên.');
      return;
    }

    setSaving(true);
    setNotice('');

    try {
      await onSaveProfile({
        fullName: form.fullName.trim(),
        email: form.email.trim()
      });
      setNotice('Đã lưu thay đổi.');
    } catch (err) {
      setNotice(err.message || 'Không lưu được thông tin tài khoản.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="profile-page">
      <h1>Thông tin tài khoản</h1>

      <form className="profile-card" onSubmit={submit}>
        <label>
          <span>Họ và tên</span>
          <input
            value={form.fullName}
            onChange={(event) => {
              setForm((current) => ({ ...current, fullName: event.target.value }));
              setNotice('');
            }}
            placeholder="Nhập họ và tên"
            maxLength={100}
          />
        </label>

        <label>
          <span>Email</span>
          <input
            value={form.email}
            onChange={(event) => {
              setForm((current) => ({ ...current, email: event.target.value }));
              setNotice('');
            }}
            placeholder="Email (tùy chọn)"
            type="email"
            maxLength={150}
          />
        </label>

        {notice && <div className="profile-notice">{notice}</div>}

        <button className="profile-save-btn" type="submit" disabled={saving}>
          {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>

      </form>
    </section>
  );
}

export default function App() {
  const initialTable = getTableInfo();
  const initialAuth = getCustomerAuth();

  const [auth, setAuth] = useState(initialAuth);
  const [activeTab, setActiveTab] = useState('menu');
  const [tableNumber] = useState(initialTable.tableNumber || '');
  const [tableId] = useState(initialTable.tableId || '');
  const [foods, setFoods] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [cart, setCart] = useState(() => readCart(initialAuth));
  const [cartOpen, setCartOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [foodDetail, setFoodDetail] = useState(null);
  const [currentOrder, setCurrentOrder] = useState(() => readCurrentOrder(initialAuth));
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [ordering, setOrdering] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);

  const [promotions, setPromotions] = useState([]);
  const [promotionsOpen, setPromotionsOpen] = useState(false);
  const [loadingPromotions, setLoadingPromotions] = useState(false);
  const [applyingPromotionId, setApplyingPromotionId] = useState('');
  const [requestingPayment, setRequestingPayment] = useState(false);
  const [paymentSuccessOpen, setPaymentSuccessOpen] = useState(false);

  const [historyOrders, setHistoryOrders] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [historyDetailOpen, setHistoryDetailOpen] = useState(false);
  const [historyDetailLoading, setHistoryDetailLoading] = useState(false);
  const [historyDetailError, setHistoryDetailError] = useState('');
  const [historyDetailOrder, setHistoryDetailOrder] = useState(null);

  const messageTimerRef = useRef(null);

  const showMessage = (text, duration = 1800) => {
    setMessage(text);

    if (messageTimerRef.current) {
      clearTimeout(messageTimerRef.current);
    }

    messageTimerRef.current = setTimeout(() => {
      setMessage('');
      messageTimerRef.current = null;
    }, duration);
  };

  const clearMessageTimer = () => {
    if (messageTimerRef.current) {
      clearTimeout(messageTimerRef.current);
      messageTimerRef.current = null;
    }
  };

  const cartQuantity = auth ? cart.reduce((sum, item) => sum + item.quantity, 0) : 0;
  const cartTotal = auth ? cart.reduce((sum, item) => sum + item.price * item.quantity, 0) : 0;

  const isCustomerLoggedIn = Boolean(auth?.token || auth?.accessToken || auth?.jwt);

  const displayName =
    auth?.fullName ||
    auth?.username ||
    auth?.customerName ||
    auth?.name ||
    '';

  const filteredFoods = useMemo(() => {
    const key = normalizeText(keyword);

    return foods.filter((food) => {
      const matchCategory =
        activeCategory === 'all' || String(food.categoryId) === String(activeCategory);

      const matchKeyword =
        !key ||
        normalizeText(food.name).includes(key) ||
        normalizeText(food.description).includes(key);

      return matchCategory && matchKeyword;
    });
  }, [foods, activeCategory, keyword]);

  const loadMenu = async () => {
    setLoading(true);
    setMessage('');
    clearMessageTimer();

    try {
      let categoryData = [];
      let itemData = [];
      let comboData = [];

      try {
        const data = await apiFetch('/api/menu/categories');
        categoryData = Array.isArray(data) ? data : data?.data || [];
      } catch {
        categoryData = [];
      }

      try {
        const data = await apiFetch('/api/menu/items');
        itemData = Array.isArray(data) ? data : data?.data || [];
      } catch {
        itemData = [];
      }

      try {
        const data = await apiFetch('/api/menu/combos');
        comboData = Array.isArray(data) ? data : data?.data || [];
      } catch {
        comboData = [];
      }

      const mergedFoods = [
        ...sanitizeItems(itemData),
        ...sanitizeCombos(comboData)
      ];

      let normalizedCategories = categoryData
        .filter(Boolean)
        .map((category) => ({
          id: category.id || category.categoryId || category.categoryName || category.name,
          name: category.categoryName || category.name || 'Danh mục'
        }))
        .filter((category) => category.id);

      if (!normalizedCategories.length) {
        const map = new Map();

        mergedFoods.forEach((food) => {
          map.set(food.categoryId, food.categoryName);
        });

        normalizedCategories = Array.from(map.entries()).map(([id, name]) => ({
          id,
          name
        }));
      }

      setFoods(mergedFoods);
      setCategories(normalizedCategories);
    } catch (err) {
      clearMessageTimer();
      setMessage(err.message || 'Không tải được thực đơn.');
    } finally {
      setLoading(false);
    }
  };

  const saveCart = (nextCart) => {
    if (!auth) {
      setCart([]);
      return;
    }

    setCart(nextCart);
    writeCart(auth, nextCart);
  };

  const saveCurrentOrder = (order) => {
    setCurrentOrder(order);
    writeCurrentOrder(auth, order);
  };

  const requireLogin = () => {
    if (auth) return true;

    setMessage('Vui lòng đăng nhập để sử dụng giỏ hàng.');
    clearMessageTimer();
    setAuthOpen(true);
    return false;
  };

  const addToCart = (food) => {
    if (!requireLogin()) return;

    const key = `${food.type}-${food.id}`;
    const existed = cart.find((item) => `${item.type}-${item.id}` === key);

    let nextCart;

    if (existed) {
      nextCart = cart.map((item) =>
        `${item.type}-${item.id}` === key
          ? {
            ...item,
            quantity: item.quantity + 1
          }
          : item
      );
    } else {
      nextCart = [
        ...cart,
        {
          id: food.id,
          type: food.type,
          name: food.name,
          price: food.price,
          image: food.image,
          quantity: 1
        }
      ];
    }

    saveCart(nextCart);
    showMessage('Đã thêm món vào giỏ hàng.', 1800);
    setFoodDetail(null);
  };

  const changeQty = (food, quantity) => {
    if (!requireLogin()) return;

    if (quantity <= 0) {
      removeFromCart(food);
      return;
    }

    const nextCart = cart.map((item) =>
      item.id === food.id && item.type === food.type
        ? {
          ...item,
          quantity
        }
        : item
    );

    saveCart(nextCart);
  };

  const removeFromCart = (food) => {
    if (!requireLogin()) return;

    saveCart(cart.filter((item) => !(item.id === food.id && item.type === food.type)));
  };

  const clearCart = () => {
    if (!auth) {
      setCart([]);
      return;
    }

    clearCartStorage(auth);
    setCart([]);
    setOrderSuccess(null);
  };

  const openCart = () => {
    if (!requireLogin()) return;
    setCartOpen(true);
  };

  const submitOrder = async () => {
    if (!requireLogin()) return;

    if (ordering) return;

    if (!cart.length) {
      setMessage('Giỏ hàng đang trống.');
      clearMessageTimer();
      return;
    }

    if (!tableNumber && !tableId) {
      setMessage('Vui lòng quét QR tại bàn trước khi đặt món.');
      clearMessageTimer();
      return;
    }

    const orderSnapshot = cart.map((item) => ({
      ...item,
      status: 'WAITING'
    }));

    const payload = {
      tableId: tableId || null,
      tableNumber: tableNumber || null,
      items: cart
        .filter((item) => item.type === 'ITEM')
        .map((item) => ({
          itemId: item.id,
          quantity: item.quantity
        })),
      combos: cart
        .filter((item) => item.type === 'COMBO')
        .map((item) => ({
          comboId: item.id,
          quantity: item.quantity
        })),
      customerNotes: ''
    };

    setOrdering(true);
    setMessage('');
    clearMessageTimer();

    try {
      const result = await apiFetch('/api/customer/orders', {
        method: 'POST',
        body: payload
      });

      const nextOrder = {
        id: result.id,
        orderNumber: result.orderNumber,
        tableId: result.tableId,
        orderStatus: result.orderStatus || 'PENDING',
        tableStatus: result.tableStatus || 'USING',
        items: orderSnapshot,
        subTotal: Number(result.subTotal || cartTotal),
        taxAmount: Number(result.taxAmount || 0),
        serviceCharge: Number(result.serviceCharge || 0),
        discountAmount: Number(result.discountAmount || 0),
        totalAmount: Number(result.totalAmount || cartTotal),
        promotionId: '',
        promotionName: '',
        promotionType: '',
        promotionValue: 0
      };

      saveCurrentOrder(nextOrder);

      clearCartStorage(auth);
      setCart([]);

      setOrderSuccess({
        id: result.id,
        orderNumber: result.orderNumber
      });
    } catch (err) {
      setMessage(err.message || 'Đặt món thất bại. Vui lòng thử lại.');
      clearMessageTimer();
    } finally {
      setOrdering(false);
    }
  };

  const closeOrderSuccess = () => {
    clearCartStorage(auth);
    setCart([]);
    setOrderSuccess(null);
    setCartOpen(false);
  };

  const loadPromotions = async () => {
    setLoadingPromotions(true);

    try {
      const data = await apiFetch('/api/customer/promotions/available');
      setPromotions(Array.isArray(data) ? data : data?.data || []);
    } catch (err) {
      setPromotions([]);
      showMessage(err.message || 'Không tải được mã giảm giá.', 1800);
    } finally {
      setLoadingPromotions(false);
    }
  };

  const togglePromotions = async () => {
    const nextOpen = !promotionsOpen;
    setPromotionsOpen(nextOpen);

    if (nextOpen && !promotions.length) {
      await loadPromotions();
    }
  };

  const applyPromotionToCurrentOrder = async (promotion) => {
    if (!currentOrder?.id) {
      showMessage('Chưa có đơn hàng để áp dụng mã giảm giá.', 1800);
      return;
    }

    setApplyingPromotionId(promotion.id);

    try {
      const result = await apiFetch(`/api/customer/orders/${currentOrder.id}/promotion`, {
        method: 'PATCH',
        body: {
          promotionId: promotion.id
        }
      });

      const nextOrder = {
        ...currentOrder,
        promotionId: result.promotionId,
        promoCode: result.promotionId,
        promotionName: result.promotionName,
        promotionType: result.promotionType || promotion.type,
        promotionValue: Number(result.promotionValue || promotion.value || 0),
        discountAmount: Number(result.discountAmount || 0),
        subTotal: Number(result.subTotal || currentOrder.subTotal || 0),
        taxAmount: Number(result.taxAmount || currentOrder.taxAmount || 0),
        serviceCharge: Number(result.serviceCharge || currentOrder.serviceCharge || 0),
        totalAmount: Number(result.totalAmount || currentOrder.totalAmount || 0)
      };

      saveCurrentOrder(nextOrder);
      showMessage('Áp dụng mã giảm giá thành công.', 1800);
    } catch (err) {
      showMessage(err.message || 'Không áp dụng được mã giảm giá.', 2200);
    } finally {
      setApplyingPromotionId('');
    }
  };

  const requestPayment = async () => {
    if (!currentOrder?.id) {
      showMessage('Chưa có đơn hàng để thanh toán.', 1800);
      return;
    }

    setRequestingPayment(true);

    try {
      const result = await apiFetch(`/api/customer/orders/${currentOrder.id}/request-payment`, {
        method: 'PATCH'
      });

      const nextOrder = {
        ...currentOrder,
        orderStatus: result.orderStatus || 'REQUEST_PAYMENT',
        tableStatus: result.tableStatus || 'REQUEST_PAYMENT'
      };

      saveCurrentOrder(nextOrder);
      setPaymentSuccessOpen(true);
    } catch (err) {
      showMessage(err.message || 'Không thể gửi yêu cầu thanh toán.', 2200);
    } finally {
      setRequestingPayment(false);
    }
  };



  const loadHistoryOrders = async (silent = false) => {
    if (!auth) {
      setHistoryOrders([]);
      setHistoryError('');
      return;
    }

    if (!silent) {
      setHistoryLoading(true);
      setHistoryError('');
    }

    try {
      const data = await apiFetch('/api/customer/orders/history');
      setHistoryOrders(Array.isArray(data) ? data : data?.data || []);
      setHistoryError('');
    } catch (err) {
      const errorMessage = String(err.message || '');

      setHistoryOrders([]);

      if (
        errorMessage.includes('404') ||
        errorMessage.includes('NOT_FOUND') ||
        errorMessage.includes('Không tìm thấy đơn hàng') ||
        errorMessage.includes('Không tìm thấy')
      ) {
        setHistoryError('');
      } else {
        setHistoryError(errorMessage || 'Không tải được lịch sử đặt món.');
      }
    } finally {
      if (!silent) {
        setHistoryLoading(false);
      }
    }
  };

  const openHistoryDetail = async (order) => {
    if (!order?.id) return;

    setHistoryDetailOpen(true);
    setHistoryDetailLoading(true);
    setHistoryDetailError('');
    setHistoryDetailOrder({
      ...order,
      items: []
    });

    try {
      const data = await apiFetch(`/api/customer/orders/${order.id}`);

      setHistoryDetailOrder({
        ...order,
        ...data,
        createdAt: data?.createdAt || order.createdAt,
        updatedAt: data?.updatedAt || order.updatedAt,
        items: Array.isArray(data?.items) ? data.items : []
      });
    } catch (err) {
      setHistoryDetailError(err.message || 'Không tải được chi tiết đơn hàng.');
    } finally {
      setHistoryDetailLoading(false);
    }
  };

  const closeHistoryDetail = () => {
    setHistoryDetailOpen(false);
    setHistoryDetailLoading(false);
    setHistoryDetailError('');
    setHistoryDetailOrder(null);
  };

  const saveProfile = async (profile) => {
    const nextAuth = {
      ...auth,
      fullName: profile.fullName,
      name: profile.fullName,
      email: profile.email
    };

    saveCustomerAuth(nextAuth);
    setAuth(nextAuth);

    try {
      await apiFetch('/api/customer/profile', {
        method: 'PATCH',
        body: profile
      });
    } catch {
      // Dự án hiện tại có thể chưa có API cập nhật hồ sơ.
      // Vẫn lưu thông tin vào localStorage để giao diện hoạt động ổn định.
    }
  };

  const handleLoggedIn = (nextAuth) => {
    setAuth(nextAuth);
    setCart(readCart(nextAuth));
    setCurrentOrder(readCurrentOrder(nextAuth));
    setHistoryOrders([]);
    setHistoryError('');
    closeHistoryDetail();
    showMessage('Đăng nhập thành công.', 1600);
  };

  const logout = () => {
    clearCartStorage(auth);
    clearCustomerAuth();
    setAuth(null);
    setCart([]);
    setCartOpen(false);
    setFoodDetail(null);
    setCurrentOrder(null);
    setHistoryOrders([]);
    setHistoryError('');
    closeHistoryDetail();
    setOrderSuccess(null);
    setActiveTab('menu');
    showMessage('Đã đăng xuất. Giỏ hàng đã được làm mới.', 1800);
  };

  useEffect(() => {
    loadMenu();
  }, []);

  useEffect(() => {
    if (!auth) {
      setCart([]);
      setCurrentOrder(null);
      setHistoryOrders([]);
      setHistoryError('');
      return;
    }

    setCart(readCart(auth));
    setCurrentOrder(readCurrentOrder(auth));
  }, [auth]);

  useEffect(() => {
    if (!currentOrder?.id) return undefined;

    let cancelled = false;

    const loadCurrentOrder = async () => {
      try {
        const data = await apiFetch(`/api/customer/orders/${currentOrder.id}`);

        if (cancelled) return;

        const nextOrder = {
          ...currentOrder,
          ...data,
          items: normalizeOrderItems(data.items || currentOrder.items || [])
        };

        setCurrentOrder(nextOrder);
        writeCurrentOrder(auth, nextOrder);
      } catch {
        // Không hiện lỗi liên tục khi polling.
      }
    };

    loadCurrentOrder();

    const timer = window.setInterval(loadCurrentOrder, 2000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [currentOrder?.id, auth]);



  useEffect(() => {
    if (activeTab === 'history' && auth) {
      loadHistoryOrders(false);
    }
  }, [activeTab, auth]);

  useEffect(() => {
    return () => {
      clearMessageTimer();
    };
  }, []);

  return (
    <div className="customer-page">
      <main className="phone-shell">
        <header className="customer-header">
          <strong>Lemonde Steak</strong>

          <div className="customer-header-right">
            {isCustomerLoggedIn && displayName && <span>Chào, {displayName}</span>}

            <button
              className={isCustomerLoggedIn ? 'header-logout-btn' : 'header-login-btn'}
              type="button"
              onClick={isCustomerLoggedIn ? logout : () => setAuthOpen(true)}
            >
              {isCustomerLoggedIn ? <LogIn size={16} /> : 'Đăng nhập'}
            </button>
          </div>
        </header>

        <section className="customer-scroll">
          {activeTab === 'menu' && (
            <>
              <section className={tableNumber ? 'table-box' : 'table-box no-table'}>
                <div className="table-icon">{tableNumber ? '⌖' : '⌁'}</div>

                <div>
                  <h2>{tableNumber ? tableLabel(tableNumber) : 'Lemonde Steak'}</h2>

                  <p>
                    {tableNumber
                      ? 'Quét QR thành công. Bạn có thể chọn món và đặt món cho bàn này.'
                      : 'Quét mã QR tại bàn để xem thực đơn và đặt món.'}
                  </p>
                </div>
              </section>

              <section className="search-box">
                <Search size={18} />
                <input
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="Tìm kiếm món ăn..."
                />
              </section>

              <section className="category-row">
                <button
                  type="button"
                  className={activeCategory === 'all' ? 'active' : ''}
                  onClick={() => setActiveCategory('all')}
                >
                  Tất cả
                </button>

                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    className={String(activeCategory) === String(category.id) ? 'active' : ''}
                    onClick={() => setActiveCategory(category.id)}
                  >
                    {category.name}
                  </button>
                ))}
              </section>
            </>
          )}

          {message && <div className="customer-message">{message}</div>}

          {activeTab === 'menu' && (
            <>
              {loading ? (
                <div className="customer-empty">Đang tải thực đơn...</div>
              ) : filteredFoods.length ? (
                <section className="food-grid">
                  {filteredFoods.map((food) => (
                    <article
                      className="food-card"
                      key={`${food.type}-${food.id}`}
                      onClick={() => setFoodDetail(food)}
                    >
                      <img src={imageUrl(food.image)} alt={food.name} />

                      <div className="food-card-body">
                        <h3>{food.name}</h3>
                        <p>{food.description || 'Món ngon chuẩn vị Lemonde Steak.'}</p>

                        <div className="food-bottom">
                          <b>{money(food.price)}</b>

                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              addToCart(food);
                            }}
                          >
                            Thêm
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </section>
              ) : (
                <div className="customer-empty">Không có món ăn trùng khớp.</div>
              )}
            </>
          )}

          {activeTab === 'current' && (
            <CurrentOrderView
              currentOrder={currentOrder}
              promotions={promotions}
              promotionsOpen={promotionsOpen}
              loadingPromotions={loadingPromotions}
              applyingPromotionId={applyingPromotionId}
              requestingPayment={requestingPayment}
              onTogglePromotions={togglePromotions}
              onApplyPromotion={applyPromotionToCurrentOrder}
              onRequestPayment={requestPayment}
            />
          )}

          {activeTab === 'history' && (
            <OrderHistoryView
              auth={auth}
              orders={historyOrders}
              loading={historyLoading}
              error={historyError}
              onReload={() => loadHistoryOrders(false)}
            />
          )}

          {activeTab === 'user' && (
            <UserProfileView
              auth={auth}
              onLoginClick={() => setAuthOpen(true)}
              onSaveProfile={saveProfile}
            />
          )}
        </section>

        <nav className="bottom-nav">
          <button
            type="button"
            className={activeTab === 'menu' ? 'active' : ''}
            onClick={() => setActiveTab('menu')}
          >
            <Home size={18} />
            <span>Món ăn</span>
          </button>

          <button
            type="button"
            className={activeTab === 'current' ? 'active' : ''}
            onClick={() => setActiveTab('current')}
          >
            <ClipboardList size={18} />
            <span>Đơn hiện tại</span>
          </button>

          <button
            type="button"
            className={activeTab === 'history' ? 'active' : ''}
            onClick={() => setActiveTab('history')}
          >
            <History size={18} />
            <span>Lịch sử</span>
          </button>

          <button
            type="button"
            className={activeTab === 'user' ? 'active' : ''}
            onClick={() => setActiveTab('user')}
          >
            <UserRound size={18} />
            <span>Người dùng</span>
          </button>

          <button type="button" className="cart-nav-btn" onClick={openCart}>
            <ShoppingCart size={21} />
            <b>{money(cartTotal)}</b>
            {cartQuantity > 0 && <em>{cartQuantity}</em>}
          </button>
        </nav>

        <AuthModal
          open={authOpen}
          onClose={() => setAuthOpen(false)}
          onLoggedIn={handleLoggedIn}
        />

        <FoodDetailModal
          food={foodDetail}
          onClose={() => setFoodDetail(null)}
          onAdd={addToCart}
        />

        <OrderHistoryDetailModal
          open={historyDetailOpen}
          loading={historyDetailLoading}
          error={historyDetailError}
          order={historyDetailOrder}
          onClose={closeHistoryDetail}
          onRetry={() => historyDetailOrder && openHistoryDetail(historyDetailOrder)}
        />

        <PaymentRequestSuccessModal
          open={paymentSuccessOpen}
          onClose={() => setPaymentSuccessOpen(false)}
        />

        <CartSheet
          open={cartOpen}
          cart={auth ? cart : []}
          ordering={ordering}
          orderSuccess={orderSuccess}
          onClose={() => setCartOpen(false)}
          onChangeQty={changeQty}
          onRemove={removeFromCart}
          onClear={clearCart}
          onOrder={submitOrder}
          onCloseSuccess={closeOrderSuccess}
        />
      </main>
    </div>
  );
}