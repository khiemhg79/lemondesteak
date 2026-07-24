import { ReceiptText } from 'lucide-react';
import { money } from '../utils/format.js';

export default function CurrentOrdersPage({ selectedTable, orders, paidAmount, setPaidAmount, loadOrders, updateDetail, requestPayment, payOrder }) {
  return (
    <aside className="card">
      <h2>{selectedTable ? `Đơn hiện tại - Bàn ${selectedTable.tableNumber}` : 'Chọn bàn để xem đơn'}</h2>
      <button className="btn secondary" onClick={() => loadOrders()}>Tải lại</button>
      <div className="grid" style={{ marginTop: 14 }}>
        {orders.map((order) => (
          <article className="card" key={order.id} style={{ boxShadow: 'none' }}>
            <h3>Đơn #{order.orderNumber}</h3>
            <p className="muted">{order.customerName || 'Khách'} · {order.orderStatus}</p>
            <h3>{money(order.totalAmount)}</h3>

            <div className="grid">
              {order.details?.map((detail) => (
                <div className="cart-row" key={detail.id}>
                  <div><b>{detail.name}</b><div className="muted">SL {detail.quantity} · {money(detail.price)}</div></div>
                  <select className="select" value={detail.status} onChange={(event) => updateDetail(detail, event.target.value)}>
                    <option>WAITING</option><option>PREPARING</option><option>DONE</option><option>SERVED</option><option>CANCELLED</option>
                  </select>
                </div>
              ))}
            </div>

            <div className="field"><label>Khách đưa</label><input className="input" value={paidAmount} onChange={(event) => setPaidAmount(event.target.value)} placeholder={order.totalAmount} /></div>
            <div className="filters">
              <button className="btn small secondary" onClick={() => requestPayment(order)}><ReceiptText size={14} /> Yêu cầu thanh toán</button>
              <button className="btn small" onClick={() => payOrder(order)}>Thanh toán</button>
            </div>
          </article>
        ))}
      </div>
    </aside>
  );
}
