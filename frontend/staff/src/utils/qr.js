export function getCustomerBaseUrl() {
    const envCustomerUrl = import.meta.env.VITE_CUSTOMER_URL;

    if (envCustomerUrl) {
        return envCustomerUrl.replace(/\/$/, '');
    }

    return `${window.location.protocol}//${window.location.hostname}:5173`;
}

export function buildTableQrLink(table) {
    const tableCode = encodeURIComponent(table.tableNumber || table.id);
    const createdAt = Date.now();

    return `${getCustomerBaseUrl()}/t/${tableCode}?qrAt=${createdAt}`;
}

export function getQrImageUrl(qrLink, size = 260) {
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(
        qrLink
    )}`;
}

export function printQr({ table, qrLink, qrImageUrl }) {
    const printWindow = window.open('', '_blank', 'width=420,height=640');

    if (!printWindow) return;

    printWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>QR bàn ${table.tableNumber}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 28px;
            text-align: center;
            color: #222;
          }

          .card {
            border: 2px solid #222;
            border-radius: 18px;
            padding: 24px;
          }

          h1 {
            margin: 0 0 6px;
            font-size: 24px;
          }

          h2 {
            margin: 0 0 16px;
            font-size: 20px;
          }

          img {
            width: 260px;
            height: 260px;
            margin: 10px auto;
            display: block;
          }

          p {
            margin: 8px 0;
            font-size: 14px;
            line-height: 1.45;
          }

          .link {
            margin-top: 14px;
            font-size: 11px;
            word-break: break-all;
          }
        </style>
      </head>

      <body>
        <div class="card">
          <h1>Lemonde Steak</h1>
          <h2>Mã QR Đặt Món - Bàn ${table.tableNumber}</h2>
          <p>Quét mã QR để xem thực đơn và đặt món.</p>
          <img src="${qrImageUrl}" alt="QR bàn ${table.tableNumber}" />
          <p>QR có hiệu lực trong 12 giờ kể từ lúc tạo.</p>
          <p class="link">${qrLink}</p>
        </div>

        <script>
          window.onload = function () {
            window.print();
          };
        </script>
      </body>
    </html>
  `);

    printWindow.document.close();
}