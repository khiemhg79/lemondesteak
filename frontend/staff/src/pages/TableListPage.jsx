import { QrCode, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import './table-qr.css';

function getCustomerBaseUrl() {
  const { protocol, hostname } = window.location;

  return `${protocol}//${hostname}:5173`;
}

function buildQrLink(table) {
  const tableCode = encodeURIComponent(table.tableNumber || table.id);
  return `${getCustomerBaseUrl()}/t/${tableCode}`;
}

function getQrImageUrl(qrLink) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=230x230&data=${encodeURIComponent(
    qrLink
  )}`;
}

function QrModal({ table, onClose }) {
  const qrLink = useMemo(() => buildQrLink(table), [table]);
  const qrImageUrl = useMemo(() => getQrImageUrl(qrLink), [qrLink]);

  const copyLink = async () => {
    await navigator.clipboard.writeText(qrLink);
  };

  return (
    <div className="qr-modal-backdrop" onClick={onClose}>
      <section className="qr-modal" onClick={(event) => event.stopPropagation()}>
        <header className="qr-modal-head">
          <div>
            <h2>Mã QR bàn {table.tableNumber}</h2>
            <p>Khách quét mã này để mở menu và đặt món đúng bàn.</p>
          </div>

          <button className="qr-close" type="button" onClick={onClose}>
            <X size={18} />
          </button>
        </header>

        <div className="qr-code-box">
          <img src={qrImageUrl} alt={`QR bàn ${table.tableNumber}`} />
        </div>

        <div className="qr-link-box">
          <label>Link QR</label>

          <div className="qr-link-row">
            <input value={qrLink} readOnly />
            <button type="button" onClick={copyLink}>
              Copy
            </button>
          </div>
        </div>

        <p className="qr-note">
          QR gắn cố định với bàn. Dù bàn đang trống, đang dùng hay đang dọn,
          mã QR vẫn giữ nguyên.
        </p>
      </section>
    </div>
  );
}

export default function TableListPage({
  tables,
  selectedTable,
  selectTable,
  changeTableStatus
}) {
  const [qrTable, setQrTable] = useState(null);

  return (
    <section className="card">
      <h2>Danh sách bàn</h2>

      <div className="grid cols-3">
        {tables.map((table) => (
          <div
            className="card table-card-qr"
            key={table.id}
            style={{
              boxShadow: 'none',
              borderColor:
                selectedTable?.id === table.id ? '#ff4d1c' : undefined
            }}
          >
            <div className="table-card-top">
              <div>
                <h3>Bàn {table.tableNumber}</h3>
                <p>Sức chứa: {table.capacity}</p>
              </div>

              <span className="status">{table.status}</span>
            </div>

            <div className="table-card-actions">
              <button
                className="btn small"
                type="button"
                onClick={() => selectTable(table)}
              >
                Xem đơn
              </button>

              <button
                className="btn small secondary"
                type="button"
                onClick={() => setQrTable(table)}
              >
                <QrCode size={15} />
                QR
              </button>

              <select
                className="select"
                value={table.status}
                onChange={(event) =>
                  changeTableStatus(table, event.target.value)
                }
              >
                <option>EMPTY</option>
                <option>OCCUPIED</option>
                <option>RESERVED</option>
                <option>CLEANING</option>
              </select>
            </div>
          </div>
        ))}
      </div>

      {qrTable && (
        <QrModal table={qrTable} onClose={() => setQrTable(null)} />
      )}
    </section>
  );
}