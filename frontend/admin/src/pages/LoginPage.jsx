import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { api } from '../services/api.js';

export default function LoginPage({ onLogin, toast }) {
  const [form, setForm] = useState({ phone: '', password: '' });

  const submit = async (event) => {
    event.preventDefault();
    try {
      const auth = await api('/api/auth/login', { method: 'POST', body: form });
      if (auth.role !== 'ADMIN') throw new Error('Tài khoản này không có quyền quản trị');
      localStorage.setItem('lemondesteak_admin_auth', JSON.stringify(auth));
      onLogin(auth);
      toast('Đăng nhập admin thành công');
    } catch (err) {
      toast(err.message);
    }
  };

  return (
    <div className="card auth-box">
      <span className="badge"><ShieldCheck size={16} /> Admin</span>
      <h2>Đăng nhập quản trị</h2>
      <form className="form" onSubmit={submit}>
        <div className="field"><label>Số điện thoại</label><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
        <div className="field"><label>Mật khẩu</label><input className="input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
        <button className="btn">Đăng nhập</button>
      </form>
    </div>
  );
}
