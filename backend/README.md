# LemondeSteak Spring Boot API

Backend REST API cho hệ thống quản lý đặt món tại nhà hàng LemondeSteak.

## Chức năng đã dựng

- Đăng ký, đăng nhập bằng số điện thoại, trả JWT.
- Xem danh mục, món ăn, combo, tìm kiếm món ăn.
- Xem voucher/khuyến mãi còn dùng được, tự ẩn mã đã hết lượt hoặc khách đã dùng.
- Tạo đơn đặt món theo bàn, chọn món/combo, áp khuyến mãi.
- Xem đơn hiện tại của bàn, lịch sử đơn theo khách.
- Cập nhật trạng thái món trong đơn cho nhân viên.
- Gửi yêu cầu thanh toán, tạo hóa đơn chưa thanh toán.
- Thanh toán hóa đơn, cập nhật bàn về trạng thái trống.

## Chạy project

1. Tạo database PostgreSQL tên `lemondesteak`.
2. Sửa cấu hình trong `src/main/resources/application.yml` hoặc dùng biến môi trường:

```bash
export DB_URL=jdbc:postgresql://localhost:5432/lemondesteak
export DB_USERNAME=postgres
export DB_PASSWORD=postgres
export JWT_SECRET=your-very-long-secret-key
```

3. Chạy:

```bash
mvn spring-boot:run
```

Flyway sẽ tự tạo bảng theo CSDL đã gửi trong file `1.txt`.


## Dùng với Supabase

Project này dùng PostgreSQL nên chạy được với Supabase. Supabase chính là Postgres managed database.

### 1. Lấy thông tin kết nối

Vào Supabase Dashboard của project LemondeSteak > **Connect** > chọn **JDBC**.

Nên dùng một trong hai kiểu:

- **Direct connection** nếu máy/hosting hỗ trợ IPv6 hoặc project có IPv4 add-on.
- **Session Pooler** nếu chạy local hoặc mạng chỉ IPv4. Đây thường là cách dễ chạy hơn trên máy cá nhân.

Không nên dùng **Transaction Pooler** cho Spring Boot/JPA nếu không cấu hình thêm, vì transaction mode không hỗ trợ prepared statements ổn định cho Hibernate.

### 2. Chạy bằng profile Supabase

Windows PowerShell:

```powershell
$env:SPRING_PROFILES_ACTIVE="supabase"
$env:DB_URL="jdbc:postgresql://aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require&currentSchema=public"
$env:DB_USERNAME="postgres.<PROJECT_REF>"
$env:DB_PASSWORD="<DATABASE_PASSWORD>"
$env:JWT_SECRET="lemondesteak-change-this-to-a-long-random-secret-key-at-least-32-chars"
$env:FLYWAY_ENABLED="false"
mvn spring-boot:run
```

Mac/Linux:

```bash
export SPRING_PROFILES_ACTIVE=supabase
export DB_URL='jdbc:postgresql://aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require&currentSchema=public'
export DB_USERNAME='postgres.<PROJECT_REF>'
export DB_PASSWORD='<DATABASE_PASSWORD>'
export JWT_SECRET='lemondesteak-change-this-to-a-long-random-secret-key-at-least-32-chars'
export FLYWAY_ENABLED=false
mvn spring-boot:run
```

Nếu Supabase của bạn chưa có bảng, đổi `FLYWAY_ENABLED=true` ở lần chạy đầu để tạo bảng theo migration `V1__init_lemondesteak_schema.sql`. Nếu bạn đã import schema `1.txt` rồi thì giữ `FLYWAY_ENABLED=false`.

### 3. File đã chuẩn bị sẵn

- `src/main/resources/application-supabase.yml`
- `.env.supabase.example`

## API chính

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/menu/categories`
- `GET /api/menu/items?keyword=bo`
- `GET /api/menu/combos`
- `GET /api/promotions/available?customerId=...`
- `POST /api/orders`
- `GET /api/orders/table/{tableId}/current`
- `GET /api/orders/customer/{customerId}/history`
- `PATCH /api/orders/details/{orderDetailId}/status?status=DONE`
- `POST /api/orders/{orderId}/request-payment`
- `POST /api/orders/{orderId}/pay`

## Ví dụ tạo đơn

```json
{
  "tableId": "table-id",
  "customerId": "customer-id",
  "userId": "user-id",
  "promotionId": "promotion-id",
  "customerNotes": "Ít cay",
  "items": [
    { "itemId": "item-id", "quantity": 2 }
  ],
  "combos": [
    { "comboId": "combo-id", "quantity": 1 }
  ]
}
```


## Phân quyền role

Backend đã chia 3 role đúng theo bài:

- `CUSTOMER`: khách hàng, đăng ký mặc định vào role này, được tạo đơn và xem lịch sử đơn của khách.
- `STAFF`: nhân viên, được quản lý bàn, xem đơn theo bàn, cập nhật trạng thái món, yêu cầu thanh toán và thanh toán hóa đơn.
- `ADMIN`: quản trị viên, có toàn quyền phần nhân viên và được quản lý tài khoản qua `/api/admin/users`.

Khi đăng nhập, JWT có claim `role`. Spring Security nạp quyền dạng `ROLE_CUSTOMER`, `ROLE_STAFF`, `ROLE_ADMIN` và chặn API bằng `@PreAuthorize`.

Ví dụ nâng một tài khoản thành admin/staff trong Supabase SQL Editor:

```sql
update users set role = 'ADMIN' where phone = '09xxxxxxxx';
update users set role = 'STAFF' where phone = '09yyyyyyyy';
```

API quản lý user chỉ ADMIN gọi được:

```http
GET /api/admin/users
POST /api/admin/users
PATCH /api/admin/users/{id}/role?role=STAFF
PATCH /api/admin/users/{id}/active?active=false
```
