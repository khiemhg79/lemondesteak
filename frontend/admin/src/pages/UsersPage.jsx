import FormField from '../components/FormField.jsx';

export default function UsersPage({ users, form, setForm, createUser, updateRole, updateActive }) {
  return (
    <div className="grid cols-2">
      <div className="card">
        <h2>Tạo tài khoản</h2>
        <div className="form">
          <FormField label="Họ tên"><input className="input" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></FormField>
          <FormField label="SĐT"><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></FormField>
          <FormField label="Email"><input className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></FormField>
          <FormField label="Mật khẩu"><input className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></FormField>
          <FormField label="Role"><select className="select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}><option>CUSTOMER</option><option>STAFF</option><option>ADMIN</option></select></FormField>
          <button className="btn" onClick={createUser}>Tạo user</button>
        </div>
      </div>

      <div className="card">
        <h2>Danh sách người dùng</h2>
        <table className="table"><thead><tr><th>Tên</th><th>SĐT</th><th>Role</th><th>Trạng thái</th></tr></thead><tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.username}</td><td>{user.phone}</td>
              <td><select className="select" value={user.role} onChange={(e) => updateRole(user, e.target.value)}><option>CUSTOMER</option><option>STAFF</option><option>ADMIN</option></select></td>
              <td><button className="btn small secondary" onClick={() => updateActive(user, !user.active)}>{user.active ? 'Khóa' : 'Mở'}</button></td>
            </tr>
          ))}
        </tbody></table>
      </div>
    </div>
  );
}
