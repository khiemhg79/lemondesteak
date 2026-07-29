import { Sparkles, Utensils, X } from 'lucide-react';
import { money } from '../../utils/format.js';

export default function WelcomeModal({ tableNumber, combos = [], promotions = [], featuredItems = [], onClose }) {
  // Prefer combos, then promotions, then featured items from DB
  const promoItems = combos.length > 0
    ? combos.slice(0, 2).map(c => ({
        id: `combo-${c.id}`,
        name: c.comboName || c.name || 'Combo Đặc Biệt',
        desc: c.description || 'Thực đơn kết hợp ưu đãi hấp dẫn từ nhà hàng',
        price: c.price || c.comboPrice,
        discount: c.discountPercent ? `Giảm ${c.discountPercent}%` : 'Ưu đãi Hot',
        imageUrl: c.imageUrl
      }))
    : featuredItems.length > 0
    ? featuredItems.slice(0, 2).map(item => ({
        id: `item-${item.id}`,
        name: item.itemName || item.name,
        desc: item.description || 'Món ăn đặc sắc được ưa chuộng nhất',
        price: item.price,
        discount: 'Best Seller',
        imageUrl: item.imageUrl
      }))
    : [];

  return (
    <div className="modal-backdrop fade-in" style={{ zIndex: 1100 }}>
      <div className="welcome-modal-card scale-up">
        <button className="modal-close-btn" onClick={onClose} aria-label="Đóng">
          <X size={20} />
        </button>

        <div className="welcome-header">
          <div className="welcome-brand-logo-box" style={{ textAlign: 'center', marginBottom: 12 }}>
            <img
              src="/logo.png"
              onError={(e) => { e.target.style.display = 'none'; }}
              alt="LeMonde Steak Logo"
              style={{ height: 56, borderRadius: 10, objectFit: 'contain', boxShadow: '0 4px 14px rgba(166, 25, 34, 0.2)' }}
            />
          </div>
          <div className="welcome-badge">
            <Sparkles size={16} /> Welcome to LeMonde Steak
          </div>
          <h2 className="welcome-title">Chào Mừng Quý Khách!</h2>
          <div className="welcome-table-pill">
            <Utensils size={16} /> Quý khách đang ngồi tại <strong>Bàn {tableNumber || '??'}</strong>
          </div>
        </div>

        <p className="welcome-intro">
          Chúc quý khách có một trải nghiệm ẩm thực Pháp tuyệt vời. Quét mã tại bàn để chọn món và gọi phục vụ nhanh chóng.
        </p>

        {promoItems.length > 0 && (
          <div className="welcome-promos">
            <div className="welcome-promos-title">🔥 Gợi Ý Ưu Đãi Hôm Nay Từ CSDL</div>
            <div className="welcome-promo-list">
              {promoItems.map((promo) => (
                <div key={promo.id} className="welcome-promo-card">
                  {promo.imageUrl ? (
                    <img src={promo.imageUrl} alt={promo.name} className="welcome-promo-img" />
                  ) : (
                    <div className="welcome-promo-img-placeholder">🥩</div>
                  )}
                  <div className="welcome-promo-info">
                    <div className="welcome-promo-tag">{promo.discount}</div>
                    <h4>{promo.name}</h4>
                    <p>{promo.desc}</p>
                    {promo.price != null && (
                      <div className="welcome-promo-price">{money(promo.price)}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {promotions.length > 0 && promoItems.length === 0 && (
          <div className="welcome-promos">
            <div className="welcome-promos-title">🎁 Chương Trình Khuyến Mãi</div>
            {promotions.slice(0, 2).map((p) => (
              <div key={p.id} className="welcome-promo-card">
                <div className="welcome-promo-info">
                  <div className="welcome-promo-tag">Mã: {p.code}</div>
                  <h4>{p.title || p.code}</h4>
                  <p>{p.description || `Giảm ngay ${money(p.discountAmount || 0)}`}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <button className="welcome-start-btn" onClick={onClose}>
          Khám Phá Menu & Đặt Món Ngay
        </button>
      </div>
    </div>
  );
}
