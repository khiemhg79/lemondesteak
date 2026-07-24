import { BarChart3, Tags, Utensils, Users } from 'lucide-react';
import { money } from '../utils/format.js';

function Stat({ Icon, label, value }) {
  return <div className="stat"><Icon size={22} /><span>{label}</span><b>{value}</b></div>;
}

export default function ReportsPage({ report }) {
  if (!report) return <p>Đang tải...</p>;

  return (
    <div className="grid cols-4">
      <Stat Icon={Users} label="Người dùng" value={report.users} />
      <Stat Icon={Utensils} label="Món ăn" value={report.items} />
      <Stat Icon={BarChart3} label="Đơn hàng" value={report.orders} />
      <Stat Icon={BarChart3} label="Doanh thu" value={money(report.totalRevenue)} />
      <Stat Icon={Tags} label="Bàn" value={report.tables} />
      <Stat Icon={Tags} label="Danh mục" value={report.categories} />
      <Stat Icon={Tags} label="Combo" value={report.combos} />
      <Stat Icon={Tags} label="Khuyến mãi" value={report.promotions} />
    </div>
  );
}
