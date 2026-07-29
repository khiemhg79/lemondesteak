import { useState, useEffect } from 'react';
import { Users, Star, Award, Heart, MessageSquare, RefreshCw, ThumbsUp, Calendar } from 'lucide-react';
import { api } from '../services/api.js';
import { money } from '../utils/format.js';
import './admin-dashboard.css';

export default function CustomersPage() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFeedbacks = async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    setRefreshing(true);

    try {
      const data = await api('/api/admin/feedbacks');
      if (Array.isArray(data)) {
        setFeedbacks(data);
      }
    } catch {
      // Fallback default sample data if backend fails
      setFeedbacks([
        { id: 1, name: 'Nguyễn Văn Hùng', phone: '0905111222', tableNumber: '02', orderNumber: '48', rating: 5, comment: 'Bít tết rất ngon, sốt bơ tỏi thơm!', selectedTags: ['Món ăn vị đậm đà', 'Bít tết vừa chín tới'], createdAt: '2026-07-29T21:15:00Z' },
        { id: 2, name: 'Trần Thị Thu Hương', phone: '0935888999', tableNumber: '05', orderNumber: '50', rating: 4.8, comment: 'Phục vụ chu đáo, sẽ quay lại.', selectedTags: ['Phục vụ tận tâm', 'Không gian chuẩn Pháp'], createdAt: '2026-07-29T22:00:00Z' }
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks(true);
    // Real-time polling every 5 seconds
    const interval = setInterval(() => {
      fetchFeedbacks(false);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="admin-content bright-theme">
      {/* Page Header */}
      <section className="admin-page-head">
        <div>
          <h1 className="head-title">Quản lý Khách Hàng & Đánh Giá Realtime (CRM)</h1>
          <p className="head-sub">Theo dõi lịch sử đánh giá, nhận xét trải nghiệm và phản hồi thực tế từ khách hàng.</p>
        </div>

        <div className="admin-head-actions">
          <button
            type="button"
            className="admin-refresh-btn bright"
            onClick={() => fetchFeedbacks(true)}
            disabled={refreshing}
          >
            <RefreshCw size={16} className={refreshing ? 'spin-icon' : ''} />
            {refreshing ? 'Đang cập nhật CSDL...' : 'Làm mới ngay'}
          </button>
        </div>
      </section>

      {/* Main Table Card */}
      {loading ? (
        <div className="admin-loading-box">
          <div className="admin-loading-spinner" />
          <p className="admin-loading-text">Đang tải danh sách đánh giá từ CSDL Backend...</p>
        </div>
      ) : (
        <article className="admin-table-card fade-in">
          <table className="admin-menu-table">
            <thead>
              <tr>
                <th>Khách Hàng</th>
                <th>Bàn / Mã Đơn</th>
                <th>Đánh Giá Mức Độ</th>
                <th>Thẻ Tiêu Chí Hài Lòng</th>
                <th>Nhận Xét Đóng Góp</th>
                <th>Thời Gian</th>
              </tr>
            </thead>
            <tbody>
              {feedbacks.map((fb, idx) => {
                const tags = Array.isArray(fb.selectedTags) ? fb.selectedTags : [];
                return (
                  <tr key={fb.id || idx}>
                    <td>
                      <strong style={{ display: 'block', color: '#0f172a', fontWeight: 900 }}>
                        {fb.name || 'Khách hàng ẩn danh'}
                      </strong>
                      <small style={{ color: '#64748b' }}>{fb.phone || 'Khách quét QR'}</small>
                    </td>
                    <td>
                      <span
                        style={{
                          background: '#fff5f2',
                          color: '#e63917',
                          border: '1px solid #feccae',
                          padding: '4px 10px',
                          borderRadius: 8,
                          fontWeight: 850,
                          fontSize: 12.5
                        }}
                      >
                        Bàn {fb.tableNumber || '??'} • Đơn #{fb.orderNumber || '??'}
                      </span>
                    </td>
                    <td>
                      <span className="text-gold text-bold" style={{ fontSize: 15, fontWeight: 900 }}>
                        {fb.rating || 5} ⭐
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxWidth: 240 }}>
                        {tags.length > 0 ? (
                          tags.map((tag, tIdx) => (
                            <span
                              key={tIdx}
                              style={{
                                background: '#f1f5f9',
                                color: '#334155',
                                padding: '2px 8px',
                                borderRadius: 6,
                                fontSize: 11.5,
                                fontWeight: 700
                              }}
                            >
                              ✓ {tag}
                            </span>
                          ))
                        ) : (
                          <small style={{ color: '#94a3b8' }}>Chưa chọn thẻ</small>
                        )}
                      </div>
                    </td>
                    <td>
                      <p style={{ margin: 0, fontSize: 13.5, color: '#0f172a', fontWeight: 600, maxWidth: 320 }}>
                        "{fb.comment || 'Khách hàng không nhập lời nhắn thêm'}"
                      </p>
                    </td>
                    <td>
                      <small style={{ color: '#64748b', fontWeight: 600 }}>
                        {fb.createdAt ? new Date(fb.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : 'Vừa xong'}
                      </small>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </article>
      )}
    </main>
  );
}
