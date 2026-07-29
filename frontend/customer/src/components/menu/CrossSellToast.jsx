import { useState } from 'react';
import { PlusCircle, Sparkles, X } from 'lucide-react';
import { money } from '../../utils/format.js';

export default function CrossSellToast({ menuItems = [], categories = [], onAddToCart, onClose }) {
  // Find dessert or beverage category items from DB menuItems
  const dessertCategoryIds = new Set(
    categories
      .filter((c) => {
        const name = (c.categoryName || c.name || '').toLowerCase();
        return name.includes('tráng miệng') || name.includes('dessert') || name.includes('đồ uống') || name.includes('nước') || name.includes('beverage') || name.includes('drink');
      })
      .map((c) => c.id)
  );

  let candidateItems = menuItems.filter(
    (item) => dessertCategoryIds.has(item.categoryId) || dessertCategoryIds.has(item.category?.id)
  );

  if (candidateItems.length === 0) {
    // Fallback: pick affordable side items from DB (price <= 120k)
    candidateItems = menuItems.filter((item) => Number(item.price || 0) <= 120000 && item.isAvailable !== false);
  }

  if (candidateItems.length === 0) {
    candidateItems = menuItems.slice(0, 3);
  }

  // Pick one suggested item
  const [itemIndex] = useState(() => Math.floor(Math.random() * candidateItems.length));
  const suggestedItem = candidateItems[itemIndex];

  if (!suggestedItem) return null;

  return (
    <div className="cross-sell-toast slide-up">
      <button className="cross-sell-close" onClick={onClose} aria-label="Đóng gợi ý">
        <X size={16} />
      </button>

      <div className="cross-sell-badge">
        <Sparkles size={14} /> Gợi ý dùng kèm tuyệt vời
      </div>

      <div className="cross-sell-content">
        {suggestedItem.imageUrl ? (
          <img src={suggestedItem.imageUrl} alt={suggestedItem.itemName || suggestedItem.name} className="cross-sell-img" />
        ) : (
          <div className="cross-sell-img-placeholder">🍨</div>
        )}

        <div className="cross-sell-details">
          <h4>{suggestedItem.itemName || suggestedItem.name}</h4>
          <p className="cross-sell-desc">
            {suggestedItem.description || 'Món ngon tuyệt hảo được các thực khách vô cùng yêu thích!'}
          </p>
          <div className="cross-sell-price">{money(suggestedItem.price)}</div>
        </div>

        <button
          className="cross-sell-add-btn"
          onClick={() => {
            onAddToCart(suggestedItem);
            onClose();
          }}
        >
          <PlusCircle size={16} /> Thêm món
        </button>
      </div>
    </div>
  );
}
