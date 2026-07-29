import { Edit3, Plus, RefreshCw, Trash2, UserRound, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api.js';
import './admin-users.css';

const ROLE_OPTIONS = [
    {
        value: 'ADMIN',
        label: 'Admin'
    },
    {
        value: 'STAFF',
        label: 'Staff'
    },
    {
        value: 'CUSTOMER',
        label: 'Customer'
    }
];

function roleLabel(role) {
    const item = ROLE_OPTIONS.find((option) => option.value === role);
    return item?.label || role;
}

function normalizePhone(value) {
    return String(value || '').replace(/\D/g, '').slice(0, 10);
}

function emptyForm() {
    return {
        username: '',
        phone: '',
        email: '',
        password: '',
        role: '',
        isActive: true
    };
}

function UserModal({ open, mode, user, onClose, onSaved }) {
    const [form, setForm] = useState(emptyForm());
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const isEdit = mode === 'edit';

    useEffect(() => {
        if (!open) return;

        if (isEdit && user) {
            setForm({
                username: user.username || '',
                phone: user.phone || '',
                email: user.email || '',
                password: '',
                role: user.role || 'CUSTOMER',
                isActive: user.isActive !== false
            });
        } else {
            setForm(emptyForm());
        }

        setError('');
    }, [open, isEdit, user]);

    if (!open) return null;

    const setValue = (key, value) => {
        setForm((current) => ({
            ...current,
            [key]: key === 'phone' ? normalizePhone(value) : value
        }));

        setError('');
    };

    const validate = () => {
        const username = form.username.trim();

        if (!username) return 'Vui lòng nhập tên đăng nhập.';
        if (username.length > 50) return 'Tên đăng nhập tối đa 50 ký tự.';
        if (!/^\d{10}$/.test(form.phone)) return 'Số điện thoại phải gồm đúng 10 chữ số.';
        if (!form.role) return 'Vui lòng chọn vai trò.';

        if (!isEdit || form.password.trim()) {
            if (form.password.length < 8 || form.password.length > 20) {
                return 'Mật khẩu phải từ 8 đến 20 ký tự.';
            }
        }

        return '';
    };

    const submit = async (event) => {
        event.preventDefault();

        const validationMessage = validate();

        if (validationMessage) {
            setError(validationMessage);
            return;
        }

        setSaving(true);

        try {
            const body = {
                username: form.username.trim(),
                phone: form.phone,
                email: form.email.trim() || null,
                password: form.password,
                role: form.role,
                isActive: form.isActive
            };

            if (isEdit && !body.password) {
                delete body.password;
            }

            if (isEdit) {
                await api(`/api/admin/users/${user.id}`, {
                    method: 'PUT',
                    body
                });
            } else {
                await api('/api/admin/users', {
                    method: 'POST',
                    body
                });
            }

            onSaved();
        } catch (err) {
            setError(err.message || 'Không lưu được người dùng.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="admin-modal-backdrop" onClick={onClose}>
            <section className="admin-user-modal" onClick={(event) => event.stopPropagation()}>
                <header className="admin-modal-head">
                    <h2>{isEdit ? 'Sửa người dùng' : 'Thêm người dùng'}</h2>

                    <button type="button" onClick={onClose}>
                        <X size={18} />
                    </button>
                </header>

                <form className="admin-user-form" onSubmit={submit}>
                    <input
                        value={form.username}
                        onChange={(event) => setValue('username', event.target.value.slice(0, 50))}
                        placeholder="Tên đăng nhập"
                        maxLength={50}
                    />

                    <input
                        value={form.phone}
                        onChange={(event) => setValue('phone', event.target.value)}
                        placeholder="Số điện thoại (10 chữ số)"
                        inputMode="numeric"
                        maxLength={10}
                    />

                    <input
                        value={form.email}
                        onChange={(event) => setValue('email', event.target.value)}
                        placeholder="Email"
                        type="email"
                    />

                    <input
                        value={form.password}
                        onChange={(event) => setValue('password', event.target.value.slice(0, 20))}
                        placeholder={isEdit ? 'Mật khẩu mới (bỏ trống nếu không đổi)' : 'Mật khẩu'}
                        type="password"
                        maxLength={20}
                    />

                    <select
                        value={form.role}
                        onChange={(event) => setValue('role', event.target.value)}
                    >
                        <option value="">Chọn vai trò</option>
                        {ROLE_OPTIONS.map((role) => (
                            <option key={role.value} value={role.value}>
                                {role.label}
                            </option>
                        ))}
                    </select>

                    <label className="admin-check-row">
                        <input
                            type="checkbox"
                            checked={form.isActive}
                            onChange={(event) => setValue('isActive', event.target.checked)}
                        />
                        Tài khoản hoạt động
                    </label>

                    {error && <div className="admin-form-error">{error}</div>}

                    <button className="admin-submit-btn" type="submit" disabled={saving}>
                        {saving ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Tạo người dùng'}
                    </button>
                </form>
            </section>
        </div>
    );
}

function DeleteConfirmModal({ user, onClose, onDeleted }) {
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState('');

    if (!user) return null;

    const confirmDelete = async () => {
        setDeleting(true);
        setError('');

        try {
            await api(`/api/admin/users/${user.id}`, {
                method: 'DELETE'
            });

            onDeleted();
        } catch (err) {
            setError(err.message || 'Không xóa được người dùng.');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="admin-modal-backdrop" onClick={onClose}>
            <section className="admin-delete-modal" onClick={(event) => event.stopPropagation()}>
                <h2>Xác nhận xóa tài khoản</h2>

                <p>
                    Bạn có chắc muốn xóa/khóa tài khoản <b>{user.username}</b> không?
                </p>

                {error && <div className="admin-form-error">{error}</div>}

                <div className="admin-delete-actions">
                    <button type="button" onClick={onClose}>
                        Đóng
                    </button>

                    <button type="button" onClick={confirmDelete} disabled={deleting}>
                        {deleting ? 'Đang xóa...' : 'Đồng ý'}
                    </button>
                </div>
            </section>
        </div>
    );
}

export default function UserManagementPage() {
    const [users, setUsers] = useState([]);
    const [modalMode, setModalMode] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [deleteUser, setDeleteUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const activeUsers = useMemo(() => {
        return users.filter((user) => user.isActive !== false).length;
    }, [users]);

    const loadUsers = async () => {
        setLoading(true);
        setMessage('');

        try {
            const data = await api('/api/admin/users');
            setUsers(Array.isArray(data) ? data : []);
        } catch (err) {
            setMessage(err.message || 'Hệ thống tải trang không thành công.');
        } finally {
            setLoading(false);
        }
    };

    const openCreate = () => {
        setSelectedUser(null);
        setModalMode('create');
    };

    const openEdit = (user) => {
        setSelectedUser(user);
        setModalMode('edit');
    };

    const closeModal = () => {
        setSelectedUser(null);
        setModalMode('');
    };

    const handleSaved = () => {
        closeModal();
        setMessage('Thao tác người dùng thành công.');
        loadUsers();
    };

    const handleDeleted = () => {
        setDeleteUser(null);
        setMessage('Đã xóa/khóa tài khoản người dùng.');
        loadUsers();
    };

    useEffect(() => {
        loadUsers();
    }, []);

    return (
        <main className="admin-content bright-theme">
            <section className="admin-page-head">
                <div>
                    <h1 className="head-title">Quản lý Nhân Viên & Người Dùng</h1>
                    <p className="head-sub">Xem, thêm, sửa, phân quyền và quản lý tài khoản nhân viên hệ thống.</p>
                </div>

                <div className="admin-head-actions">
                    <button className="admin-refresh-btn bright" type="button" onClick={loadUsers}>
                        <RefreshCw size={16} />
                        Làm mới
                    </button>

                    <button className="admin-refresh-btn bright" style={{ background: '#e63917', color: '#fff' }} type="button" onClick={openCreate}>
                        <Plus size={16} />
                        Thêm người dùng
                    </button>
                </div>
            </section>

            <section className="admin-user-summary">
                <div>
                    <span>Tổng người dùng</span>
                    <b>{users.length}</b>
                </div>

                <div>
                    <span>Đang hoạt động</span>
                    <b>{activeUsers}</b>
                </div>
            </section>

            {message && <div className="admin-message">{message}</div>}

            <section className="admin-table-card">
                {loading ? (
                    <div className="admin-empty">
                        <div className="admin-loading-spinner" />
                        <p className="admin-loading-text">Đang tải danh sách người dùng...</p>
                        <small className="admin-loading-sub">Vui lòng chờ trong giây lát</small>
                    </div>
                ) : users.length ? (
                    <table className="admin-users-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Tên đăng nhập</th>
                                <th>Số điện thoại</th>
                                <th>Vai trò</th>
                                <th>Trạng thái</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>

                        <tbody>
                            {users.map((user, index) => (
                                <tr key={user.id}>
                                    <td>{index + 1}</td>

                                    <td>{user.username}</td>

                                    <td>{user.phone}</td>

                                    <td>
                                        <span className={`role-chip ${String(user.role).toLowerCase()}`}>
                                            {roleLabel(user.role)}
                                        </span>
                                    </td>

                                    <td>
                                        <span className={user.isActive ? 'status-chip active' : 'status-chip inactive'}>
                                            {user.isActive ? 'Hoạt động' : 'Đã khóa'}
                                        </span>
                                    </td>

                                    <td>
                                        <div className="admin-row-actions">
                                            <button type="button" onClick={() => openEdit(user)}>
                                                <Edit3 size={15} />
                                            </button>

                                            <button type="button" onClick={() => setDeleteUser(user)}>
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="admin-empty">
                        <UserRound size={38} />
                        <h3>Chưa có người dùng</h3>
                        <p>Bấm “Thêm người dùng” để tạo tài khoản mới.</p>
                    </div>
                )}
            </section>

            <UserModal
                open={Boolean(modalMode)}
                mode={modalMode}
                user={selectedUser}
                onClose={closeModal}
                onSaved={handleSaved}
            />

            <DeleteConfirmModal
                user={deleteUser}
                onClose={() => setDeleteUser(null)}
                onDeleted={handleDeleted}
            />
        </main>
    );
}