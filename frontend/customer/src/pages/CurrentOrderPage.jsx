import { ReceiptText } from 'lucide-react';
import { money } from '../utils/format.js';

export default function CurrentOrderPage({ currentOrder }) {
  if (!currentOrder) {
    return (
      <main className="tab-page">
        <div className="empty">
          <ReceiptText size={38} />
          <h3>Chưa có đơn hiện tại</h3>
          <p>Sau khi tiến hành đặt món, đơn vừa tạo sẽ hiển thị ở đây.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="tab-page">
      <section className="current-order-card">
        <div className="current-order-head">
          <div>
            <span>Đơn hiện tại</span>
            <h2>#{currentOrder.orderNumber}</h2>
          </div>

          <strong>{currentOrder.orderStatus || 'PENDING'}</strong>
        </div>

        <div className="current-order-info">
          <p>Bàn: {currentOrder.tableNumber || 'Chưa rõ'}</p>
          <p>Tạm tính: {money(currentOrder.subTotal)}</p>
          <p>Giảm giá: -{money(currentOrder.discountAmount)}</p>
          <p>Tổng cộng: {money(currentOrder.totalAmount)}</p>
        </div>

        <div className="current-order-lines">
          {currentOrder.lines?.map((line) => (
            <article key={`${line.type}-${line.id}`}>
              <div>
                <b>{line.name}</b>
                <span>
                  {line.quantity} x {money(line.price)}
                </span>
              </div>

              <strong>{money(Number(line.price || 0) * line.quantity)}</strong>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}