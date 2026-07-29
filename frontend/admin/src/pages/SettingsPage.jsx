import { useState } from 'react';
import { Building, CreditCard, Save, Percent, Phone, MapPin, CheckCircle, ShieldCheck } from 'lucide-react';
import './admin-dashboard.css';

export default function SettingsPage() {
  const [form, setForm] = useState({
    storeName: 'LeMonde Steak - French Steakhouse',
    address: '88 Phố Huế, Hai Bà Trưng, Hà Nội',
    phone: '1900 633 640',
    vatRate: 8,
    bankName: 'TP Bank - Ngân Hàng Tiên Phong',
    bankAccount: '113366668888',
    accountName: 'NHAHANG LEMONDE STEAK',
    autoPrintInvoice: true
  });

  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <main className="admin-content bright-theme">
      {/* Header Bar */}
      <section className="admin-page-head">
        <div>
          <h1 className="head-title">Cài đặt Hệ thống & Nhà hàng</h1>
          <p className="head-sub">Cấu hình thông tin thương hiệu, thuế VAT, thời gian và tài khoản thanh toán VietQR.</p>
        </div>

        <div className="admin-head-actions">
          <button type="button" className="admin-add-btn" onClick={handleSave}>
            {saved ? (
              <>
                <CheckCircle size={16} /> Đã Lưu Thành Công!
              </>
            ) : (
              <>
                <Save size={16} /> Lưu Thay Đổi Cấu Hình
              </>
            )}
          </button>
        </div>
      </section>

      <form onSubmit={handleSave} className="fade-in">
        {/* 2-Column Responsive Settings Layout */}
        <div className="settings-grid">
          {/* Column 1: Restaurant Info */}
          <article className="settings-card">
            <header className="settings-card-head">
              <div className="icon-badge">
                <Building size={20} />
              </div>
              <div>
                <h3>Thông tin Thương hiệu & Nhà hàng</h3>
                <small style={{ color: '#64748b' }}>Thông tin hiển thị trên hóa đơn và trang đặt món của khách</small>
              </div>
            </header>

            <div className="settings-form-group">
              <div className="settings-field">
                <label>Tên Nhà Hàng / Thương Hiệu</label>
                <input
                  type="text"
                  value={form.storeName}
                  onChange={(e) => setForm({ ...form, storeName: e.target.value })}
                  placeholder="VD: LeMonde Steak"
                />
              </div>

              <div className="settings-field">
                <label>Địa chỉ Chi nhánh Trụ sở</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Nhập địa chỉ nhà hàng..."
                />
              </div>

              <div className="settings-row-2">
                <div className="settings-field">
                  <label>Hotline Hỗ Trợ</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="1900 xxxx"
                  />
                </div>

                <div className="settings-field">
                  <label>Thuế VAT (%)</label>
                  <input
                    type="number"
                    value={form.vatRate}
                    onChange={(e) => setForm({ ...form, vatRate: Number(e.target.value) })}
                    placeholder="8"
                  />
                </div>
              </div>
            </div>
          </article>

          {/* Column 2: VietQR & Payment Config */}
          <article className="settings-card">
            <header className="settings-card-head">
              <div className="icon-badge" style={{ background: '#eff6ff', color: '#2563eb' }}>
                <CreditCard size={20} />
              </div>
              <div>
                <h3>Cấu hình Thanh toán VietQR</h3>
                <small style={{ color: '#64748b' }}>Tạo mã QR thanh toán tự động khớp tiền từng hóa đơn</small>
              </div>
            </header>

            <div className="settings-form-group">
              <div className="settings-field">
                <label>Ngân hàng Nhận Tiền VietQR</label>
                <select
                  value={form.bankName}
                  onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                >
                  <option value="TP Bank - Ngân Hàng Tiên Phong">TP Bank - Ngân Hàng Tiên Phong</option>
                  <option value="MB Bank - Ngân Hàng Quân Đội">MB Bank - Ngân Hàng Quân Đội</option>

                  <option value="VietinBank - Ngân hàng Công Thương">VietinBank - Ngân hàng Công Thương</option>
                  <option value="Vietcombank - Ngân hàng Ngoại Thương">Vietcombank - Ngân hàng Ngoại Thương</option>
                  <option value="Techcombank - Ngân hàng Kỹ Thương">Techcombank - Ngân hàng Kỹ Thương</option>
                </select>
              </div>

              <div className="settings-field">
                <label>Số Tài Khoản Ngân Hàng</label>
                <input
                  type="text"
                  value={form.bankAccount}
                  onChange={(e) => setForm({ ...form, bankAccount: e.target.value })}
                  placeholder="Nhập số tài khoản..."
                />
              </div>

              <div className="settings-field">
                <label>Tên Chủ Tài Khoản (Viết hoa không dấu)</label>
                <input
                  type="text"
                  value={form.accountName}
                  onChange={(e) => setForm({ ...form, accountName: e.target.value })}
                  placeholder="NHAHANG LEMONDE STEAK"
                />
              </div>
            </div>
          </article>
        </div>

        {/* Submit Action Container */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 10 }}>
          <button type="submit" className="admin-add-btn" style={{ padding: '12px 32px', fontSize: 15 }}>
            {saved ? (
              <>
                <CheckCircle size={18} /> Đã Lưu Cấu Hình Hệ Thống!
              </>
            ) : (
              <>
                <Save size={18} /> Lưu Thay Đổi Cấu Hình
              </>
            )}
          </button>
        </div>
      </form>
    </main>
  );
}
