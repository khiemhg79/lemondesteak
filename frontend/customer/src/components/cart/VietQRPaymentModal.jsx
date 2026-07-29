import { useState } from 'react';
import { Check, Copy, CreditCard, QrCode, ShieldCheck, X } from 'lucide-react';
import { money } from '../../utils/format.js';

export default function VietQRPaymentModal({ order, onClose, onConfirmPayment }) {
  const [copiedField, setCopiedField] = useState(null);

  if (!order) return null;

  const totalAmount = Math.round(Number(order.totalAmount || order.subTotal || 0));
  const tableNum = order.tableNumber || '03';
  const orderNum = order.orderNumber || order.id || '1001';
  const memo = `LMS Ban ${tableNum} Don ${orderNum}`.replace(/[^a-zA-Z0-9 ]/g, '');
  const bankAccount = '113366668888';
  const bankName = 'VietinBank';
  const accountName = 'NHAHANG LEMONDE STEAK';

  // VietQR Dynamic Image URL
  const qrUrl = `https://img.vietqr.io/image/vietinbank-113366668888-compact.jpg?amount=${totalAmount}&addInfo=${encodeURIComponent(memo)}&accountName=${encodeURIComponent(accountName)}`;

  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="modal-backdrop fade-in" style={{ zIndex: 99999 }}>
      <div className="vietqr-modal-card scale-up">
        <button className="modal-close-btn" onClick={onClose} aria-label="Đóng">
          <X size={20} />
        </button>

        <div className="vietqr-header">
          <div className="vietqr-badge">
            <QrCode size={16} /> Thanh Toán Chuyển Khoản QR
          </div>
          <h2>VietQR Tự Động Hóa Đơn</h2>
          <p className="vietqr-sub">Mở ứng dụng Ngân hàng (App Banking) hoặc ví điện tử bất kỳ để quét mã bên dưới</p>
        </div>

        {/* VietQR Dynamic Code Display */}
        <div className="vietqr-image-wrapper">
          <img
            src={qrUrl}
            alt="Mã VietQR Thanh Toán"
            className="vietqr-img"
            onError={(e) => {
              // Fallback if image fails to load
              e.target.src = 'https://img.vietqr.io/image/vietinbank-113366668888-compact.jpg';
            }}
          />
          <div className="vietqr-scan-hint">
            <ShieldCheck size={14} /> Tự động khớp đúng số tiền <strong>{money(totalAmount)}</strong> & nội dung
          </div>
        </div>

        {/* Bank Account Details Breakdown */}
        <div className="vietqr-details-box">
          <div className="vietqr-detail-row">
            <span className="detail-label">Ngân hàng:</span>
            <strong className="detail-val">{bankName} (Công Thương)</strong>
          </div>

          <div className="vietqr-detail-row">
            <span className="detail-label">Số tài khoản:</span>
            <div className="detail-copy-group">
              <strong className="detail-val">{bankAccount}</strong>
              <button
                type="button"
                className={`copy-btn ${copiedField === 'acc' ? 'copied' : ''}`}
                onClick={() => copyToClipboard(bankAccount, 'acc')}
              >
                {copiedField === 'acc' ? <Check size={14} /> : <Copy size={14} />}
                {copiedField === 'acc' ? 'Đã chép' : 'Chép STK'}
              </button>
            </div>
          </div>

          <div className="vietqr-detail-row">
            <span className="detail-label">Chủ tài khoản:</span>
            <strong className="detail-val">{accountName}</strong>
          </div>

          <div className="vietqr-detail-row highlight-amount">
            <span className="detail-label">Số tiền:</span>
            <div className="detail-copy-group">
              <strong className="amount-text">{money(totalAmount)}</strong>
              <button
                type="button"
                className={`copy-btn ${copiedField === 'amt' ? 'copied' : ''}`}
                onClick={() => copyToClipboard(String(totalAmount), 'amt')}
              >
                {copiedField === 'amt' ? <Check size={14} /> : <Copy size={14} />}
                {copiedField === 'amt' ? 'Đã chép' : 'Chép Tiền'}
              </button>
            </div>
          </div>

          <div className="vietqr-detail-row highlight-memo">
            <span className="detail-label">Nội dung CK:</span>
            <div className="detail-copy-group">
              <strong className="memo-text">{memo}</strong>
              <button
                type="button"
                className={`copy-btn ${copiedField === 'memo' ? 'copied' : ''}`}
                onClick={() => copyToClipboard(memo, 'memo')}
              >
                {copiedField === 'memo' ? <Check size={14} /> : <Copy size={14} />}
                {copiedField === 'memo' ? 'Đã chép' : 'Chép ND'}
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="vietqr-actions">
          <button
            className="vietqr-confirm-btn"
            onClick={() => {
              onConfirmPayment();
              onClose();
            }}
          >
            <CreditCard size={18} /> Tôi Đã Chuyển Khoản - Báo Nhân Viên
          </button>
        </div>
      </div>
    </div>
  );
}
