import {
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  X
} from 'lucide-react';
import { money } from '../../utils/format.js';
import { calculateCartSummary } from '../../utils/cart.js';
import VoucherSelector from '../voucher/VoucherSelector.jsx';
import './cart.css';

export default function CartDrawer({
  open,
  onClose,
  auth,
  cart,
  changeQty,
  removeLine,
  clearCart,
  promotions,
  selectedPromotionId,
  setSelectedPromotionId,
  submitOrder,
  tableInfo,
  orderLoading,
  onToast
}) {
  if (!open) return null;

  const selectedPromotion =
    promotions.find((promotion) => promotion.id === selectedPromotionId) || null;

  const summary = calculateCartSummary(cart, selectedPromotion);
  const canSubmit = cart.length > 0 && !orderLoading;

  return (
    <div className="cart-sheet-backdrop" onClick={onClose}>
      <section className="cart-sheet" onClick={(event) => event.stopPropagation()}>
        <header className="cart-sheet-header">
          <div>
            <h2>Giỏ hàng ({summary.cartCount})</h2>
            <p>
              {tableInfo
                ? `Bàn ${tableInfo.tableNumber}`
                : 'Chưa chọn bàn, hãy quét QR hoặc nhập mã bàn.'}
            </p>
          </div>

          <button className="cart-sheet-close" type="button" onClick={onClose}>
            <X size={18} />
          </button>
        </header>

        <div className="cart-sheet-lines">
          {cart.length ? (
            cart.map((line) => (
              <article className="cart-sheet-line" key={`${line.type}-${line.id}`}>
                <img
                  className="cart-sheet-image"
                  src={line.image || ''}
                  alt={line.name}
                />

                <div className="cart-sheet-info">
                  <h3>{line.name}</h3>
                  <span>{money(line.price)} / món</span>
                  <b>{money(Number(line.price || 0) * line.quantity)}</b>
                </div>

                <div className="cart-sheet-actions">
                  <button
                    className="cart-sheet-remove"
                    type="button"
                    onClick={() => removeLine(line)}
                  >
                    <X size={14} />
                  </button>

                  <div className="cart-sheet-qty">
                    <button type="button" onClick={() => changeQty(line, -1)}>
                      <Minus size={14} />
                    </button>

                    <strong>{line.quantity}</strong>

                    <button type="button" onClick={() => changeQty(line, 1)}>
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="cart-sheet-empty">
              <ShoppingBag size={38} />
              <h3>Giỏ hàng đang trống</h3>
              <p>Chọn món trong thực đơn rồi bấm “Thêm” để thêm vào giỏ.</p>
            </div>
          )}
        </div>

        <VoucherSelector
          auth={auth}
          vouchers={promotions}
          selectedVoucherId={selectedPromotionId}
          setSelectedVoucherId={setSelectedPromotionId}
          subTotal={summary.subTotal}
          onToast={onToast}
        />

        <footer className="cart-sheet-footer">
          <div className="cart-money-row">
            <span>Tạm tính</span>
            <b>{money(summary.subTotal)}</b>
          </div>

          <div className="cart-money-row">
            <span>Giảm giá</span>
            <b>-{money(summary.discountAmount)}</b>
          </div>

          <div className="cart-money-row total">
            <span>Tổng cộng</span>
            <strong>{money(summary.totalAmount)}</strong>
          </div>

          <div className="cart-sheet-footer-actions">
            <button
              className="cart-order-btn"
              type="button"
              disabled={!canSubmit}
              onClick={submitOrder}
            >
              {orderLoading ? 'Đang tạo đơn...' : 'Tiến hành đặt món'}
            </button>

            <button
              className="cart-clear-btn"
              type="button"
              disabled={!cart.length || orderLoading}
              onClick={clearCart}
            >
              <Trash2 size={16} />
              Xóa giỏ
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}