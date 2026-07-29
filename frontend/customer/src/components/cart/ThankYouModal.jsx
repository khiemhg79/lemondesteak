import { useState } from 'react';
import { Award, CheckCircle2, HeartHandshake, Star, Ticket } from 'lucide-react';
import { money } from '../../utils/format.js';

export default function ThankYouModal({ order, promotions = [], onClose }) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState(['Món ăn vị đậm đà', 'Phục vụ tận tâm']);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const tagsList = [
    'Món ăn vị đậm đà',
    'Bít tết vừa chín tới',
    'Phục vụ tận tâm',
    'Lên món nhanh chóng',
    'Không gian chuẩn Pháp',
    'Giá cả xứng đáng'
  ];

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  // Find a return voucher from DB promotions
  const voucher = promotions.length > 0 ? promotions[0] : null;

  const handleSubmit = async () => {
    const payload = {
      orderNumber: order?.orderNumber || order?.id || '52',
      tableNumber: order?.tableNumber || 'T04',
      name: `Khách tại bàn ${order?.tableNumber || 'T04'}`,
      phone: 'Khách bàn ' + (order?.tableNumber || 'T04'),
      rating,
      selectedTags,
      comment: comment || (selectedTags.length > 0 ? selectedTags.join(', ') : 'Đánh giá tuyệt vời!'),
      createdAt: new Date().toISOString()
    };

    try {
      await fetch('http://localhost:8080/api/customer/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch {
      // Ignore network error fallback
    }

    setSubmitted(true);
  };

  return (
    <div className="modal-backdrop fade-in" style={{ zIndex: 1200 }}>
      <div className="thankyou-modal-card scale-up">
        {!submitted ? (
          <>
            <div className="thankyou-icon-header">
              <div className="thankyou-icon-circle">
                <CheckCircle2 size={42} />
              </div>
              <h2>Thanh Toán Thành Công!</h2>
              <p>Cảm ơn quý khách đã dùng bữa tại <strong>LeMonde Steak</strong></p>
              {order && (
                <div className="thankyou-order-badge">
                  Đơn hàng #{order.orderNumber || order.id} • Bàn {order.tableNumber || '??'}
                </div>
              )}
            </div>

            <div className="rating-box">
              <h3>Quý khách đánh giá trải nghiệm hôm nay như thế nào?</h3>
              <div className="star-rating-row">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`star-btn ${star <= (hoverRating || rating) ? 'filled' : ''}`}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                  >
                    <Star size={32} />
                  </button>
                ))}
              </div>
              <span className="rating-score-text">
                {rating === 5 && '🌟 Tăng tuyệt vời! Chúng tôi rất vui mừng'}
                {rating === 4 && '😊 Rất tốt! Cảm ơn nhận xét của bạn'}
                {rating === 3 && '😐 Hài lòng! Chúng tôi sẽ hoàn thiện hơn'}
                {rating <= 2 && '😔 Thành thật xin lỗi vì trải nghiệm chưa hoàn hảo'}
              </span>
            </div>

            <div className="tags-box">
              <h4>Điều gì khiến quý khách hài lòng nhất?</h4>
              <div className="tag-chips">
                {tagsList.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className={`tag-chip ${selectedTags.includes(tag) ? 'active' : ''}`}
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="comment-box">
              <textarea
                placeholder="Gợi ý hoặc đóng góp ý kiến thêm cho LeMonde Steak (tùy chọn)..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
              />
            </div>

            {voucher && (
              <div className="voucher-reward-card">
                <div className="voucher-reward-icon">
                  <Ticket size={24} />
                </div>
                <div className="voucher-reward-info">
                  <span className="voucher-tag">Quà Tặng Tri Ân Từ CSDL</span>
                  <strong>{voucher.title || `Voucher ${voucher.code}`}</strong>
                  <p>{voucher.description || `Giảm ${money(voucher.discountAmount || 0)} cho lần hẹn tới`}</p>
                </div>
              </div>
            )}

            <button className="thankyou-submit-btn" onClick={handleSubmit}>
              <HeartHandshake size={18} /> Gửi Đánh Giá & Hoàn Tất
            </button>
          </>
        ) : (
          <div className="thankyou-success-state fade-in">
            <div className="success-sparkle-icon">
              <Award size={48} />
            </div>
            <h2>Cảm Ơn Quý Khách!</h2>
            <p>
              Ý kiến đóng góp của quý khách đã được ghi nhận. Chúc quý khách một ngày thật nhiều niềm vui và hẹn gặp lại tại LeMonde Steak!
            </p>
            <button className="thankyou-close-final-btn" onClick={onClose}>
              Đóng & Sẵn Sàng Cho Khách Mới
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
