$ip = (Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object { $_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*" -or $_.IPAddress -like "172.*" } |
  Select-Object -First 1 -ExpandProperty IPAddress)

Write-Host "Customer web app chạy cho QR đặt món."
Write-Host "Trên máy tính: http://localhost:5173/t/<tableNumber>"
if ($ip) {
  Write-Host "Trên điện thoại cùng WiFi: http://$ip`:5173/t/<tableNumber>"
  Write-Host "Ví dụ QR cho bàn 3: http://$ip`:5173/t/3"
}

cd frontend/customer
npm install
npm run dev -- --host 0.0.0.0
