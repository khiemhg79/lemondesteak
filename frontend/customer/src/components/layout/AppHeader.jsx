import { LogIn, Utensils } from 'lucide-react';

export default function AppHeader({ auth, onLoginClick, onLogout }) {
  return (
    <header className="app-header">
      <div className="brand-mini">
        <img
          src="/logo.png"
          onError={(e) => { e.target.style.display = 'none'; }}
          alt="Logo"
          style={{ height: 32, borderRadius: 6, objectFit: 'contain' }}
        />
        <div>
          <b>Lemonde Steak</b>
          <small>QR Ordering</small>
        </div>
      </div>

      {auth ? (
        <button className="login-chip" onClick={onLogout}>
          {auth.fullName || 'Khách hàng'}
        </button>
      ) : (
        <button className="login-chip" onClick={onLoginClick}>
          <LogIn size={16} />
        </button>
      )}
    </header>
  );
}
