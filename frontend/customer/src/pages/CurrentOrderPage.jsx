import { ReceiptText } from 'lucide-react';
import OrderTracker from '../components/cart/OrderTracker.jsx';

export default function CurrentOrderPage({ currentOrder, onRequestPayment, isRefreshing, onRefresh }) {
  if (!currentOrder) {
    return (
      <main className="tab-page">
        <div className="empty">
          <ReceiptText size={38} />
          <h3>Chưa có đơn hiện tại</h3>
          <p>Sau khi tiến hành đặt món, đơn vừa tạo sẽ hiển thị ở đây với tiến độ theo dõi real-time.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="tab-page">
      <OrderTracker
        order={currentOrder}
        onRequestPayment={onRequestPayment}
        isRefreshing={isRefreshing}
        onRefresh={onRefresh}
      />
    </main>
  );
}