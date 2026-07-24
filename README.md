# LemondeSteak Fullstack Modular

Bản này đã tách frontend theo đúng vai trò và tách từng chức năng thành file riêng.

## Cấu trúc chính

```text
backend/
frontend/
  customer/
    src/
      components/
        auth/
        cart/
        layout/
        menu/
      hooks/
      pages/
      services/
      utils/
  staff/
    src/
      components/
      pages/
      services/
      utils/
  admin/
    src/
      components/
      pages/
      services/
      utils/
```

## Chạy backend

```powershell
cd backend
mvn clean spring-boot:run
```

Backend đã set profile `supabase` trong `application.yml`, không cần nạp `.env` nếu chạy local theo cấu hình sẵn.

## Chạy customer web app QR

```powershell
cd frontend/customer
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

Mở theo bàn:

```text
http://localhost:5173/t/3
```

## Chạy staff

```powershell
cd frontend/staff
npm install
npm run dev -- --host 0.0.0.0 --port 5174
```

## Chạy admin

```powershell
cd frontend/admin
npm install
npm run dev -- --host 0.0.0.0 --port 5175
```

## Ghi chú

- Customer là web app mobile-first cho khách quét QR đặt món.
- Staff dùng cho nhân viên quản lý bàn, đơn hiện tại, trạng thái món, thanh toán.
- Admin dùng cho quản trị người dùng, thực đơn, danh mục, combo, khuyến mãi, bàn, thống kê.
- Backend entity đã chỉnh theo schema Supabase bạn gửi: bảng `customers`, `comboitems`, `customerpromotions`, `orderdetails` không còn bị ép đọc cột không tồn tại.
