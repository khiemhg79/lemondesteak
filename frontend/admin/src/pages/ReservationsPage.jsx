import { useState } from 'react';
import { CalendarCheck, Clock, Users, Phone, CheckCircle } from 'lucide-react';
import './admin-dashboard.css';

export default function ReservationsPage() {
  const reservations = [
    { id: 1, customerName: 'Anh Hoàng Nam', phone: '0988123456', guests: 4, table: 'Bàn 05', time: '19:00 Hôm nay', status: 'CONFIRMED' },
    { id: 2, customerName: 'Chị Mai Phương', phone: '0912345678', guests: 6, table: 'Bàn 12', time: '20:00 Hôm nay', status: 'PENDING' }
  ];

  return (
    <main className="admin-content bright-theme">
      <section className="admin-page-head">
        <div>
          <h1 className="head-title">Quản lý Đặt Bàn Trước (Reservations)</h1>
          <p className="head-sub">Theo dõi lịch hẹn đặt bàn của khách hàng trước khi đến nhà hàng.</p>
        </div>
      </section>

      <article className="dash-card">
        <div className="financial-table-wrapper">
          <table className="financial-table">
            <thead>
              <tr>
                <th>Tên Khách Hàng</th>
                <th>Số Điện Thoại</th>
                <th>Số Khách</th>
                <th>Vị Trí Bàn</th>
                <th>Thời Gian Hẹn</th>
                <th>Trạng Thái</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((r) => (
                <tr key={r.id}>
                  <td><strong>{r.customerName}</strong></td>
                  <td>{r.phone}</td>
                  <td>{r.guests} người</td>
                  <td><span className="table-badge">{r.table}</span></td>
                  <td>{r.time}</td>
                  <td>
                    {r.status === 'CONFIRMED' ? (
                      <span className="status-chip success">Đã xác nhận</span>
                    ) : (
                      <span className="status-chip warning">Chờ xác nhận</span>
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
