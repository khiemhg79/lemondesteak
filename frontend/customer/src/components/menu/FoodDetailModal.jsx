import { ImageOff, Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { money } from '../../utils/format.js';

export default function FoodDetailModal({ open, item, onClose, onAdd }) {
    const [imageError, setImageError] = useState(false);

    useEffect(() => {
        setImageError(false);
    }, [item?.id]);

    if (!open || !item) return null;

    const itemType = item.type || 'item';
    const hasImage = Boolean(item.image) && !imageError;

    const handleAddToCart = () => {
        onAdd({
            type: itemType,
            id: item.id,
            name: item.name,
            price: item.price,
            image: item.image
        });

        onClose();
    };

    return (
        <div className="detail-backdrop" onClick={onClose}>
            <div className="detail-modal" onClick={(event) => event.stopPropagation()}>
                <button className="detail-close" type="button" onClick={onClose}>
                    <X size={18} />
                </button>

                <div className="detail-header">
                    <span className="detail-badge">
                        {itemType === 'combo' ? 'Combo' : 'Món ăn'}
                    </span>

                    <h2>{item.name}</h2>
                </div>

                {hasImage ? (
                    <img
                        className="detail-image"
                        src={item.image}
                        alt={item.name}
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <div className="detail-no-image">
                        <ImageOff size={34} />
                        <span>Chưa có hình ảnh món ăn</span>
                    </div>
                )}

                <div className="detail-content">
                    <p>
                        {item.description?.trim()
                            ? item.description
                            : 'Món ăn đang được cập nhật mô tả chi tiết.'}
                    </p>

                    <div className="detail-meta">
                        <div>
                            <span>Giá món</span>
                            <b>{money(item.price)}</b>
                        </div>

                        <div>
                            <span>Trạng thái</span>
                            <b>Đang bán</b>
                        </div>
                    </div>
                </div>

                <div className="detail-footer">
                    <strong>{money(item.price)}</strong>

                    <button className="detail-add-btn" type="button" onClick={handleAddToCart}>
                        <Plus size={18} />
                        Thêm vào giỏ
                    </button>
                </div>
            </div>
        </div>
    );
}