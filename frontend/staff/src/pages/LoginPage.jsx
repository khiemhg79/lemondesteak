import { useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { api } from '../services/api.js';

export default function LoginPage({ onLogin, toast }) {
  const [form, setForm] = useState({ phone: '', password: '' });

  const submit = async (event) => {
    event.preventDefault();
    try {
      const auth = await api('/api/auth/login', { method: 'POST', body: form });
      if (!['STAFF', 'ADMIN'].includes(auth.role)) throw new Error('Tài khoản này không có quyền nhân viên');
      localStorage.setItem('lemondesteak_staff_auth', JSON.stringify(auth));
      onLogin(auth);
      toast('Đăng nhập nhân viên thành công');
    } catch (err) {
      toast(err.message);
    }
  };

  return (
    <div className="card auth-box">
      <span className="badge"><ClipboardList size={16} /> Staff</span>
      <h2>Đăng nhập nhân viên</h2>
      <form className="form" onSubmit={submit}>
        <div className="field"><label>Số điện thoại</label><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
        <div className="field"><label>Mật khẩu</label><input className="input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
        <button className="btn">Đăng nhập</button>
      </form>
    </div>
  );
}
