import { useState } from 'react';
import { CookingPot, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import './admin-dashboard.css';

export default function KitchenPage() {
  const kitchenItems = [
    { id: 1, table: '03', name: 'Bít Tết Bò Mỹ Sốt Tiêu', note: 'Chín vừa (Medium)', waitTime: '24 phút', overdue: true },
    { id: 2, table: '08', name: 'Mỳ Ý Sốt Kem Bò Băm', note: 'Không hành', waitTime: '8 phút', overdue: false },
    { id: 3, table: '05', name: 'Combo Gia Đình Le Monde', note: 'Mang sốt thêm', waitTime: '12 phút', overdue: false }
  ];

  return (
    <main className="admin-content bright-theme">
      <section className="admin-page-head">
        <div>
          <h1 className="head-title">Màn hình Theo dõi Nhà Bếp (Kitchen Display)</h1>
          <p className="head-sub">Giám sát tiến độ chế biến món ăn và cảnh báo các món chờ quá lâu.</p>
        </div>
      </section>

      <section className="dashboard-grid-two">
        {kitchenItems.map((item) => (
          <article key={item.id} className={`dash-card ${item.overdue ? 'border-red' : ''}`}>
            <header className="dash-card-header">
              <div>
                <h3><CookingPot size={18} /> Bàn {item.table} - {item.name}</h3>
                <p className="card-sub">Ghi chú: {item.note}</p>
              </div>
              <span className={`status-chip ${item.overdue ? 'danger' : 'warning'}`}>
                <Clock size={14} /> Chờ {item.waitTime}
              </span>
            </header>

            {item.overdue && (
              <div className="urgent-item red" style={{ marginTop: 12 }}>
                <AlertTriangle size={16} /> <strong>Cảnh báo:</strong> Món ăn đã vượt quá hạn chế biến 15 phút!
              </div>
            )}
          </article>
        ))}
      </section>
    </main>
  );
}
