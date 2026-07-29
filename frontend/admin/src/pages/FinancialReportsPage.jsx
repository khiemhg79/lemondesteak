import { useState, useMemo } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Calendar,
  CheckCircle,
  Download,
  FileSpreadsheet,
  Filter,
  PieChart,
  Printer,
  RefreshCw,
  Search,
  TrendingUp
} from 'lucide-react';
import './admin-dashboard.css';

function money(value) {
  return new Intl.NumberFormat('vi-VN').format(Math.round(Number(value || 0))) + ' ₫';
}

export default function FinancialReportsPage() {
  const [reportPeriod, setReportPeriod] = useState('this_month');
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Financial P&L summary data calculated dynamically based on reportPeriod
  const financialData = useMemo(() => {
    if (reportPeriod === 'last_month') {
      return {
        totalRevenue: 292000000,
        costOfGoodsSold: 116800000,
        grossProfit: 175200000,
        operatingExpenses: 48000000,
        netProfit: 127200000,
        totalOrders: 590,
        avgOrderValue: 494915,
        growthRate: '+14.2%',
        categories: [
          { name: 'Bít Tết (Steak)', revenue: 140000000, percent: 48, count: 360 },
          { name: 'Combo Đặc Biệt', revenue: 81760000, percent: 28, count: 150 },
          { name: 'Món Ăn Kèm & Mỳ Ý', revenue: 37960000, percent: 13, count: 260 },
          { name: 'Đồ Uống & Rượu Vang', revenue: 32280000, percent: 11, count: 180 }
        ],
        dailyStatements: [
          { date: '30/06/2026', orders: 22, revenue: 11000000, cogs: 4400000, profit: 6600000, margin: '60.0%' },
          { date: '29/06/2026', orders: 20, revenue: 9800000, cogs: 3920000, profit: 5880000, margin: '60.0%' },
          { date: '28/06/2026', orders: 21, revenue: 10200000, cogs: 4080000, profit: 6120000, margin: '60.0%' },
          { date: '27/06/2026', orders: 19, revenue: 9400000, cogs: 3760000, profit: 5640000, margin: '60.0%' },
          { date: '26/06/2026', orders: 18, revenue: 8900000, cogs: 3560000, profit: 5340000, margin: '60.0%' }
        ]
      };
    }

    if (reportPeriod === 'quarter') {
      return {
        totalRevenue: 890500000,
        costOfGoodsSold: 356200000,
        grossProfit: 534300000,
        operatingExpenses: 145000000,
        netProfit: 389300000,
        totalOrders: 1750,
        avgOrderValue: 508857,
        growthRate: '+32.8%',
        categories: [
          { name: 'Bít Tết (Steak)', revenue: 427440000, percent: 48, count: 1080 },
          { name: 'Combo Đặc Biệt', revenue: 249340000, percent: 28, count: 450 },
          { name: 'Món Ăn Kèm & Mỳ Ý', revenue: 115765000, percent: 13, count: 780 },
          { name: 'Đồ Uống & Rượu Vang', revenue: 97955000, percent: 11, count: 540 }
        ],
        dailyStatements: [
          { date: 'Tổng Tháng 7', orders: 680, revenue: 345800000, cogs: 138320000, profit: 207480000, margin: '60.0%' },
          { date: 'Tổng Tháng 6', orders: 590, revenue: 292000000, cogs: 116800000, profit: 175200000, margin: '60.0%' },
          { date: 'Tổng Tháng 5', orders: 480, revenue: 252700000, cogs: 101080000, profit: 151620000, margin: '60.0%' }
        ]
      };
    }

    // Default 'this_month'
    return {
      totalRevenue: 345800000,
      costOfGoodsSold: 138320000,
      grossProfit: 207480000,
      operatingExpenses: 52000000,
      netProfit: 155480000,
      totalOrders: 680,
      avgOrderValue: 508530,
      growthRate: '+18.4%',
      categories: [
        { name: 'Bít Tết (Steak)', revenue: 165800000, percent: 48, count: 420 },
        { name: 'Combo Đặc Biệt', revenue: 98500000, percent: 28, count: 180 },
        { name: 'Món Ăn Kèm & Mỳ Ý', revenue: 45000000, percent: 13, count: 310 },
        { name: 'Đồ Uống & Rượu Vang', revenue: 36500000, percent: 11, count: 210 }
      ],
      dailyStatements: [
        { date: '29/07/2026', orders: 25, revenue: 12850000, cogs: 5140000, profit: 7710000, margin: '60.0%' },
        { date: '28/07/2026', orders: 23, revenue: 11250000, cogs: 4500000, profit: 6750000, margin: '60.0%' },
        { date: '27/07/2026', orders: 24, revenue: 11800000, cogs: 4720000, profit: 7080000, margin: '60.0%' },
        { date: '26/07/2026', orders: 22, revenue: 10500000, cogs: 4200000, profit: 6300000, margin: '60.0%' },
        { date: '25/07/2026', orders: 20, revenue: 9200000, cogs: 3680000, profit: 5520000, margin: '60.0%' }
      ]
    };
  }, [reportPeriod]);

  const handleExportCSV = () => {
    setDownloading(true);
    setDownloadSuccess(false);

    setTimeout(() => {
      // Simulate file download
      const csvContent =
        'data:text/csv;charset=utf-8,' +
        'Ngay,SoDon,DoanhThu,GiaVon,LoiNhuanGop,TyLe\n' +
        financialData.dailyStatements
          .map((s) => `${s.date},${s.orders},${s.revenue},${s.cogs},${s.profit},${s.margin}`)
          .join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Bao_Cao_Tai_Chinh_LeMondeSteak_${reportPeriod}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloading(false);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    }, 800);
  };

  return (
    <main className="admin-content bright-theme">
      {/* Header Bar */}
      <section className="admin-page-head">
        <div>
          <h1 className="head-title">Báo cáo Tài chính & Doanh thu</h1>
          <p className="head-sub">Theo dõi chi tiết báo cáo P&L, lợi nhuận gộp và xuất báo cáo kế toán.</p>
        </div>

        <div className="admin-head-actions">
          <button className="admin-refresh-btn bright" onClick={handleExportCSV} disabled={downloading}>
            {downloadSuccess ? (
              <>
                <CheckCircle size={16} color="#16a34a" /> Đã xuất Excel!
              </>
            ) : (
              <>
                <Download size={16} /> {downloading ? 'Đang tạo CSV...' : 'Xuất File Excel / CSV'}
              </>
            )}
          </button>
        </div>
      </section>

      {/* Report Period Filter */}
      <section className="time-filter-bar">
        <div className="filter-label">
          <Calendar size={16} /> Kỳ báo cáo:
        </div>

        <div className="filter-tabs">
          <button
            type="button"
            className={`filter-btn ${reportPeriod === 'this_month' ? 'active' : ''}`}
            onClick={() => setReportPeriod('this_month')}
          >
            Tháng này
          </button>
          <button
            type="button"
            className={`filter-btn ${reportPeriod === 'last_month' ? 'active' : ''}`}
            onClick={() => setReportPeriod('last_month')}
          >
            Tháng trước
          </button>
          <button
            type="button"
            className={`filter-btn ${reportPeriod === 'quarter' ? 'active' : ''}`}
            onClick={() => setReportPeriod('quarter')}
          >
            Quý này
          </button>
        </div>
      </section>

      {/* P&L Financial Cards Summary */}
      <section className="dashboard-stats-grid">
        <article className="stat-card primary">
          <span className="stat-label">Tổng Doanh Thu</span>
          <h2 className="stat-main-value">{money(financialData.totalRevenue)}</h2>
          <div className="stat-comparison">
            <span className="growth-up"><ArrowUpRight size={16} /> +18.4%</span>
            <small>So với kỳ trước</small>
          </div>
        </article>

        <article className="stat-card">
          <span className="stat-label">Giá Vốn Bán Hàng (COGS)</span>
          <h2 className="stat-main-value text-red">{money(financialData.costOfGoodsSold)}</h2>
          <div className="stat-comparison">
            <span className="growth-neutral">40% Doanh thu</span>
            <small>Chi phí nguyên liệu thực phẩm</small>
          </div>
        </article>

        <article className="stat-card">
          <span className="stat-label">Lợi Nhuận Gộp (Gross Profit)</span>
          <h2 className="stat-main-value text-green">{money(financialData.grossProfit)}</h2>
          <div className="stat-comparison">
            <span className="growth-up">Biên lợi nhuận 60%</span>
            <small>Chưa trừ CP vận hành</small>
          </div>
        </article>

        <article className="stat-card">
          <span className="stat-label">Lợi Nhuận Ròng (Net Profit)</span>
          <h2 className="stat-main-value text-purple">{money(financialData.netProfit)}</h2>
          <div className="stat-comparison">
            <span className="growth-up">Biên ròng 45%</span>
            <small>Lợi nhuận thực nhận</small>
          </div>
        </article>
      </section>

      {/* Category Breakdown & Daily Statements Grid */}
      <section className="dashboard-grid-two">
        {/* Category Breakdown */}
        <article className="dash-card">
          <header className="dash-card-header">
            <h3><PieChart size={18} /> Cơ Cấu Doanh Thu Theo Danh Mục</h3>
          </header>

          <div className="payment-breakdown-list">
            {financialData.categories.map((cat) => (
              <div key={cat.name} className="payment-row">
                <div className="payment-row-info">
                  <span className="pm-name"><strong>{cat.name}</strong> ({cat.count} đơn)</span>
                  <strong className="pm-amount">{money(cat.revenue)}</strong>
                </div>
                <div className="pm-bar-track">
                  <div className="pm-bar-fill" style={{ width: `${cat.percent}%`, background: '#e63917' }} />
                </div>
                <span className="pm-percent">{cat.percent}%</span>
              </div>
            ))}
          </div>
        </article>

        {/* Daily Financial Statements Table */}
        <article className="dash-card">
          <header className="dash-card-header">
            <h3><FileSpreadsheet size={18} /> Nhật Ký Doanh Thu & Lợi Nhuận Theo Ngày</h3>
          </header>

          <div className="financial-table-wrapper">
            <table className="financial-table">
              <thead>
                <tr>
                  <th>Ngày</th>
                  <th>Số đơn</th>
                  <th>Doanh thu</th>
                  <th>Giá vốn</th>
                  <th>Lợi nhuận</th>
                </tr>
              </thead>
              <tbody>
                {financialData.dailyStatements.map((row) => (
                  <tr key={row.date}>
                    <td><strong>{row.date}</strong></td>
                    <td>{row.orders} đơn</td>
                    <td className="text-bold">{money(row.revenue)}</td>
                    <td className="text-red">{money(row.cogs)}</td>
                    <td className="text-green text-bold">{money(row.profit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </main>
  );
}
