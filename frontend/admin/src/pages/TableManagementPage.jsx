import { Edit3, Plus, RefreshCw, Table2, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api.js';
import './admin-tables.css';

const STATUS_OPTIONS = [
    {
        value: 'EMPTY',
        label: 'Trống'
    },
    {
        value: 'USING',
        label: 'Đang dùng'
    },
    {
        value: 'RESERVED',
        label: 'Đặt trước'
    },
    {
        value: 'CLEANING',
        label: 'Dọn dẹp'
    },
    {
        value: 'MAINTENANCE',
        label: 'Bảo trì'
    }
];

function emptyForm() {
    return {
        tableNumber: '',
        capacity: '2',
        status: 'EMPTY',
        isActive: true
    };
}

function statusLabel(status) {
    const found = STATUS_OPTIONS.find((item) => item.value === status);
    return found?.label || status || 'Bàn trống';
}

function statusClass(status) {
    if (status === 'EMPTY') return 'empty';
    if (status === 'USING') return 'using';
    if (status === 'RESERVED') return 'reserved';
    if (status === 'CLEANING') return 'cleaning';
    if (status === 'MAINTENANCE') return 'maintenance';
    return 'empty';
}

function normalizeCapacity(value) {
    return String(value || '').replace(/[^\d]/g, '').slice(0, 10);
}

function TableModal({ open, mode, table, onClose, onSaved }) {
    const [form, setForm] = useState(emptyForm());
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const isEdit = mode === 'edit';

    useEffect(() => {
        if (!open) return;

        if (isEdit && table) {
            setForm({
                tableNumber: table.tableNumber || '',
                capacity: String(table.capacity || 2),
                status: table.status || 'EMPTY',
                isActive: table.isActive !== false
            });
        } else {
            setForm(emptyForm());
        }

        setError('');
    }, [open, isEdit, table]);

    if (!open) return null;

    const setValue = (key, value) => {
        setForm((current) => ({
            ...current,
            [key]: key === 'capacity' ? normalizeCapacity(value) : value
        }));

        setError('');
    };

    const validate = () => {
        const tableNumber = form.tableNumber.trim();

        if (!tableNumber) return 'Vui lòng nhập số bàn.';
        if (tableNumber.length > 10) return 'Số bàn tối đa 10 ký tự.';

        const capacity = Number(form.capacity || 0);

        if (capacity <= 0) return 'Sức chứa phải là số nguyên lớn hơn 0.';

        if (!form.status) return 'Vui lòng chọn trạng thái bàn.';

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
                tableNumber: form.tableNumber.trim(),
                capacity: Number(form.capacity || 0),
                status: form.status,
                isActive: form.isActive
            };

            if (isEdit) {
                await api(`/api/admin/tables/${table.id}`, {
                    method: 'PUT',
                    body
                });
            } else {
                await api('/api/admin/tables', {
                    method: 'POST',
                    body
                });
            }

            onSaved();
        } catch (err) {
            setError(err.message || 'Không lưu được bàn.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="admin-modal-backdrop" onClick={onClose}>
            <section
                className="admin-table-modal"
                onClick={(event) => event.stopPropagation()}
            >
                <header className="admin-modal-head">
                    <h2>{isEdit ? 'Sửa bàn' : 'Thêm bàn'}</h2>

                    <button type="button" onClick={onClose}>
                        <X size={18} />
                    </button>
                </header>

                <form className="admin-table-form" onSubmit={submit}>
                    <label>
                        <span>Số bàn</span>
                        <input
                            value={form.tableNumber}
                            onChange={(event) =>
                                setValue('tableNumber', event.target.value.slice(0, 10))
                            }
                            placeholder="VD: 01, A1, B2"
                            maxLength={10}
                        />
                    </label>

                    <label>
                        <span>Sức chứa</span>
                        <input
                            value={form.capacity}
                            onChange={(event) => setValue('capacity', event.target.value)}
                            placeholder="2"
                            inputMode="numeric"
                            maxLength={10}
                        />
                    </label>

                    <label>
                        <span>Trạng thái</span>
                        <select
                            value={form.status}
                            onChange={(event) => setValue('status', event.target.value)}
                        >
                            {STATUS_OPTIONS.map((status) => (
                                <option key={status.value} value={status.value}>
                                    {status.label}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="admin-check-row">
                        <input
                            type="checkbox"
                            checked={form.isActive}
                            onChange={(event) => setValue('isActive', event.target.checked)}
                        />
                        Kích hoạt bàn
                    </label>

                    {error && <div className="admin-form-error">{error}</div>}

                    <button className="admin-submit-btn" type="submit" disabled={saving}>
                        {saving ? 'Đang lưu...' : isEdit ? 'Cập nhật bàn' : 'Tạo bàn'}
                    </button>
                </form>
            </section>
        </div>
    );
}

function DeleteModal({ table, onClose, onDeleted }) {
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState('');

    if (!table) return null;

    const confirmDelete = async () => {
        setDeleting(true);
        setError('');

        try {
            await api(`/api/admin/tables/${table.id}`, {
                method: 'DELETE'
            });

            onDeleted();
        } catch (err) {
            setError(err.message || 'Không xóa được bàn.');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="admin-modal-backdrop" onClick={onClose}>
            <section
                className="admin-delete-modal"
                onClick={(event) => event.stopPropagation()}
            >
                <h2>Xác nhận xóa bàn</h2>

                <p>
                    Bạn có chắc muốn xóa <b>Bàn {table.tableNumber}</b> khỏi hệ thống
                    không?
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

export default function TableManagementPage() {
    const [tables, setTables] = useState([]);
    const [modalMode, setModalMode] = useState('');
    const [selectedTable, setSelectedTable] = useState(null);
    const [deleteTable, setDeleteTable] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const summary = useMemo(() => {
        return tables.reduce(
            (result, table) => {
                if (table.status === 'EMPTY') result.empty += 1;
                if (table.status === 'USING') result.using += 1;
                if (table.status === 'RESERVED') result.reserved += 1;
                if (table.status === 'CLEANING') result.cleaning += 1;
                if (table.status === 'MAINTENANCE') result.maintenance += 1;

                return result;
            },
            {
                empty: 0,
                using: 0,
                reserved: 0,
                cleaning: 0,
                maintenance: 0
            }
        );
    }, [tables]);

    const loadTables = async () => {
        setLoading(true);
        setMessage('');

        try {
            const data = await api('/api/admin/tables');
            setTables(Array.isArray(data) ? data : []);
        } catch (err) {
            setMessage(err.message || 'Hệ thống tải trang không thành công.');
        } finally {
            setLoading(false);
        }
    };

    const openCreate = () => {
        setSelectedTable(null);
        setModalMode('create');
    };

    const openEdit = (table) => {
        setSelectedTable(table);
        setModalMode('edit');
    };

    const closeModal = () => {
        setSelectedTable(null);
        setModalMode('');
    };

    const handleSaved = () => {
        closeModal();
        setMessage('Thao tác bàn thành công.');
        loadTables();
    };

    const handleDeleted = () => {
        setDeleteTable(null);
        setMessage('Đã xóa bàn khỏi danh sách.');
        loadTables();
    };

    useEffect(() => {
        loadTables();
    }, []);

    return (
        <main className="admin-content bright-theme">
            <section className="admin-page-head">
                <div>
                    <h1 className="head-title">Quản lý Bàn & Mã QR</h1>
                    <p className="head-sub">Thêm, sửa, xóa bàn và xem mã QR đặt món trực tiếp tại các bàn.</p>
                </div>

                <div className="admin-head-actions">
                    <button className="admin-refresh-btn bright" type="button" onClick={loadTables}>
                        <RefreshCw size={16} />
                        Làm mới
                    </button>

                    <button className="admin-add-btn" type="button" onClick={openCreate}>
                        <Plus size={16} />
                        Thêm bàn
                    </button>
                </div>
            </section>

            <section className="admin-table-summary">
                <div>
                    <span className="dot empty" />
                    Trống: <b>{summary.empty}</b>
                </div>

                <div>
                    <span className="dot using" />
                    Đang dùng: <b>{summary.using}</b>
                </div>

                <div>
                    <span className="dot reserved" />
                    Đặt trước: <b>{summary.reserved}</b>
                </div>

                <div>
                    <span className="dot cleaning" />
                    Dọn dẹp: <b>{summary.cleaning}</b>
                </div>

                <div>
                    <span className="dot maintenance" />
                    Bảo trì: <b>{summary.maintenance}</b>
                </div>
            </section>

            {message && <div className="admin-message">{message}</div>}

            <section className="admin-tables-grid-card">
                {loading ? (
                    <div className="admin-empty">
                        <Table2 size={38} />
                        <p>Đang tải danh sách bàn...</p>
                    </div>
                ) : tables.length ? (
                    <div className="admin-tables-grid">
                        {tables.map((table) => (
                            <article
                                key={table.id}
                                className={`admin-table-card-item ${statusClass(table.status)}`}
                            >
                                <div className="table-card-head">
                                    <div>
                                        <h3>Bàn {table.tableNumber}</h3>
                                        <p>Sức chứa: {table.capacity} người</p>
                                    </div>

                                    <span className={`table-status-pill ${statusClass(table.status)}`}>
                                        {statusLabel(table.status)}
                                    </span>
                                </div>

                                <div className="table-card-actions">
                                    <button type="button" onClick={() => openEdit(table)}>
                                        <Edit3 size={15} />
                                    </button>

                                    <button type="button" onClick={() => setDeleteTable(table)}>
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                ) : (
                    <div className="admin-empty">
                        <Table2 size={38} />
                        <h3>Chưa có bàn</h3>
                        <p>Bấm “Thêm bàn” để tạo bàn mới.</p>
                    </div>
                )}
            </section>

            <TableModal
                open={Boolean(modalMode)}
                mode={modalMode}
                table={selectedTable}
                onClose={closeModal}
                onSaved={handleSaved}
            />

            <DeleteModal
                table={deleteTable}
                onClose={() => setDeleteTable(null)}
                onDeleted={handleDeleted}
            />
        </main>
    );
}