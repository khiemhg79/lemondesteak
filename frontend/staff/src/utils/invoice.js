export function money(value) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(Number(value || 0));
}

export function paymentMethodLabel(value) {
    const method = String(value || '').toUpperCase();

    if (method === 'CARD') return 'Thẻ';
    if (method === 'MOMO') return 'Momo';
    if (method === 'BANK_TRANSFER') return 'Chuyển khoản';

    return 'Tiền mặt';
}

export function printInvoice(invoice) {
    const printWindow = window.open('', '_blank', 'width=460,height=720');

    if (!printWindow) return;

    const rows = invoice.items
        .map((item) => {
            return `
        <tr>
          <td>
            <b>${item.foodName}</b><br/>
            <small>${item.foodType === 'combo' ? 'Combo' : 'Món lẻ'} · SL: ${item.quantity}</small>
          </td>
          <td style="text-align:right">${money(item.price)}</td>
          <td style="text-align:right">${money(item.lineTotal)}</td>
        </tr>
      `;
        })
        .join('');

    printWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>${invoice.invoiceNumber}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 24px;
            color: #222;
          }

          .invoice {
            max-width: 420px;
            margin: 0 auto;
          }

          h1 {
            margin: 0;
            text-align: center;
            font-size: 24px;
          }

          h2 {
            margin: 6px 0 18px;
            text-align: center;
            font-size: 16px;
          }

          .meta {
            border-top: 1px solid #222;
            border-bottom: 1px solid #222;
            padding: 10px 0;
            margin-bottom: 12px;
            font-size: 13px;
          }

          .meta p {
            margin: 4px 0;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
          }

          th {
            text-align: left;
            border-bottom: 1px solid #222;
            padding: 7px 0;
          }

          td {
            border-bottom: 1px solid #ddd;
            padding: 8px 0;
            vertical-align: top;
          }

          .summary {
            margin-top: 14px;
            font-size: 14px;
          }

          .row {
            display: flex;
            justify-content: space-between;
            margin: 7px 0;
          }

          .total {
            border-top: 1px solid #222;
            padding-top: 10px;
            font-size: 18px;
            font-weight: bold;
          }

          .thanks {
            text-align: center;
            margin-top: 22px;
            font-size: 13px;
          }
        </style>
      </head>

      <body>
        <div class="invoice">
          <h1>Lemonde Steak</h1>
          <h2>HÓA ĐƠN THANH TOÁN</h2>

          <div class="meta">
            <p><b>Số hóa đơn:</b> ${invoice.invoiceNumber}</p>
            <p><b>Đơn hàng:</b> #${invoice.orderNumber}</p>
            <p><b>Bàn:</b> ${invoice.tableNumber}</p>
            <p><b>Thời gian:</b> ${new Date(invoice.paidAt).toLocaleString('vi-VN')}</p>
            <p><b>PTTT:</b> ${paymentMethodLabel(invoice.paymentMethod)}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>Món</th>
                <th style="text-align:right">Đơn giá</th>
                <th style="text-align:right">Thành tiền</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>

          <div class="summary">
            <div class="row">
              <span>Tạm tính</span>
              <b>${money(invoice.subTotal)}</b>
            </div>

            <div class="row">
              <span>Giảm giá</span>
              <b>-${money(invoice.discountAmount)}</b>
            </div>

            <div class="row total">
              <span>Tổng cộng</span>
              <span>${money(invoice.totalAmount)}</span>
            </div>

            <div class="row">
              <span>Khách đưa</span>
              <b>${money(invoice.paidAmount)}</b>
            </div>

            <div class="row">
              <span>Tiền thừa</span>
              <b>${money(invoice.changeAmount)}</b>
            </div>
          </div>

          <p class="thanks">Cảm ơn quý khách!</p>
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