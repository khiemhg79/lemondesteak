export default function UserPage({ auth, onLoginClick, onLogout }) {
  return (
    <main className="tab-page">
      <h2>Người dùng</h2>

      {auth ? (
        <div className="profile-box">
          <b>{auth.fullName || 'Khách hàng Lemonde Steak'}</b>
          <span>{auth.phone}</span>
          <button className="btn" onClick={onLogout}>Đăng xuất</button>
        </div>
      ) : (
        <button className="btn" onClick={onLoginClick}>Đăng nhập / Đăng ký</button>
      )}
    </main>
  );
}
