import { useState } from 'react';
import { CheckCircle2, Clock, CookingPot, CreditCard, QrCode, RefreshCw, UtensilsCrossed } from 'lucide-react';
import { money } from '../../utils/format.js';
import VietQRPaymentModal from './VietQRPaymentModal.jsx';

export default function OrderTracker({ order, onRequestPayment, isRefreshing, onRefresh }) {
  const [showQRModal, setShowQRModal] = useState(false);

  if (!order) return null;

  const status = (order.orderStatus || 'PENDING').toUpperCase();

  // Calculate overall timeline step (1: Received, 2: Preparing, 3: Served, 4: Payment)
  let currentStep = 1;
  if (status === 'PREPARING' || status === 'CONFIRMED' || status === 'IN_PROGRESS') {
    currentStep = 2;
  } else if (status === 'SERVED' || status === 'COMPLETED') {
    currentStep = 3;
  } else if (status === 'REQUEST_PAYMENT' || status === 'PAID') {
    currentStep = 4;
  }

  // Check details if lines contain detail status
  const lines = order.lines || order.orderDetails || [];

  const getLineStatusBadge = (lineStatus) => {
    const s = (lineStatus || 'PENDING').toUpperCase();
    if (s === 'PREPARING' || s === 'CONFIRMED' || s === 'IN_PROGRESS') {
      return (
        <span className="line-status-badge preparing">
          <CookingPot size={13} className="spin-slow" /> Bếp đang nấu
        </span>
      );
    }
    if (s === 'SERVED' || s === 'COMPLETED') {
      return (
        <span className="line-status-badge served">
          <CheckCircle2 size={13} /> Đã ra món
        </span>
      );
    }
    if (s === 'CANCELLED') {
      return <span className="line-status-badge cancelled">Đã hủy</span>;
    }
    return (
      <span className="line-status-badge pending">
        <Clock size={13} /> Chờ bếp nhận
      </span>
    );
  };

  return (
    <div className="order-tracker-card fade-in">
      <div className="tracker-header">
        <div className="tracker-header-left">
          <span className="tracker-label">Đơn Hàng Theo Dõi Real-Time</span>
          <h3 className="tracker-order-num">Đơn #{order.orderNumber || order.id}</h3>
          <span className="tracker-table-badge">Bàn {order.tableNumber || '??'}</span>
        </div>

        <button
          className={`tracker-refresh-btn ${isRefreshing ? 'spinning' : ''}`}
          onClick={onRefresh}
          title="Cập nhật trạng thái mới nhất"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Progress Timeline Stepper */}
      <div className="tracker-stepper">
        <div className={`step-item ${currentStep >= 1 ? 'active' : ''}`}>
          <div className="step-icon">
            <Clock size={18} />
          </div>
          <span className="step-text">Tiếp nhận</span>
        </div>
        <div className={`step-line ${currentStep >= 2 ? 'active' : ''}`} />

        <div className={`step-item ${currentStep >= 2 ? 'active' : ''}`}>
          <div className="step-icon">
            <CookingPot size={18} />
          </div>
          <span className="step-text">Đang chế biến</span>
        </div>
        <div className={`step-line ${currentStep >= 3 ? 'active' : ''}`} />

        <div className={`step-item ${currentStep >= 3 ? 'active' : ''}`}>
          <div className="step-icon">
            <UtensilsCrossed size={18} />
          </div>
          <span className="step-text">Đã phục vụ</span>
        </div>
        <div className={`step-line ${currentStep >= 4 ? 'active' : ''}`} />

        <div className={`step-item ${currentStep >= 4 ? 'active' : ''}`}>
          <div className="step-icon">
            <CreditCard size={18} />
          </div>
          <span className="step-text">Thanh toán</span>
        </div>
      </div>

      {/* Realtime Live Pulse Indicator */}
      <div className="tracker-live-indicator">
        <span className="live-dot" />
        <span>Hệ thống tự động đồng bộ real-time với bếp và nhân viên</span>
      </div>

      {/* Item List Breakdown */}
      <div className="tracker-items-section">
        <h4 className="tracker-items-title">Danh sách món trong đơn ({lines.length})</h4>
        <div className="tracker-item-list">
          {lines.length === 0 ? (
            <p className="no-items-text">Chưa có chi tiết danh sách món</p>
          ) : (
            lines.map((line, idx) => (
              <div key={line.id || idx} className="tracker-item-row">
                <div className="tracker-item-main">
                  <div className="tracker-item-name-qty">
                    <span className="tracker-item-qty">{line.quantity}x</span>
                    <strong className="tracker-item-name">{line.name || line.itemName}</strong>
                  </div>
                  {line.note && <span className="tracker-item-note">Ghi chú: {line.note}</span>}
                </div>

                <div className="tracker-item-right">
                  {getLineStatusBadge(line.status || line.detailStatus || status)}
                  <span className="tracker-item-price">
                    {money(Number(line.price || 0) * (line.quantity || 1))}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Total & Action Footer */}
      <div className="tracker-footer">
        <div className="tracker-total-box">
          <span>Tổng tiền đơn hàng:</span>
          <strong>{money(order.totalAmount || order.subTotal || 0)}</strong>
        </div>

        {status !== 'REQUEST_PAYMENT' && status !== 'PAID' && (
          <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
            <button
              className="tracker-pay-req-btn"
              style={{ background: 'linear-gradient(135deg, #166534 0%, #15803d 100%)', boxShadow: '0 8px 20px rgba(22, 101, 52, 0.3)' }}
              onClick={() => setShowQRModal(true)}
            >
              <QrCode size={18} /> Chuyển Khoản Mã VietQR
            </button>

            {onRequestPayment && (
              <button
                className="tracker-pay-req-btn"
                style={{ background: '#4b5563', boxShadow: 'none' }}
                onClick={onRequestPayment}
              >
                <CreditCard size={18} /> Gọi Nhân Viên Thanh Toán
              </button>
            )}
          </div>
        )}

        {status === 'REQUEST_PAYMENT' && (
          <div className="tracker-payment-pending-notice">
            <Clock size={16} /> Đã gửi yêu cầu thanh toán. Quý khách có thể quét mã VietQR hoặc chờ nhân viên tới bàn!
          </div>
        )}
      </div>

      {showQRModal && (
        <VietQRPaymentModal
          order={order}
          onClose={() => setShowQRModal(false)}
          onConfirmPayment={() => {
            if (onRequestPayment) onRequestPayment();
          }}
        />
      )}
    </div>
  );
}
