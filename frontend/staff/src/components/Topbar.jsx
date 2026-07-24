import { LogOut, Utensils } from 'lucide-react';

export default function Topbar({ auth, onLogout }) {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="brand"><div className="logo"><Utensils size={22} /></div><div>LemondeSteak<br /><span className="muted">Staff Dashboard</span></div></div>
        {auth && <div className="nav-actions"><span className="status">{auth.fullName} · {auth.role}</span><button className="btn secondary" onClick={onLogout}><LogOut size={15} /> Thoát</button></div>}
      </div>
    </header>
  );
}
