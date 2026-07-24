import { BarChart3, RefreshCw, TrendingUp } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api.js';
import './admin-dashboard.css';

function money(value) {
    return new Intl.NumberFormat('vi-VN').format(Number(value || 0)) + 'đ';
}

function million(value) {
    return Math.round(Number(value || 0) / 1000000);
}

function percent(value) {
    return `${Number(value || 0).toFixed(1)}%`;
}

function LineChart({ data }) {
    const width = 420;
    const height = 190;
    const padding = 28;

    const maxValue = Math.max(...data.map((item) => Number(item.revenue || 0)), 1);
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const points = data.map((item, index) => {
        const x = padding + (chartWidth / Math.max(data.length - 1, 1)) * index;
        const y = padding + chartHeight - (Number(item.revenue || 0) / maxValue) * chartHeight;

        return `${x},${y}`;
    });

    return (
        <div className="report-chart-body">
            <svg viewBox={`0 0 ${width} ${height}`} className="line-chart">
                <line x1={padding} y1={padding} x2={padding} y2={height - padding} />
                <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} />

                <polyline points={points.join(' ')} />

                {data.map((item, index) => {
                    const x = padding + (chartWidth / Math.max(data.length - 1, 1)) * index;
                    const y = padding + chartHeight - (Number(item.revenue || 0) / maxValue) * chartHeight;

                    return (
                        <g key={item.month}>
                            <circle cx={x} cy={y} r="4" />
                            <text x={x} y={height - 6} textAnchor="middle">
                                {item.month}
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}

function TopSellingChart({ data }) {
    const maxValue = Math.max(...data.map((item) => Number(item.quantity || 0)), 1);

    return (
        <div className="bar-chart-list">
            {data.length ? (
                data.map((item) => (
                    <div className="bar-chart-row" key={item.name}>
                        <span>{item.name}</span>

                        <div className="bar-track">
                            <div
                                className="bar-fill"
                                style={{
                                    width: `${Math.max(8, (Number(item.quantity || 0) / maxValue) * 100)}%`
                                }}
                            />
                        </div>

                        <b>{item.quantity}</b>
                    </div>
                ))
            ) : (
                <p className="chart-empty">Chưa có dữ liệu món bán chạy.</p>
            )}
        </div>
    );
}

function ComboPieChart({ comboRatio }) {
    const comboPercent = Number(comboRatio?.comboPercent || 0);
    const itemPercent = Number(comboRatio?.itemPercent || 0);

    return (
        <div className="pie-chart-wrap">
            <div
                className="pie-chart"
                style={{
                    background: `conic-gradient(#60a5fa 0 ${comboPercent}%, #a78bfa ${comboPercent}% 100%)`
                }}
            >
                <div>
                    <b>{percent(comboPercent)}</b>
                    <span>Combo</span>
                </div>
            </div>

            <div className="pie-legend">
                <span>
                    <i className="combo-color" />
                    Combo: {percent(comboPercent)}
                </span>

                <span>
                    <i className="item-color" />
                    Lẻ: {percent(itemPercent)}
                </span>
            </div>
        </div>
    );
}

function RevenueOrderChart({ data }) {
    const maxRevenue = Math.max(...data.map((item) => million(item.revenue)), 1);
    const maxOrders = Math.max(...data.map((item) => Number(item.orderCount || 0)), 1);

    return (
        <div className="dual-bar-chart">
            {data.map((item) => (
                <div className="dual-bar-group" key={item.month}>
                    <div className="dual-bars">
                        <div
                            className="dual-bar revenue"
                            style={{
                                height: `${Math.max(8, (million(item.revenue) / maxRevenue) * 140)}px`
                            }}
                            title={`Doanh thu: ${money(item.revenue)}`}
                        />

                        <div
                            className="dual-bar orders"
                            style={{
                                height: `${Math.max(8, (Number(item.orderCount || 0) / maxOrders) * 140)}px`
                            }}
                            title={`Số đơn: ${item.orderCount}`}
                        />
                    </div>

                    <span>{item.month}</span>
                </div>
            ))}
        </div>
    );
}

export default function DashboardPage() {
    const [report, setReport] = useState({
        summary: {
            totalRevenue: 0,
            totalOrders: 0,
            avgOrderValue: 0,
            monthOverMonthPercent: 0
        },
        monthlyRevenue: [],
        topSellingItems: [],
        comboRatio: {
            comboQuantity: 0,
            itemQuantity: 0,
            comboPercent: 0,
            itemPercent: 0
        },
        revenueAndOrders: []
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const summaryCards = useMemo(() => {
        return [
            {
                label: 'Tổng doanh thu',
                value: money(report.summary.totalRevenue)
            },
            {
                label: 'Số đơn',
                value: report.summary.totalOrders || 0
            },
            {
                label: 'Giá trị đơn TB',
                value: money(report.summary.avgOrderValue)
            },
            {
                label: 'MoM',
                value: percent(report.summary.monthOverMonthPercent)
            }
        ];
    }, [report]);

    const loadReport = async () => {
        setLoading(true);
        setMessage('');

        try {
            const data = await api('/api/admin/reports/overview');

            setReport({
                summary: data.summary || report.summary,
                monthlyRevenue: Array.isArray(data.monthlyRevenue) ? data.monthlyRevenue : [],
                topSellingItems: Array.isArray(data.topSellingItems) ? data.topSellingItems : [],
                comboRatio: data.comboRatio || report.comboRatio,
                revenueAndOrders: Array.isArray(data.revenueAndOrders) ? data.revenueAndOrders : []
            });
        } catch (err) {
            setMessage(err.message || 'Lỗi tải dữ liệu, không thể tạo báo cáo.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReport();
    }, []);

    return (
        <main className="admin-content">
            <section className="admin-page-head">
                <div>
                    <h1>Tổng quan kinh doanh</h1>
                    <p>Xem doanh thu, số đơn, tỷ lệ combo và món bán chạy.</p>
                </div>

                <div className="admin-head-actions">
                    <button className="admin-refresh-btn" type="button" onClick={loadReport}>
                        <RefreshCw size={16} />
                        {loading ? 'Đang tải...' : 'Làm mới dữ liệu'}
                    </button>
                </div>
            </section>

            {message && <div className="admin-message">{message}</div>}

            <section className="report-summary-grid">
                {summaryCards.map((card) => (
                    <article className="report-summary-card" key={card.label}>
                        <span>{card.label}</span>
                        <b>{card.value}</b>
                    </article>
                ))}
            </section>

            <section className="report-grid">
                <article className="report-card">
                    <header>
                        <div>
                            <h2>Doanh thu theo tháng</h2>
                            <p>Đơn vị: VND</p>
                        </div>

                        <TrendingUp size={20} />
                    </header>

                    <LineChart data={report.monthlyRevenue} />
                </article>

                <article className="report-card">
                    <header>
                        <div>
                            <h2>Món bán chạy</h2>
                            <p>Số lượng bán ra cao nhất</p>
                        </div>

                        <BarChart3 size={20} />
                    </header>

                    <TopSellingChart data={report.topSellingItems} />
                </article>

                <article className="report-card">
                    <header>
                        <div>
                            <h2>Tỷ lệ combo (%)</h2>
                            <p>So sánh combo và món lẻ</p>
                        </div>
                    </header>

                    <ComboPieChart comboRatio={report.comboRatio} />
                </article>

                <article className="report-card">
                    <header>
                        <div>
                            <h2>Doanh thu và số đơn</h2>
                            <p>So sánh theo tháng</p>
                        </div>
                    </header>

                    <RevenueOrderChart data={report.revenueAndOrders} />

                    <div className="dual-legend">
                        <span>
                            <i className="revenue-dot" />
                            Doanh thu
                        </span>

                        <span>
                            <i className="order-dot" />
                            Số đơn
                        </span>
                    </div>
                </article>
            </section>
        </main>
    );
}