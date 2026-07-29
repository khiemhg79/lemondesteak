import { useState } from 'react';
import { Boxes, AlertTriangle, CheckCircle, Plus } from 'lucide-react';
import './admin-dashboard.css';

export default function InventoryPage() {
  const stockItems = [
    { id: 1, name: 'Thịt thăn bò Mỹ Ribeye', category: 'Thực phẩm tươi', quantity: '4.5 kg', minLimit: '10.0 kg', status: 'LOW' },
    { id: 2, name: 'Khoai tây đông lạnh Mccain', category: 'Đồ đông lạnh', quantity: '25.0 kg', minLimit: '15.0 kg', status: 'OK' },
    { id: 3, name: 'Sốt tiêu đen Le Monde', category: 'Gia vị & Sốt', quantity: '12.0 lít', minLimit: '5.0 lít', status: 'OK' },
    { id: 4, name: 'Rượu vang đỏ Bordeaux', category: 'Đồ uống', quantity: '18 chai', minLimit: '10 chai', status: 'OK' }
  ];

  return (
    <main className="admin-content bright-theme">
      <section className="admin-page-head">
        <div>
          <h1 className="head-title">Quản lý Kho & Định mức Nguyên liệu</h1>
          <p className="head-sub">Theo dõi tồn kho thực phẩm, cảnh báo nguyên liệu dưới định mức tối thiểu.</p>
        </div>
      </section>

      <article className="dash-card">
        <div className="financial-table-wrapper">
          <table className="financial-table">
            <thead>
              <tr>
                <th>Mặt Hàng</th>
                <th>Phân Loại</th>
                <th>Tồn Kho Hiện Tại</th>
                <th>Định Mức Tối Thiểu</th>
                <th>Trạng Thái</th>
              </tr>
            </thead>
            <tbody>
              {stockItems.map((item) => (
                <tr key={item.id}>
                  <td><strong>{item.name}</strong></td>
                  <td>{item.category}</td>
                  <td className="text-bold">{item.quantity}</td>
                  <td>{item.minLimit}</td>
                  <td>
                    {item.status === 'LOW' ? (
                      <span className="status-chip danger">
                        <AlertTriangle size={14} /> Dưới định mức (Cần nhập)
                      </span>
                    ) : (
                      <span className="status-chip success">
                        <CheckCircle size={14} /> An toàn
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </main>
  );
}
