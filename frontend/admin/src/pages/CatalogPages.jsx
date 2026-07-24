import FormField from '../components/FormField.jsx';
import { money } from '../utils/format.js';

export function CrudLayout({ title, form, table }) {
  return <div className="grid cols-2"><div className="card"><h2>{title}</h2><div className="form">{form}</div></div><div className="card"><h2>Danh sách</h2>{table}</div></div>;
}

export function ItemsPage({ items, categories, form, setForm, save, remove }) {
  return <CrudLayout title="Món ăn" form={<>
    <FormField label="Tên món"><input className="input" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} /></FormField>
    <FormField label="Giá"><input className="input" type="number" value={form.price || 0} onChange={(e) => setForm({ ...form, price: e.target.value })} /></FormField>
    <FormField label="Danh mục"><select className="select" value={form.categoryId || ''} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}><option value="">Chọn danh mục</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.categoryName}</option>)}</select></FormField>
    <FormField label="Ảnh"><input className="input" value={form.image || ''} onChange={(e) => setForm({ ...form, image: e.target.value })} /></FormField>
    <FormField label="Mô tả"><textarea className="textarea" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} /></FormField>
    <button className="btn" onClick={save}>{form.id ? 'Cập nhật' : 'Thêm món'}</button>
  </>} table={<table className="table"><thead><tr><th>Tên</th><th>Giá</th><th></th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td>{item.name}</td><td>{money(item.price)}</td><td><button className="btn small secondary" onClick={() => setForm({ ...form, ...item })}>Sửa</button> <button className="btn small dark" onClick={() => remove(item.id)}>Ẩn</button></td></tr>)}</tbody></table>} />;
}

export function CategoriesPage({ categories, form, setForm, save, remove }) {
  return <CrudLayout title="Danh mục" form={<>
    <FormField label="Tên danh mục"><input className="input" value={form.categoryName || ''} onChange={(e) => setForm({ ...form, categoryName: e.target.value })} /></FormField>
    <FormField label="Ảnh"><input className="input" value={form.image || ''} onChange={(e) => setForm({ ...form, image: e.target.value })} /></FormField>
    <FormField label="Mô tả"><textarea className="textarea" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} /></FormField>
    <button className="btn" onClick={save}>{form.id ? 'Cập nhật' : 'Thêm danh mục'}</button>
  </>} table={<table className="table"><thead><tr><th>Tên</th><th>Mô tả</th><th></th></tr></thead><tbody>{categories.map((category) => <tr key={category.id}><td>{category.categoryName}</td><td>{category.description}</td><td><button className="btn small secondary" onClick={() => setForm({ ...form, ...category })}>Sửa</button> <button className="btn small dark" onClick={() => remove(category.id)}>Ẩn</button></td></tr>)}</tbody></table>} />;
}

export function CombosPage({ combos, form, setForm, save, remove }) {
  return <CrudLayout title="Combo" form={<>
    <FormField label="Tên combo"><input className="input" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} /></FormField>
    <FormField label="Giá"><input className="input" type="number" value={form.price || 0} onChange={(e) => setForm({ ...form, price: e.target.value })} /></FormField>
    <FormField label="Ảnh"><input className="input" value={form.image || ''} onChange={(e) => setForm({ ...form, image: e.target.value })} /></FormField>
    <FormField label="Mô tả"><textarea className="textarea" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} /></FormField>
    <button className="btn" onClick={save}>{form.id ? 'Cập nhật' : 'Thêm combo'}</button>
  </>} table={<table className="table"><thead><tr><th>Tên</th><th>Giá</th><th></th></tr></thead><tbody>{combos.map((combo) => <tr key={combo.id}><td>{combo.name}</td><td>{money(combo.price)}</td><td><button className="btn small secondary" onClick={() => setForm({ ...form, ...combo })}>Sửa</button> <button className="btn small dark" onClick={() => remove(combo.id)}>Ẩn</button></td></tr>)}</tbody></table>} />;
}

export function PromotionsPage({ promos, form, setForm, save, remove }) {
  return <CrudLayout title="Khuyến mãi" form={<>
    <FormField label="Tên"><input className="input" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} /></FormField>
    <FormField label="Loại"><select className="select" value={form.type || 'PERCENT'} onChange={(e) => setForm({ ...form, type: e.target.value })}><option>PERCENT</option><option>FIXED</option></select></FormField>
    <FormField label="Giá trị"><input className="input" type="number" value={form.value || 0} onChange={(e) => setForm({ ...form, value: e.target.value })} /></FormField>
    <FormField label="Đơn tối thiểu"><input className="input" type="number" value={form.minOrderAmount || 0} onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })} /></FormField>
    <FormField label="Số lượt"><input className="input" type="number" value={form.usageLimit || ''} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} /></FormField>
    <button className="btn" onClick={save}>{form.id ? 'Cập nhật' : 'Thêm khuyến mãi'}</button>
  </>} table={<table className="table"><thead><tr><th>Tên</th><th>Loại</th><th>Lượt</th><th></th></tr></thead><tbody>{promos.map((promo) => <tr key={promo.id}><td>{promo.name}</td><td>{promo.type} {promo.value}</td><td>{promo.usedCount}/{promo.usageLimit || '∞'}</td><td><button className="btn small secondary" onClick={() => setForm({ ...form, ...promo })}>Sửa</button> <button className="btn small dark" onClick={() => remove(promo.id)}>Ẩn</button></td></tr>)}</tbody></table>} />;
}
