import { LogIn, Utensils } from 'lucide-react';

export default function AppHeader({ auth, onLoginClick, onLogout }) {
  return (
    <header className="app-header">
      <div className="brand-mini">
        <span>
          <Utensils size={20} />
        </span>
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
