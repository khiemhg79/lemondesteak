import { Plus } from 'lucide-react';
import { money } from '../../utils/format.js';

export default function FoodCard({ item, onAdd, onViewDetail }) {
  const handleViewDetail = () => {
    onViewDetail(item);
  };

  const handleAdd = (event) => {
    event.stopPropagation();

    onAdd({
      type: item.type || 'item',
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image
    });
  };

  return (
    <article
      className="food-card"
      onClick={handleViewDetail}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          handleViewDetail();
        }
      }}
    >
      <img src={item.image || ''} alt={item.name} />

      <div className="food-info">
        <h3>{item.name}</h3>

        <p>{item.description || 'Món ăn đang được cập nhật mô tả.'}</p>

        <div className="food-footer">
          <b>{money(item.price)}</b>

          <button className="add-btn" type="button" onClick={handleAdd}>
            <Plus size={18} />
            <span>Thêm</span>
          </button>
        </div>
      </div>
    </article>
  );
}