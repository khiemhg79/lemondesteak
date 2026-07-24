import { useState } from 'react';
import { X } from 'lucide-react';
import { api } from '../../services/api.js';

const initialForm = {
  fullName: '',
  phone: '',
  password: '',
  confirmPassword: ''
};

export default function AuthModal({ open, onClose, onLogin, toast }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const setValue = (key, value) => {
    const nextValue = key === 'phone' ? value.replace(/\D/g, '').slice(0, 10) : value;
    setForm((prev) => ({ ...prev, [key]: nextValue }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setErrors({});
    setForm((prev) => ({ ...prev, password: '', confirmPassword: '' }));
  };

  const validate = () => {
    const nextErrors = {};

    if (mode === 'register' && !form.fullName.trim()) {
      nextErrors.fullName = 'Vui lòng nhập họ tên.';
    }

    if (!form.phone.trim()) {
      nextErrors.phone = 'Vui lòng nhập số điện thoại.';
    } else if (!/^0\d{9}$/.test(form.phone.trim())) {
      nextErrors.phone = 'Số điện thoại không hợp lệ.';
    }

    if (!form.password) {
      nextErrors.password = 'Vui lòng nhập mật khẩu.';
    } else if (form.password.length < 8) {
      nextErrors.password = 'Mật khẩu phải có ít nhất 8 ký tự.';
    }

    if (mode === 'register') {
      if (!form.confirmPassword) {
        nextErrors.confirmPassword = 'Vui lòng nhập lại mật khẩu.';
      } else if (form.confirmPassword !== form.password) {
        nextErrors.confirmPassword = 'Mật khẩu nhập lại không khớp.';
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    setLoading(true);

    try {
      if (mode === 'login') {
        const auth = await api('/api/auth/login', {
          method: 'POST',
          body: { phone: form.phone.trim(), password: form.password }
        });

        if (auth.role !== 'CUSTOMER') {
          throw new Error('Tài khoản này không phải tài khoản khách hàng.');
        }

        onLogin(auth);
        onClose();
        toast('Đăng nhập thành công.');
      } else {
        await api('/api/auth/register', {
          method: 'POST',
          body: {
            fullName: form.fullName.trim(),
            phone: form.phone.trim(),
            password: form.password,
            confirmPassword: form.confirmPassword
          }
        });

        toast('Đăng ký thành công, hãy đăng nhập.');
        setMode('login');
        setForm((prev) => ({ ...prev, password: '', confirmPassword: '' }));
        setErrors({});
      }
    } catch (err) {
      const msg = err.message || 'Có lỗi xảy ra.';

      if (msg.toLowerCase().includes('số điện thoại') || msg.toLowerCase().includes('phone')) {
        setErrors((prev) => ({ ...prev, phone: msg }));
      } else if (msg.toLowerCase().includes('mật khẩu') || msg.toLowerCase().includes('password')) {
        setErrors((prev) => ({ ...prev, password: msg }));
      } else {
        toast(`Lỗi hệ thống: ${msg}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-backdrop" onClick={onClose}>
      <div className="auth-modal" onClick={(event) => event.stopPropagation()}>
        <button className="auth-close" onClick={onClose} type="button">
          <X size={18} />
        </button>

        <div className="auth-logo">L</div>
        <h2 className="auth-title">Chào mừng bạn đến với Lemonde Steak</h2>
        <p className="auth-subtitle">Hãy đăng nhập hoặc tạo tài khoản để tiếp tục đặt món tại bàn.</p>

        <div className="auth-tabs">
          <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => switchMode('login')}>
            Đăng nhập
          </button>
          <button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => switchMode('register')}>
            Đăng ký
          </button>
        </div>

        <form className="auth-form" onSubmit={submit}>
          {mode === 'register' && (
            <div className="auth-field">
              <label>Họ và tên</label>
              <input value={form.fullName} onChange={(event) => setValue('fullName', event.target.value)} placeholder="Họ và tên" maxLength={100} />
              {errors.fullName && <div className="auth-error">{errors.fullName}</div>}
            </div>
          )}

          <div className="auth-field">
            <label>Số điện thoại</label>
            <input value={form.phone} onChange={(event) => setValue('phone', event.target.value)} placeholder="Số điện thoại" inputMode="numeric" maxLength={10} />
            {errors.phone && <div className="auth-error">{errors.phone}</div>}
          </div>

          <div className="auth-field">
            <label>Mật khẩu</label>
            <input value={form.password} onChange={(event) => setValue('password', event.target.value)} placeholder="Mật khẩu" type="password" maxLength={50} />
            {errors.password && <div className="auth-error">{errors.password}</div>}
          </div>

          {mode === 'register' && (
            <div className="auth-field">
              <label>Nhập lại mật khẩu</label>
              <input value={form.confirmPassword} onChange={(event) => setValue('confirmPassword', event.target.value)} placeholder="Nhập lại mật khẩu" type="password" maxLength={50} />
              {errors.confirmPassword && <div className="auth-error">{errors.confirmPassword}</div>}
            </div>
          )}

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? 'Đang xử lý...' : mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
          </button>
        </form>
      </div>
    </div>
  );
}
