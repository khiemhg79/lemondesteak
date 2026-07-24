import {
    ChevronDown,
    ChevronUp,
    Edit3,
    ImagePlus,
    MenuSquare,
    Plus,
    RefreshCw,
    Trash2,
    X
} from 'lucide-react';
import { Fragment, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api.js';
import './admin-menu.css';

const MAX_IMAGE_SIZE = 3 * 1024 * 1024;

function money(value) {
    return new Intl.NumberFormat('vi-VN').format(Number(value || 0)) + 'đ';
}

function emptyItemForm() {
    return {
        name: '',
        price: '',
        categoryId: '',
        description: '',
        image: '',
        isAvailable: true
    };
}

function emptyComboForm() {
    return {
        name: '',
        price: '',
        description: '',
        image: '',
        isActive: true,
        items: []
    };
}

function emptyCategoryForm() {
    return {
        categoryName: '',
        description: '',
        sortOrder: '0',
        isActive: true
    };
}

function normalizePrice(value) {
    return String(value || '').replace(/[^\d]/g, '').slice(0, 9);
}

function normalizeSortOrder(value) {
    return String(value || '').replace(/[^\d]/g, '').slice(0, 5);
}

function itemStatusText(item) {
    return item.isAvailable
        ? { label: 'Hoạt động', className: 'active' }
        : { label: 'Hết món', className: 'inactive' };
}

function comboStatusText(combo) {
    return combo.isActive
        ? { label: 'Hoạt động', className: 'active' }
        : { label: 'Tạm dừng', className: 'inactive' };
}

function categoryStatusText(category) {
    return category.isActive
        ? { label: 'Hoạt động', className: 'active' }
        : { label: 'Tạm dừng', className: 'inactive' };
}

function ImagePicker({ image, onImageChange, onError }) {
    const chooseImage = (file) => {
        if (!file) return;

        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];

        if (!allowedTypes.includes(file.type)) {
            onError('Ảnh chỉ hỗ trợ png, jpg, jpeg.');
            return;
        }

        if (file.size > MAX_IMAGE_SIZE) {
            onError('Dung lượng ảnh tối đa 3MB.');
            return;
        }

        const reader = new FileReader();

        reader.onload = () => {
            onImageChange(String(reader.result || ''));
            onError('');
        };

        reader.onerror = () => {
            onError('Tải ảnh không thành công.');
        };

        reader.readAsDataURL(file);
    };

    return (
        <div className="item-image-picker">
            {image ? (
                <div className="item-image-preview">
                    <img src={image} alt="Ảnh" />

                    <button type="button" onClick={() => onImageChange('')}>
                        Xóa ảnh
                    </button>
                </div>
            ) : (
                <div className="item-image-empty">
                    <ImagePlus size={26} />
                    <span>Chọn ảnh</span>
                </div>
            )}

            <input
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={(event) => chooseImage(event.target.files?.[0])}
            />
        </div>
    );
}

function ItemModal({ open, mode, item, categories, onClose, onSaved }) {
    const [form, setForm] = useState(emptyItemForm());
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const isEdit = mode === 'edit';
    const activeCategories = categories.filter((category) => category.isActive !== false);

    useEffect(() => {
        if (!open) return;

        if (isEdit && item) {
            setForm({
                name: item.name || '',
                price: String(Number(item.price || 0)),
                categoryId: item.categoryId || '',
                description: item.description || '',
                image: item.image || '',
                isAvailable: item.isAvailable !== false
            });
        } else {
            setForm(emptyItemForm());
        }

        setError('');
    }, [open, isEdit, item]);

    if (!open) return null;

    const setValue = (key, value) => {
        setForm((current) => ({
            ...current,
            [key]: key === 'price' ? normalizePrice(value) : value
        }));

        setError('');
    };

    const validate = () => {
        const name = form.name.trim();

        if (!name) return 'Vui lòng nhập tên món ăn.';
        if (name.length > 50) return 'Tên món ăn tối đa 50 ký tự.';

        const price = Number(form.price || 0);

        if (price <= 0) return 'Vui lòng nhập giá món ăn.';
        if (price > 999999999) return 'Giá món ăn tối đa 9 chữ số.';

        if (!form.categoryId) return 'Vui lòng chọn danh mục.';
        if (!form.image) return 'Vui lòng chọn ảnh món ăn.';

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
                name: form.name.trim(),
                price: Number(form.price || 0),
                categoryId: form.categoryId,
                description: form.description.trim() || null,
                image: form.image,
                isAvailable: form.isAvailable
            };

            if (isEdit) {
                await api(`/api/admin/menu/items/${item.id}`, {
                    method: 'PUT',
                    body
                });
            } else {
                await api('/api/admin/menu/items', {
                    method: 'POST',
                    body
                });
            }

            onSaved();
        } catch (err) {
            setError(err.message || 'Không lưu được món ăn.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="admin-modal-backdrop" onClick={onClose}>
            <section className="admin-item-modal" onClick={(event) => event.stopPropagation()}>
                <header className="admin-modal-head">
                    <h2>{isEdit ? 'Sửa món ăn' : 'Thêm món ăn'}</h2>

                    <button type="button" onClick={onClose}>
                        <X size={18} />
                    </button>
                </header>

                <form className="admin-item-form" onSubmit={submit}>
                    <label>
                        <span>Tên món ăn</span>
                        <input
                            value={form.name}
                            onChange={(event) => setValue('name', event.target.value.slice(0, 50))}
                            placeholder="Tên món ăn"
                            maxLength={50}
                        />
                    </label>

                    <label>
                        <span>Giá</span>
                        <input
                            value={form.price}
                            onChange={(event) => setValue('price', event.target.value)}
                            placeholder="Giá"
                            inputMode="numeric"
                            maxLength={9}
                        />
                    </label>

                    <label>
                        <span>Danh mục</span>
                        <select
                            value={form.categoryId}
                            onChange={(event) => setValue('categoryId', event.target.value)}
                        >
                            <option value="">Chọn danh mục</option>

                            {activeCategories.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.categoryName}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label>
                        <span>Mô tả</span>
                        <textarea
                            value={form.description}
                            onChange={(event) => setValue('description', event.target.value)}
                            placeholder="Mô tả món ăn"
                        />
                    </label>

                    <label>
                        <span>Ảnh món</span>
                        <ImagePicker
                            image={form.image}
                            onImageChange={(image) => setValue('image', image)}
                            onError={setError}
                        />
                    </label>

                    <label className="admin-check-row">
                        <input
                            type="checkbox"
                            checked={form.isAvailable}
                            onChange={(event) => setValue('isAvailable', event.target.checked)}
                        />
                        Còn hàng
                    </label>

                    {error && <div className="admin-form-error">{error}</div>}

                    <button className="admin-submit-btn" type="submit" disabled={saving}>
                        {saving ? 'Đang lưu...' : isEdit ? 'Cập nhật món' : 'Tạo món'}
                    </button>
                </form>
            </section>
        </div>
    );
}

function ComboModal({ open, mode, combo, items, onClose, onSaved }) {
    const [form, setForm] = useState(emptyComboForm());
    const [selectedItemId, setSelectedItemId] = useState('');
    const [selectedQuantity, setSelectedQuantity] = useState('1');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const isEdit = mode === 'edit';
    const availableItems = items.filter((item) => item.isAvailable);

    useEffect(() => {
        if (!open) return;

        if (isEdit && combo) {
            setForm({
                name: combo.name || '',
                price: String(Number(combo.price || 0)),
                description: combo.description || '',
                image: combo.image || '',
                isActive: combo.isActive !== false,
                items: (combo.items || []).map((line) => ({
                    itemId: line.itemId,
                    quantity: line.quantity || 1
                }))
            });
        } else {
            setForm(emptyComboForm());
        }

        setSelectedItemId('');
        setSelectedQuantity('1');
        setError('');
    }, [open, isEdit, combo]);

    if (!open) return null;

    const setValue = (key, value) => {
        setForm((current) => ({
            ...current,
            [key]: key === 'price' ? normalizePrice(value) : value
        }));

        setError('');
    };

    const itemById = (itemId) => {
        return items.find((item) => item.id === itemId);
    };

    const addItemToCombo = () => {
        if (!selectedItemId) {
            setError('Vui lòng chọn món trong combo.');
            return;
        }

        const quantity = Math.max(1, Number(selectedQuantity || 1));

        setForm((current) => {
            const existed = current.items.find((line) => line.itemId === selectedItemId);

            if (existed) {
                return {
                    ...current,
                    items: current.items.map((line) =>
                        line.itemId === selectedItemId
                            ? {
                                ...line,
                                quantity: Number(line.quantity || 1) + quantity
                            }
                            : line
                    )
                };
            }

            return {
                ...current,
                items: [
                    ...current.items,
                    {
                        itemId: selectedItemId,
                        quantity
                    }
                ]
            };
        });

        setSelectedItemId('');
        setSelectedQuantity('1');
        setError('');
    };

    const removeComboItem = (itemId) => {
        setForm((current) => ({
            ...current,
            items: current.items.filter((line) => line.itemId !== itemId)
        }));
    };

    const changeComboItemQuantity = (itemId, quantity) => {
        const cleanQuantity = Math.max(
            1,
            Number(String(quantity || '').replace(/[^\d]/g, '') || 1)
        );

        setForm((current) => ({
            ...current,
            items: current.items.map((line) =>
                line.itemId === itemId
                    ? {
                        ...line,
                        quantity: cleanQuantity
                    }
                    : line
            )
        }));
    };

    const validate = () => {
        const name = form.name.trim();

        if (!name) return 'Vui lòng nhập tên combo.';
        if (name.length > 50) return 'Tên combo tối đa 50 ký tự.';

        const price = Number(form.price || 0);

        if (price <= 0) return 'Vui lòng nhập giá combo.';
        if (price > 999999999) return 'Giá combo tối đa 9 chữ số.';

        if (!form.image) return 'Vui lòng chọn ảnh combo.';
        if (!form.items.length) return 'Vui lòng thêm ít nhất 1 món vào combo.';

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
                name: form.name.trim(),
                price: Number(form.price || 0),
                description: form.description.trim() || null,
                image: form.image,
                isActive: form.isActive,
                items: form.items.map((line) => ({
                    itemId: line.itemId,
                    quantity: Number(line.quantity || 1)
                }))
            };

            if (isEdit) {
                await api(`/api/admin/menu/combos/${combo.id}`, {
                    method: 'PUT',
                    body
                });
            } else {
                await api('/api/admin/menu/combos', {
                    method: 'POST',
                    body
                });
            }

            onSaved();
        } catch (err) {
            setError(err.message || 'Không lưu được combo.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="admin-modal-backdrop" onClick={onClose}>
            <section className="admin-combo-modal" onClick={(event) => event.stopPropagation()}>
                <header className="admin-modal-head">
                    <h2>{isEdit ? 'Sửa combo' : 'Thêm combo'}</h2>

                    <button type="button" onClick={onClose}>
                        <X size={18} />
                    </button>
                </header>

                <form className="admin-combo-form" onSubmit={submit}>
                    <div className="combo-form-columns">
                        <section className="combo-form-card">
                            <label>
                                <span>Tên combo</span>
                                <input
                                    value={form.name}
                                    onChange={(event) => setValue('name', event.target.value.slice(0, 50))}
                                    placeholder="Tên combo"
                                    maxLength={50}
                                />
                            </label>

                            <label>
                                <span>Giá</span>
                                <input
                                    value={form.price}
                                    onChange={(event) => setValue('price', event.target.value)}
                                    placeholder="Giá"
                                    inputMode="numeric"
                                    maxLength={9}
                                />
                            </label>

                            <label>
                                <span>Mô tả</span>
                                <textarea
                                    value={form.description}
                                    onChange={(event) => setValue('description', event.target.value)}
                                    placeholder="Mô tả combo"
                                />
                            </label>

                            <label>
                                <span>Ảnh combo</span>
                                <ImagePicker
                                    image={form.image}
                                    onImageChange={(image) => setValue('image', image)}
                                    onError={setError}
                                />
                            </label>

                            <label className="admin-check-row">
                                <input
                                    type="checkbox"
                                    checked={form.isActive}
                                    onChange={(event) => setValue('isActive', event.target.checked)}
                                />
                                Hoạt động
                            </label>
                        </section>

                        <section className="combo-form-card">
                            <div className="combo-items-head">
                                <h3>Món trong combo</h3>
                                <span>{form.items.length} món đã chọn</span>
                            </div>

                            <label>
                                <span>Chọn món</span>
                                <select
                                    value={selectedItemId}
                                    onChange={(event) => setSelectedItemId(event.target.value)}
                                >
                                    <option value="">Chọn món</option>

                                    {availableItems.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.name} - {money(item.price)}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label>
                                <span>Số lượng</span>
                                <input
                                    value={selectedQuantity}
                                    onChange={(event) =>
                                        setSelectedQuantity(
                                            event.target.value.replace(/[^\d]/g, '').slice(0, 3)
                                        )
                                    }
                                    inputMode="numeric"
                                    placeholder="1"
                                />
                            </label>

                            <button className="combo-add-line-btn" type="button" onClick={addItemToCombo}>
                                Thêm vào danh sách
                            </button>

                            <div className="combo-selected-list">
                                {form.items.length ? (
                                    form.items.map((line) => {
                                        const selectedItem = itemById(line.itemId);

                                        return (
                                            <article key={line.itemId} className="combo-selected-line">
                                                <div>
                                                    <b>{selectedItem?.name || 'Món ăn'}</b>
                                                    <span>{selectedItem ? money(selectedItem.price) : ''}</span>
                                                </div>

                                                <input
                                                    value={line.quantity}
                                                    onChange={(event) =>
                                                        changeComboItemQuantity(line.itemId, event.target.value)
                                                    }
                                                    inputMode="numeric"
                                                />

                                                <button type="button" onClick={() => removeComboItem(line.itemId)}>
                                                    Xóa
                                                </button>
                                            </article>
                                        );
                                    })
                                ) : (
                                    <p>Chưa có món nào</p>
                                )}
                            </div>
                        </section>
                    </div>

                    {error && <div className="admin-form-error">{error}</div>}

                    <button className="admin-submit-btn" type="submit" disabled={saving}>
                        {saving ? 'Đang lưu...' : isEdit ? 'Cập nhật combo' : 'Tạo combo'}
                    </button>
                </form>
            </section>
        </div>
    );
}

function CategoryModal({ open, mode, category, onClose, onSaved }) {
    const [form, setForm] = useState(emptyCategoryForm());
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const isEdit = mode === 'edit';

    useEffect(() => {
        if (!open) return;

        if (isEdit && category) {
            setForm({
                categoryName: category.categoryName || '',
                description: category.description || '',
                sortOrder: String(category.sortOrder || 0),
                isActive: category.isActive !== false
            });
        } else {
            setForm(emptyCategoryForm());
        }

        setError('');
    }, [open, isEdit, category]);

    if (!open) return null;

    const setValue = (key, value) => {
        setForm((current) => ({
            ...current,
            [key]: key === 'sortOrder' ? normalizeSortOrder(value) : value
        }));

        setError('');
    };

    const validate = () => {
        const categoryName = form.categoryName.trim();

        if (!categoryName) return 'Vui lòng nhập tên danh mục.';
        if (categoryName.length > 50) return 'Tên danh mục tối đa 50 ký tự.';

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
                categoryName: form.categoryName.trim(),
                description: form.description.trim() || null,
                image: null,
                sortOrder: Number(form.sortOrder || 0),
                isActive: form.isActive
            };

            if (isEdit) {
                await api(`/api/admin/menu/categories/${category.id}`, {
                    method: 'PUT',
                    body
                });
            } else {
                await api('/api/admin/menu/categories', {
                    method: 'POST',
                    body
                });
            }

            onSaved();
        } catch (err) {
            setError(err.message || 'Không lưu được danh mục.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="admin-modal-backdrop" onClick={onClose}>
            <section className="admin-category-modal" onClick={(event) => event.stopPropagation()}>
                <header className="admin-modal-head">
                    <h2>{isEdit ? 'Sửa danh mục' : 'Thêm danh mục'}</h2>

                    <button type="button" onClick={onClose}>
                        <X size={18} />
                    </button>
                </header>

                <form className="admin-category-form" onSubmit={submit}>
                    <label>
                        <span>Tên danh mục</span>
                        <input
                            value={form.categoryName}
                            onChange={(event) =>
                                setValue('categoryName', event.target.value.slice(0, 50))
                            }
                            placeholder="Tên danh mục"
                            maxLength={50}
                        />
                    </label>

                    <label>
                        <span>Mô tả</span>
                        <textarea
                            value={form.description}
                            onChange={(event) => setValue('description', event.target.value)}
                            placeholder="Mô tả tùy chọn"
                        />
                    </label>

                    <label>
                        <span>Thứ tự sắp xếp</span>
                        <input
                            value={form.sortOrder}
                            onChange={(event) => setValue('sortOrder', event.target.value)}
                            placeholder="0"
                            inputMode="numeric"
                        />
                    </label>

                    <label className="admin-check-row">
                        <input
                            type="checkbox"
                            checked={form.isActive}
                            onChange={(event) => setValue('isActive', event.target.checked)}
                        />
                        Hoạt động
                    </label>

                    {error && <div className="admin-form-error">{error}</div>}

                    <button className="admin-submit-btn" type="submit" disabled={saving}>
                        {saving ? 'Đang lưu...' : isEdit ? 'Cập nhật danh mục' : 'Tạo danh mục'}
                    </button>
                </form>
            </section>
        </div>
    );
}

function DeleteModal({ title, message, onClose, onConfirm, deleting, error }) {
    return (
        <div className="admin-modal-backdrop" onClick={onClose}>
            <section className="admin-delete-modal" onClick={(event) => event.stopPropagation()}>
                <h2>{title}</h2>

                <p>{message}</p>

                {error && <div className="admin-form-error">{error}</div>}

                <div className="admin-delete-actions">
                    <button type="button" onClick={onClose}>
                        Đóng
                    </button>

                    <button type="button" onClick={onConfirm} disabled={deleting}>
                        {deleting ? 'Đang xóa...' : 'Đồng ý'}
                    </button>
                </div>
            </section>
        </div>
    );
}

export default function MenuManagementPage() {
    const [activeTab, setActiveTab] = useState('items');
    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [combos, setCombos] = useState([]);
    const [expandedComboId, setExpandedComboId] = useState('');
    const [modalMode, setModalMode] = useState('');
    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedCombo, setSelectedCombo] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const availableCount = useMemo(() => {
        return items.filter((item) => item.isAvailable).length;
    }, [items]);

    const activeComboCount = useMemo(() => {
        return combos.filter((combo) => combo.isActive).length;
    }, [combos]);

    const activeCategoryCount = useMemo(() => {
        return categories.filter((category) => category.isActive).length;
    }, [categories]);

    const loadData = async () => {
        setLoading(true);
        setMessage('');

        try {
            const [itemsData, categoriesData, combosData] = await Promise.all([
                api('/api/admin/menu/items'),
                api('/api/admin/menu/categories/all'),
                api('/api/admin/menu/combos')
            ]);

            setItems(Array.isArray(itemsData) ? itemsData : []);
            setCategories(Array.isArray(categoriesData) ? categoriesData : []);
            setCombos(Array.isArray(combosData) ? combosData : []);
        } catch (err) {
            setMessage(err.message || 'Hệ thống tải trang không thành công.');
        } finally {
            setLoading(false);
        }
    };

    const openCreate = () => {
        if (activeTab === 'items') {
            setSelectedItem(null);
            setModalMode('create-item');
        }

        if (activeTab === 'combos') {
            setSelectedCombo(null);
            setModalMode('create-combo');
        }

        if (activeTab === 'categories') {
            setSelectedCategory(null);
            setModalMode('create-category');
        }
    };

    const openEditItem = (item) => {
        setSelectedItem(item);
        setModalMode('edit-item');
    };

    const openEditCombo = (combo) => {
        setSelectedCombo(combo);
        setModalMode('edit-combo');
    };

    const openEditCategory = (category) => {
        setSelectedCategory(category);
        setModalMode('edit-category');
    };

    const closeModal = () => {
        setSelectedItem(null);
        setSelectedCombo(null);
        setSelectedCategory(null);
        setModalMode('');
    };

    const handleSaved = () => {
        closeModal();
        setMessage('Thao tác thực đơn thành công.');
        loadData();
    };

    const askDeleteItem = (item) => {
        setDeleteError('');
        setDeleteTarget({
            type: 'item',
            data: item
        });
    };

    const askDeleteCombo = (combo) => {
        setDeleteError('');
        setDeleteTarget({
            type: 'combo',
            data: combo
        });
    };

    const askDeleteCategory = (category) => {
        setDeleteError('');
        setDeleteTarget({
            type: 'category',
            data: category
        });
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;

        setDeleting(true);
        setDeleteError('');

        try {
            if (deleteTarget.type === 'item') {
                await api(`/api/admin/menu/items/${deleteTarget.data.id}`, {
                    method: 'DELETE'
                });
            }

            if (deleteTarget.type === 'combo') {
                await api(`/api/admin/menu/combos/${deleteTarget.data.id}`, {
                    method: 'DELETE'
                });
            }

            if (deleteTarget.type === 'category') {
                await api(`/api/admin/menu/categories/${deleteTarget.data.id}`, {
                    method: 'DELETE'
                });
            }

            setDeleteTarget(null);
            setMessage('Đã xóa/tạm dừng dữ liệu.');
            loadData();
        } catch (err) {
            setDeleteError(err.message || 'Không xóa được dữ liệu.');
        } finally {
            setDeleting(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const activeCreateLabel =
        activeTab === 'items'
            ? 'Thêm món'
            : activeTab === 'combos'
                ? 'Thêm combo'
                : 'Thêm danh mục';

    return (
        <main className="admin-content">
            <section className="admin-page-head">
                <div>
                    <h1>Quản lý Menu</h1>
                    <p>Xem, thêm, sửa, xóa món ăn, combo và danh mục của nhà hàng.</p>
                </div>

                <div className="admin-head-actions">
                    <button className="admin-refresh-btn" type="button" onClick={loadData}>
                        <RefreshCw size={16} />
                        Làm mới
                    </button>

                    <button className="admin-add-btn" type="button" onClick={openCreate}>
                        <Plus size={16} />
                        {activeCreateLabel}
                    </button>
                </div>
            </section>

            <section className="admin-menu-tabs">
                <button
                    type="button"
                    className={activeTab === 'items' ? 'active' : ''}
                    onClick={() => setActiveTab('items')}
                >
                    Món ăn
                </button>

                <button
                    type="button"
                    className={activeTab === 'combos' ? 'active' : ''}
                    onClick={() => setActiveTab('combos')}
                >
                    Combo
                </button>

                <button
                    type="button"
                    className={activeTab === 'categories' ? 'active' : ''}
                    onClick={() => setActiveTab('categories')}
                >
                    Danh mục
                </button>
            </section>

            {activeTab === 'items' && (
                <section className="admin-user-summary">
                    <div>
                        <span>Tổng món ăn</span>
                        <b>{items.length}</b>
                    </div>

                    <div>
                        <span>Còn hàng</span>
                        <b>{availableCount}</b>
                    </div>
                </section>
            )}

            {activeTab === 'combos' && (
                <section className="admin-user-summary">
                    <div>
                        <span>Tổng combo</span>
                        <b>{combos.length}</b>
                    </div>

                    <div>
                        <span>Hoạt động</span>
                        <b>{activeComboCount}</b>
                    </div>
                </section>
            )}

            {activeTab === 'categories' && (
                <section className="admin-user-summary">
                    <div>
                        <span>Tổng danh mục</span>
                        <b>{categories.length}</b>
                    </div>

                    <div>
                        <span>Hoạt động</span>
                        <b>{activeCategoryCount}</b>
                    </div>
                </section>
            )}

            {message && <div className="admin-message">{message}</div>}

            {activeTab === 'items' && (
                <section className="admin-table-card">
                    {loading ? (
                        <div className="admin-empty">
                            <MenuSquare size={38} />
                            <p>Đang tải danh sách món ăn...</p>
                        </div>
                    ) : items.length ? (
                        <table className="admin-menu-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Tên món</th>
                                    <th>Giá</th>
                                    <th>Danh mục</th>
                                    <th>Trạng thái</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>

                            <tbody>
                                {items.map((item, index) => {
                                    const status = itemStatusText(item);

                                    return (
                                        <tr key={item.id}>
                                            <td>{index + 1}</td>

                                            <td>
                                                <div className="admin-menu-name">
                                                    {item.image ? (
                                                        <img src={item.image} alt={item.name} />
                                                    ) : (
                                                        <span className="admin-menu-no-image">
                                                            <MenuSquare size={16} />
                                                        </span>
                                                    )}

                                                    <div>
                                                        <b>{item.name}</b>
                                                        {item.description && <small>{item.description}</small>}
                                                    </div>
                                                </div>
                                            </td>

                                            <td>
                                                <strong className="menu-price">{money(item.price)}</strong>
                                            </td>

                                            <td>{item.categoryName || 'Chưa có'}</td>

                                            <td>
                                                <span className={`menu-status-chip ${status.className}`}>
                                                    {status.label}
                                                </span>
                                            </td>

                                            <td>
                                                <div className="admin-row-actions">
                                                    <button type="button" onClick={() => openEditItem(item)}>
                                                        <Edit3 size={15} />
                                                    </button>

                                                    <button type="button" onClick={() => askDeleteItem(item)}>
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
                            <MenuSquare size={38} />
                            <h3>Chưa có món ăn</h3>
                            <p>Bấm “Thêm món” để tạo món ăn mới.</p>
                        </div>
                    )}
                </section>
            )}

            {activeTab === 'combos' && (
                <section className="admin-table-card">
                    {loading ? (
                        <div className="admin-empty">
                            <MenuSquare size={38} />
                            <p>Đang tải danh sách combo...</p>
                        </div>
                    ) : combos.length ? (
                        <table className="admin-menu-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Tên combo</th>
                                    <th>Giá</th>
                                    <th>Trạng thái</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>

                            <tbody>
                                {combos.map((combo, index) => {
                                    const status = comboStatusText(combo);
                                    const isExpanded = expandedComboId === combo.id;

                                    return (
                                        <Fragment key={combo.id}>
                                            <tr>
                                                <td>{index + 1}</td>

                                                <td>
                                                    <div className="admin-menu-name">
                                                        {combo.image ? (
                                                            <img src={combo.image} alt={combo.name} />
                                                        ) : (
                                                            <span className="admin-menu-no-image">
                                                                <MenuSquare size={16} />
                                                            </span>
                                                        )}

                                                        <div>
                                                            <b>{combo.name}</b>
                                                            {combo.description && <small>{combo.description}</small>}
                                                        </div>
                                                    </div>
                                                </td>

                                                <td>
                                                    <strong className="menu-price">{money(combo.price)}</strong>
                                                </td>

                                                <td>
                                                    <span className={`menu-status-chip ${status.className}`}>
                                                        {status.label}
                                                    </span>
                                                </td>

                                                <td>
                                                    <div className="admin-row-actions">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setExpandedComboId(isExpanded ? '' : combo.id)
                                                            }
                                                        >
                                                            {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                                                        </button>

                                                        <button type="button" onClick={() => openEditCombo(combo)}>
                                                            <Edit3 size={15} />
                                                        </button>

                                                        <button type="button" onClick={() => askDeleteCombo(combo)}>
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>

                                            {isExpanded && (
                                                <tr>
                                                    <td colSpan={5}>
                                                        <section className="combo-detail-box">
                                                            <h3>Các món trong combo</h3>

                                                            {combo.items?.length ? (
                                                                combo.items.map((line) => (
                                                                    <article
                                                                        className="combo-detail-line"
                                                                        key={line.comboItemId}
                                                                    >
                                                                        <div>
                                                                            <b>{line.itemName}</b>
                                                                            <span>{money(line.itemPrice)}</span>
                                                                        </div>

                                                                        <strong>x{line.quantity}</strong>
                                                                    </article>
                                                                ))
                                                            ) : (
                                                                <p>Combo chưa có món.</p>
                                                            )}
                                                        </section>
                                                    </td>
                                                </tr>
                                            )}
                                        </Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    ) : (
                        <div className="admin-empty">
                            <MenuSquare size={38} />
                            <h3>Chưa có combo</h3>
                            <p>Bấm “Thêm combo” để tạo combo mới.</p>
                        </div>
                    )}
                </section>
            )}

            {activeTab === 'categories' && (
                <section className="admin-table-card">
                    {loading ? (
                        <div className="admin-empty">
                            <MenuSquare size={38} />
                            <p>Đang tải danh sách danh mục...</p>
                        </div>
                    ) : categories.length ? (
                        <table className="admin-menu-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Tên danh mục</th>
                                    <th>Số lượng món</th>
                                    <th>Thứ tự</th>
                                    <th>Trạng thái</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>

                            <tbody>
                                {categories.map((category, index) => {
                                    const status = categoryStatusText(category);

                                    return (
                                        <tr key={category.id}>
                                            <td>{index + 1}</td>

                                            <td>
                                                <div>
                                                    <b>{category.categoryName}</b>
                                                    {category.description && <small>{category.description}</small>}
                                                </div>
                                            </td>

                                            <td>{category.itemCount || 0}</td>

                                            <td>{category.sortOrder || 0}</td>

                                            <td>
                                                <span className={`menu-status-chip ${status.className}`}>
                                                    {status.label}
                                                </span>
                                            </td>

                                            <td>
                                                <div className="admin-row-actions">
                                                    <button type="button" onClick={() => openEditCategory(category)}>
                                                        <Edit3 size={15} />
                                                    </button>

                                                    <button type="button" onClick={() => askDeleteCategory(category)}>
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
                            <MenuSquare size={38} />
                            <h3>Chưa có danh mục</h3>
                            <p>Bấm “Thêm danh mục” để tạo danh mục mới.</p>
                        </div>
                    )}
                </section>
            )}

            <ItemModal
                open={modalMode === 'create-item' || modalMode === 'edit-item'}
                mode={modalMode === 'edit-item' ? 'edit' : 'create'}
                item={selectedItem}
                categories={categories}
                onClose={closeModal}
                onSaved={handleSaved}
            />

            <ComboModal
                open={modalMode === 'create-combo' || modalMode === 'edit-combo'}
                mode={modalMode === 'edit-combo' ? 'edit' : 'create'}
                combo={selectedCombo}
                items={items}
                onClose={closeModal}
                onSaved={handleSaved}
            />

            <CategoryModal
                open={modalMode === 'create-category' || modalMode === 'edit-category'}
                mode={modalMode === 'edit-category' ? 'edit' : 'create'}
                category={selectedCategory}
                onClose={closeModal}
                onSaved={handleSaved}
            />

            {deleteTarget && (
                <DeleteModal
                    title={
                        deleteTarget.type === 'combo'
                            ? 'Xác nhận xóa combo'
                            : deleteTarget.type === 'category'
                                ? 'Xác nhận xóa danh mục'
                                : 'Xác nhận xóa món ăn'
                    }
                    message={
                        deleteTarget.type === 'combo'
                            ? `Bạn có chắc muốn xóa combo "${deleteTarget.data.name}" khỏi danh sách không?`
                            : deleteTarget.type === 'category'
                                ? `Bạn có chắc muốn xóa danh mục "${deleteTarget.data.categoryName}" không?`
                                : `Bạn có chắc muốn xóa món "${deleteTarget.data.name}" khỏi danh sách không?`
                    }
                    onClose={() => setDeleteTarget(null)}
                    onConfirm={confirmDelete}
                    deleting={deleting}
                    error={deleteError}
                />
            )}
        </main>
    );
}