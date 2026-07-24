import { QrCode } from 'lucide-react';
import './qr.css';

export default function TableCard({
  tableCode,
  setTableCode,
  tableInfo,
  tableError,
  tableLoading,
  resolveTable,
  clearTable,
  auth
}) {
  const userMode = auth ? 'Thành viên' : 'Khách';

  const submitTable = (event) => {
    event.preventDefault();
    resolveTable(tableCode);
  };

  return (
    <section className="qr-table-card">
      <div className="qr-table-main">
        <div className="qr-table-icon">
          <QrCode size={23} />
        </div>

        <div className="qr-table-content">
          <div className="qr-table-label">
            <h1>
              {tableInfo
                ? `Bàn ${tableInfo.tableNumber}`
                : 'Chưa chọn bàn'}
            </h1>

            <span className="qr-customer-mode">{userMode}</span>
          </div>

          <p>
            {tableInfo
              ? `Sức chứa ${tableInfo.capacity} · Trạng thái ${tableInfo.status}`
              : 'Quét QR trên bàn để mở menu đúng bàn hoặc nhập mã bàn.'}
          </p>
        </div>
      </div>

      {!tableInfo && (
        <form className="qr-table-input" onSubmit={submitTable}>
          <input
            value={tableCode}
            onChange={(event) => setTableCode(event.target.value)}
            placeholder="Nhập mã bàn, ví dụ B03"
          />

          <button type="submit" disabled={tableLoading}>
            {tableLoading ? '...' : 'OK'}
          </button>
        </form>
      )}

      {tableError && !tableInfo && (
        <div className="qr-table-error">{tableError}</div>
      )}

      {tableInfo && (
        <div className="qr-table-success">
          Đã quét QR thành công. Menu đang hiển thị cho bàn{' '}
          {tableInfo.tableNumber}.
          <button
            type="button"
            onClick={clearTable}
            style={{
              marginLeft: 8,
              border: 0,
              background: 'transparent',
              color: '#ff4a19',
              fontWeight: 900
            }}
          >
            Đổi bàn
          </button>
        </div>
      )}
    </section>
  );
}