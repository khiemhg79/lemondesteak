import { Edit3, Gift, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api.js';
import './admin-promotions.css';

const TYPE_OPTIONS = [
    {
        value: 'PERCENT',
        label: 'Phần trăm (%)'
    },
    {
        value: 'FIXED',
        label: 'Số tiền (đ)'
    }
];

function normalizePromotionType(type) {
    const value = String(type || '').trim().toUpperCase();

    if (
        value === 'PERCENT' ||
        value === 'PERCENTAGE' ||
        value === 'PERCENTAGE_DISCOUNT' ||
        value === 'PHAN_TRAM' ||
        value === 'PHANTRAM' ||
        value === 'PHẦN TRĂM' ||
        value === 'PHẦN TRĂM (%)' ||
        value.includes('PERCENT') ||
        value.includes('PHAN') ||
        value.includes('%')
    ) {
        return 'PERCENT';
    }

    if (
        value === 'FIXED' ||
        value === 'FIXED_AMOUNT' ||
        value === 'AMOUNT' ||
        value === 'MONEY' ||
        value === 'CASH' ||
        value === 'SO_TIEN' ||
        value === 'SOTIEN' ||
        value === 'SỐ TIỀN' ||
        value.includes('FIXED') ||
        value.includes('AMOUNT') ||
        value.includes('MONEY') ||
        value.includes('TIEN') ||
        value.includes('TIỀN')
    ) {
        return 'FIXED';
    }

    return 'FIXED';
}

function money(value) {
    return new Intl.NumberFormat('vi-VN').format(Number(value || 0)) + ' đ';
}

function dateInputValue(value) {
    if (!value) return '';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return '';

    return date.toISOString().slice(0, 10);
}

function toIsoDate(dateValue, endOfDay = false) {
    if (!dateValue) return null;

    return endOfDay
        ? `${dateValue}T23:59:59+07:00`
        : `${dateValue}T00:00:00+07:00`;
}

const DEFAULT_PROMOTIONS = [
    {
        id: '1',
        name: 'Giảm 20% Sinh Nhật',
        type: 'PERCENT',
        value: 20,
        startDate: '2026-07-01T00:00:00',
        endDate: '2026-12-31T23:59:59',
        usedCount: 6,
        usageLimit: 1000,
        isActive: true,
        description: 'Giảm giá nhân dịp sinh nhật.'
    },
    {
        id: '2',
        name: 'Giảm 50K Cuối Tuần',
        type: 'FIXED',
        value: 50000,
        startDate: '2026-07-01T00:00:00',
        endDate: '2026-12-31T23:59:59',
        usedCount: 3,
        usageLimit: 200,
        isActive: true,
        description: 'Ưu đãi cuối tuần cho hóa đơn từ 300.000đ.'
    },
    {
        id: '3',
        name: 'Giảm 10% Khách Mới',
        type: 'PERCENT',
        value: 10,
        startDate: '2026-07-01T00:00:00',
        endDate: '2026-12-31T23:59:59',
        usedCount: 1,
        usageLimit: 500,
        isActive: true,
        description: 'Ưu đãi cho khách lần đầu.'
    },
    {
        id: '4',
        name: 'Giảm 75% Đầu Tháng',
        type: 'PERCENT',
        value: 75,
        startDate: '2026-07-01T00:00:00',
        endDate: '2026-12-31T23:59:59',
        usedCount: 4,
        usageLimit: 100,
        isActive: true,
        description: 'Giảm 75% deal hời deal hời.'
    },
    {
        id: '5',
        name: 'Giảm 75K Cuối Tuần',
        type: 'FIXED',
        value: 75000,
        startDate: '2026-07-01T00:00:00',
        endDate: '2026-12-31T23:59:59',
        usedCount: 3,
        usageLimit: 200,
        isActive: true,
        description: 'Ưu đãi cuối tuần.'
    }
];

function formatDate(value) {
    if (!value || value === 'null' || value === 'undefined' || value === 'N/A') return 'N/A';

    let dateObj = null;

    if (value instanceof Date) {
        dateObj = value;
    } else if (typeof value === 'number') {
        dateObj = new Date(value);
    } else if (typeof value === 'string') {
        const clean = value.trim();
        if (!clean || clean === 'null' || clean === 'N/A') return 'N/A';
        const isoFormatted = clean.includes(' ') ? clean.replace(' ', 'T') : clean;
        dateObj = new Date(isoFormatted);
    }

    if (!dateObj || Number.isNaN(dateObj.getTime())) {
        return 'N/A';
    }

    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();

    return `${day}/${month}/${year}`;
}

function formatDateRange(startDate, endDate) {
    const start = formatDate(startDate);
    const end = formatDate(endDate);

    if (start === 'N/A' && end === 'N/A') {
        return 'Vô thời hạn';
    }

    if (start !== 'N/A' && end !== 'N/A') {
        return `${start} - ${end}`;
    }

    if (start !== 'N/A') return `Từ ${start}`;

    return `Đến ${end}`;
}

function typeLabel(type) {
    return normalizePromotionType(type) === 'PERCENT' ? 'Phần trăm' : 'Số tiền';
}

function valueText(promotion) {
    const type = normalizePromotionType(promotion.type);
    const value = Number(promotion.value || 0);

    if (type === 'PERCENT') {
        return `${value}%`;
    }

    return money(value);
}

function usageText(promotion) {
    if (!promotion.usageLimit) return '∞';

    return `${promotion.usedCount || 0}/${promotion.usageLimit}`;
}

function promotionStatus(promotion) {
    if (promotion.isActive === false) {
        return {
            label: 'Tạm dừng',
            className: 'inactive'
        };
    }

    const now = Date.now();
    const start = promotion.startDate ? new Date(promotion.startDate).getTime() : 0;
    const end = promotion.endDate ? new Date(promotion.endDate).getTime() : 0;

    if (start && now < start) {
        return {
            label: 'Sắp diễn ra',
            className: 'pending'
        };
    }

    if (end && now > end) {
        return {
            label: 'Hết hạn',
            className: 'expired'
        };
    }

    if (
        promotion.usageLimit &&
        Number(promotion.usedCount || 0) >= Number(promotion.usageLimit)
    ) {
        return {
            label: 'Hết lượt',
            className: 'expired'
        };
    }

    return {
        label: 'Hoạt động',
        className: 'active'
    };
}

function emptyForm() {
    return {
        name: '',
        type: 'PERCENT',
        value: '',
        startDate: '',
        endDate: '',
        description: '',
        minOrderAmount: '',
        maxDiscount: '',
        usageLimit: '',
        isActive: true
    };
}

function PromotionModal({ open, mode, promotion, onClose, onSaved }) {
    const [form, setForm] = useState(emptyForm());
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const isEdit = mode === 'edit';

    useEffect(() => {
        if (!open) return;

        if (isEdit && promotion) {
            const normalizedType = normalizePromotionType(promotion.type);

            setForm({
                name: promotion.name || '',
                type: normalizedType,
                value: String(Number(promotion.value || 0)),
                startDate: dateInputValue(promotion.startDate),
                endDate: dateInputValue(promotion.endDate),
                description: promotion.description || '',
                minOrderAmount: String(Number(promotion.minOrderAmount || 0)),
                maxDiscount:
                    promotion.maxDiscount === null || promotion.maxDiscount === undefined
                        ? ''
                        : String(Number(promotion.maxDiscount || 0)),
                usageLimit:
                    promotion.usageLimit === null || promotion.usageLimit === undefined
                        ? ''
                        : String(promotion.usageLimit),
                isActive: promotion.isActive !== false
            });
        } else {
            setForm(emptyForm());
        }

        setError('');
    }, [open, isEdit, promotion]);

    if (!open) return null;

    const setValue = (key, value) => {
        setForm((current) => {
            let nextValue = value;

            if (
                [
                    'value',
                    'minOrderAmount',
                    'maxDiscount',
                    'usageLimit'
                ].includes(key)
            ) {
                nextValue = String(value || '').replace(/[^\d]/g, '');
            }

            if (key === 'value' && normalizePromotionType(current.type) === 'PERCENT') {
                const numberValue = Math.min(100, Number(nextValue || 0));
                nextValue = numberValue ? String(numberValue) : '';
            }

            if (key === 'name') {
                nextValue = String(value || '').slice(0, 50);
            }

            return {
                ...current,
                [key]: nextValue
            };
        });

        setError('');
    };

    const changeType = (type) => {
        const normalizedType = normalizePromotionType(type);

        setForm((current) => ({
            ...current,
            type: normalizedType,
            value:
                normalizedType === 'PERCENT'
                    ? String(Math.min(100, Number(current.value || 0)) || '')
                    : current.value
        }));

        setError('');
    };

    const validate = () => {
        if (!form.name.trim()) return 'Vui lòng nhập tên khuyến mãi.';
        if (form.name.trim().length > 50) return 'Tên khuyến mãi tối đa 50 ký tự.';

        const type = normalizePromotionType(form.type);
        const value = Number(form.value || 0);

        if (value <= 0) return 'Giá trị khuyến mãi phải lớn hơn 0.';

        if (type === 'PERCENT' && value > 100) {
            return 'Giá trị phần trăm không được lớn hơn 100%.';
        }

        if (!form.startDate) return 'Vui lòng chọn ngày bắt đầu.';
        if (!form.endDate) return 'Vui lòng chọn ngày kết thúc.';

        if (new Date(form.endDate).getTime() < new Date(form.startDate).getTime()) {
            return 'Ngày kết thúc phải sau ngày bắt đầu.';
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
            const normalizedType = normalizePromotionType(form.type);

            const body = {
                name: form.name.trim(),
                type: normalizedType,
                value: Number(form.value || 0),
                minOrderAmount: Number(form.minOrderAmount || 0),
                maxDiscount:
                    form.maxDiscount === '' ? null : Number(form.maxDiscount || 0),
                description: form.description.trim() || null,
                startDate: toIsoDate(form.startDate, false),
                endDate: toIsoDate(form.endDate, true),
                usageLimit: form.usageLimit === '' ? null : Number(form.usageLimit),
                isActive: form.isActive
            };

            if (isEdit) {
                await api(`/api/admin/promotions/${promotion.id}`, {
                    method: 'PUT',
                    body
                });
            } else {
                await api('/api/admin/promotions', {
                    method: 'POST',
                    body
                });
            }

            onSaved();
        } catch (err) {
            setError(err.message || 'Không lưu được khuyến mãi.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="admin-modal-backdrop" onClick={onClose}>
            <section
                className="admin-promotion-modal admin-promotions-modal modal-card scale-up"
                onClick={(event) => event.stopPropagation()}
            >
                <header className="admin-modal-head">
                    <h2>{isEdit ? 'Sửa khuyến mãi' : 'Thêm khuyến mãi'}</h2>

                    <button type="button" onClick={onClose}>
                        <X size={18} />
                    </button>
                </header>

                <form className="admin-promotion-form" onSubmit={submit}>
                    <label>
                        <span>Tên khuyến mãi</span>
                        <input
                            value={form.name}
                            onChange={(event) => setValue('name', event.target.value)}
                            placeholder="VD: Giảm 20% cuối tuần"
                            maxLength={50}
                        />
                    </label>

                    <div className="promotion-form-grid">
                        <label>
                            <span>Loại</span>
                            <select
                                value={normalizePromotionType(form.type)}
                                onChange={(event) => changeType(event.target.value)}
                            >
                                {TYPE_OPTIONS.map((type) => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label>
                            <span>Giá trị</span>
                            <input
                                value={form.value}
                                onChange={(event) => setValue('value', event.target.value)}
                                placeholder={
                                    normalizePromotionType(form.type) === 'PERCENT'
                                        ? '20'
                                        : '50000'
                                }
                                inputMode="numeric"
                                maxLength={
                                    normalizePromotionType(form.type) === 'PERCENT'
                                        ? 3
                                        : 9
                                }
                            />
                        </label>
                    </div>

                    <div className="promotion-form-grid">
                        <label>
                            <span>Ngày bắt đầu</span>
                            <input
                                value={form.startDate}
                                onChange={(event) => setValue('startDate', event.target.value)}
                                type="date"
                            />
                        </label>

                        <label>
                            <span>Ngày kết thúc</span>
                            <input
                                value={form.endDate}
                                onChange={(event) => setValue('endDate', event.target.value)}
                                type="date"
                            />
                        </label>
                    </div>

                    <label>
                        <span>Mô tả</span>
                        <textarea
                            value={form.description}
                            onChange={(event) => setValue('description', event.target.value)}
                            placeholder="Mô tả về khuyến mãi..."
                        />
                    </label>

                    <div className="promotion-form-grid">
                        <label>
                            <span>Đơn tối thiểu</span>
                            <input
                                value={form.minOrderAmount}
                                onChange={(event) =>
                                    setValue('minOrderAmount', event.target.value)
                                }
                                placeholder="100000"
                                inputMode="numeric"
                            />
                        </label>

                        <label>
                            <span>Giảm tối đa</span>
                            <input
                                value={form.maxDiscount}
                                onChange={(event) => setValue('maxDiscount', event.target.value)}
                                placeholder="50000"
                                inputMode="numeric"
                            />
                        </label>
                    </div>

                    <label>
                        <span>Giới hạn sử dụng</span>
                        <input
                            value={form.usageLimit}
                            onChange={(event) => setValue('usageLimit', event.target.value)}
                            placeholder="100 lần"
                            inputMode="numeric"
                        />
                    </label>

                    <label className="admin-check-row">
                        <input
                            type="checkbox"
                            checked={form.isActive}
                            onChange={(event) => setValue('isActive', event.target.checked)}
                        />
                        Kích hoạt khuyến mãi
                    </label>

                    {error && <div className="admin-form-error">{error}</div>}

                    <button className="admin-submit-btn" type="submit" disabled={saving}>
                        {saving
                            ? 'Đang lưu...'
                            : isEdit
                                ? 'Cập nhật khuyến mãi'
                                : 'Tạo khuyến mãi'}
                    </button>
                </form>
            </section>
        </div>
    );
}

function DeletePromotionModal({ promotion, onClose, onDeleted }) {
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState('');

    if (!promotion) return null;

    const confirmDelete = async () => {
        setDeleting(true);
        setError('');

        try {
            await api(`/api/admin/promotions/${promotion.id}`, {
                method: 'DELETE'
            });

            onDeleted();
        } catch (err) {
            setError(err.message || 'Không xóa được khuyến mãi.');
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
                <h2>Xác nhận xóa khuyến mãi</h2>

                <p>
                    Bạn có chắc muốn xóa chương trình <b>{promotion.name}</b> không?
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

export default function PromotionManagementPage() {
    const [promotions, setPromotions] = useState([]);
    const [modalMode, setModalMode] = useState('');
    const [selectedPromotion, setSelectedPromotion] = useState(null);
    const [deletePromotion, setDeletePromotion] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const activeCount = useMemo(() => {
        return promotions.filter(
            (promotion) => promotionStatus(promotion).className === 'active'
        ).length;
    }, [promotions]);

    const loadPromotions = async () => {
        setLoading(true);
        setMessage('');

        try {
            const data = await api('/api/admin/promotions');
            setPromotions(Array.isArray(data) && data.length > 0 ? data : DEFAULT_PROMOTIONS);
        } catch {
            setPromotions(DEFAULT_PROMOTIONS);
        } finally {
            setLoading(false);
        }
    };

    const openCreate = () => {
        setSelectedPromotion(null);
        setModalMode('create');
    };

    const openEdit = (promotion) => {
        setSelectedPromotion(promotion);
        setModalMode('edit');
    };

    const closeModal = () => {
        setSelectedPromotion(null);
        setModalMode('');
    };

    const handleSaved = () => {
        closeModal();
        setMessage('Thao tác khuyến mãi thành công.');
        loadPromotions();
    };

    const handleDeleted = () => {
        setDeletePromotion(null);
        setMessage('Đã xóa chương trình khuyến mãi.');
        loadPromotions();
    };

    useEffect(() => {
        loadPromotions();
    }, []);

    return (
        <main className="admin-content bright-theme">
            <section className="admin-page-head">
                <div>
                    <h1 className="head-title">Quản lý Khuyến Mãi (Promotions)</h1>
                    <p className="head-sub">Xem, thêm, sửa, xóa các chương trình khuyến mãi và mã ưu đãi của nhà hàng.</p>
                </div>

                <div className="admin-head-actions">
                    <button
                        className="admin-refresh-btn bright"
                        type="button"
                        onClick={loadPromotions}
                    >
                        <RefreshCw size={16} />
                        Làm mới
                    </button>

                    <button className="admin-add-btn" type="button" onClick={openCreate}>
                        <Plus size={16} />
                        Thêm khuyến mãi
                    </button>
                </div>
            </section>

            <section className="admin-user-summary">
                <div>
                    <span>Tổng khuyến mãi</span>
                    <b>{promotions.length}</b>
                </div>

                <div>
                    <span>Đang hoạt động</span>
                    <b>{activeCount}</b>
                </div>
            </section>

            {message && <div className="admin-message">{message}</div>}

            <section className="admin-table-card">
                {loading ? (
                    <div className="admin-empty">
                        <div className="admin-loading-spinner" />
                        <p className="admin-loading-text">Đang tải danh sách khuyến mãi...</p>
                        <small className="admin-loading-sub">Vui lòng chờ trong giây lát</small>
                    </div>
                ) : promotions.length ? (
                    <table className="admin-promotions-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Tên</th>
                                <th>Loại</th>
                                <th>Giá trị</th>
                                <th>Thời gian</th>
                                <th>Sử dụng</th>
                                <th>Trạng thái</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>

                        <tbody>
                            {promotions.map((promotion, index) => {
                                const status = promotionStatus(promotion);

                                return (
                                    <tr key={promotion.id}>
                                        <td>{index + 1}</td>

                                        <td>
                                            <b>{promotion.name}</b>
                                            {promotion.description && (
                                                <small>{promotion.description}</small>
                                            )}
                                        </td>

                                        <td>{typeLabel(promotion.type)}</td>

                                        <td>
                                            <strong className="promotion-value">
                                                {valueText(promotion)}
                                            </strong>
                                        </td>

                                        <td>
                                            <span className="promo-date-range">
                                                {formatDateRange(promotion.startDate, promotion.endDate)}
                                            </span>
                                        </td>

                                        <td>{usageText(promotion)}</td>

                                        <td>
                                            <span className={`promo-status-chip ${status.className}`}>
                                                {status.label}
                                            </span>
                                        </td>

                                        <td>
                                            <div className="admin-row-actions">
                                                <button type="button" onClick={() => openEdit(promotion)}>
                                                    <Edit3 size={15} />
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => setDeletePromotion(promotion)}
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                ) : (
                    <div className="admin-empty">
                        <Gift size={38} />
                        <h3>Chưa có khuyến mãi</h3>
                        <p>Bấm “Thêm khuyến mãi” để tạo chương trình mới.</p>
                    </div>
                )}
            </section>

            <PromotionModal
                open={Boolean(modalMode)}
                mode={modalMode}
                promotion={selectedPromotion}
                onClose={closeModal}
                onSaved={handleSaved}
            />

            <DeletePromotionModal
                promotion={deletePromotion}
                onClose={() => setDeletePromotion(null)}
                onDeleted={handleDeleted}
            />
        </main>
    );
}