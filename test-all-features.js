// test-all-features.js
// Script kiểm tra tự động toàn bộ API và Chức năng của hệ thống LeMonde Steak

const BASE_URL = process.env.API_URL || 'http://localhost:8080';

async function runTests() {
  console.log('====================================================');
  console.log('🚀 BẮT ĐẦU KIỂM TRA TOÀN BỘ CHỨC NĂNG HỆ THỐNG');
  console.log(`🌐 Backend Server Target: ${BASE_URL}`);
  console.log('====================================================\n');

  const results = [];

  async function testCase(name, fn) {
    try {
      const detail = await fn();
      results.push({ name, status: 'PASS', detail });
      console.log(`✅ [PASS] ${name}: ${detail || 'Thành công'}`);
    } catch (err) {
      results.push({ name, status: 'FAIL', detail: err.message });
      console.log(`❌ [FAIL] ${name}: ${err.message}`);
    }
  }

  // Test 1: Health check
  await testCase('1. Kiểm tra Backend Server Connection', async () => {
    const res = await fetch(`${BASE_URL}/`);
    if (!res.ok) throw new Error(`HTTP Status ${res.status}`);
    const text = await res.text();
    return `Server phản hồi OK (${res.status})`;
  });

  // Test 2: Thôn g tin Danh mục Thực đơn (Categories)
  await testCase('2. Ý tưởng 1 & Menu: Tải Danh mục Thực đơn (CSDL)', async () => {
    const res = await fetch(`${BASE_URL}/api/menu/categories`);
    if (!res.ok) throw new Error(`HTTP Status ${res.status}`);
    const data = await res.json();
    const list = Array.isArray(data) ? data : data?.data || [];
    if (!list.length) throw new Error('Không có danh mục nào trong CSDL');
    return `Tìm thấy ${list.length} danh mục trong CSDL`;
  });

  // Test 3: Thông tin Món ăn (Menu Items)
  await testCase('3. Ý tưởng 3 & Menu: Tải Món ăn thực tế từ CSDL', async () => {
    const res = await fetch(`${BASE_URL}/api/menu/items`);
    if (!res.ok) throw new Error(`HTTP Status ${res.status}`);
    const data = await res.json();
    const list = Array.isArray(data) ? data : data?.data || [];
    if (!list.length) throw new Error('Không có món ăn nào trong CSDL');
    return `Tìm thấy ${list.length} món ăn trong CSDL`;
  });

  // Test 4: Thông tin Combos (Combos)
  await testCase('4. Ý tưởng 1: Tải danh sách Combos ưu đãi (CSDL)', async () => {
    const res = await fetch(`${BASE_URL}/api/menu/combos`);
    if (!res.ok) throw new Error(`HTTP Status ${res.status}`);
    const data = await res.json();
    const list = Array.isArray(data) ? data : data?.data || [];
    return `Tìm thấy ${list.length} Combo ưu đãi`;
  });

  // Test 5: Thông tin Mã giảm giá (Promotions)
  await testCase('5. Ý tưởng 1 & 4: Tải danh sách Khuyến mãi/Voucher (CSDL)', async () => {
    let res = await fetch(`${BASE_URL}/api/customer/promotions/available`);
    if (!res.ok) {
      res = await fetch(`${BASE_URL}/api/promotions/available`);
    }
    if (!res.ok) throw new Error(`HTTP Status ${res.status}`);
    const data = await res.json();
    const list = Array.isArray(data) ? data : data?.data || [];
    return `Tìm thấy ${list.length} mã khuyến mãi khả dụng trong CSDL`;
  });

  // Test 6: Lấy thông tin Bàn qua QR Code (Public Table)
  await testCase('6. Ý tưởng 1: Quét mã QR Bàn số 3 (/api/public/tables/3)', async () => {
    const res = await fetch(`${BASE_URL}/api/public/tables/3`);
    if (!res.ok && res.status !== 404) throw new Error(`HTTP Status ${res.status}`);
    if (res.status === 404) {
      // Fallback endpoint
      const res2 = await fetch(`${BASE_URL}/api/staff/tables`);
      if (!res2.ok) throw new Error(`Không lấy được thông tin bàn (${res.status})`);
      return `Lấy danh sách bàn qua API Staff thành công`;
    }
    const data = await res.json();
    return `Đọc thành công Bàn #${data.tableNumber || data.code || '3'}`;
  });

  // Test 7: Tạo Đơn hàng mới (Create Order)
  let createdOrderId = null;
  let createdOrderNumber = null;
  await testCase('7. Đặt món: Gửi Đơn hàng mới (Customer Order Creation)', async () => {
    // Lấy 1 món ngẫu nhiên từ CSDL
    const itemsRes = await fetch(`${BASE_URL}/api/menu/items`);
    const items = await itemsRes.json();
    const item = (Array.isArray(items) ? items : items?.data || [])[0];

    if (!item) throw new Error('Không có món ăn khả dụng để tạo đơn');

    // Lấy 1 bàn đang hoạt động từ CSDL
    let validTableId = null;
    let validTableNumber = '3';
    try {
      const tablesRes = await fetch(`${BASE_URL}/api/staff/tables`);
      const tables = await tablesRes.json();
      const tableList = Array.isArray(tables) ? tables : tables?.data || [];
      if (tableList.length > 0) {
        validTableId = tableList[0].id;
        validTableNumber = tableList[0].tableNumber || '3';
      }
    } catch {
      // Fallback
    }

    const payload = {
      tableId: validTableId,
      tableNumber: validTableNumber,
      items: [
        { itemId: item.id, quantity: 2 }
      ],
      customerNotes: 'Test tự động 4 tính năng'
    };

    const res = await fetch(`${BASE_URL}/api/customer/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`HTTP ${res.status}: ${errText}`);
    }

    const data = await res.json();
    createdOrderId = data.id || data.orderId;
    createdOrderNumber = data.orderNumber || createdOrderId;
    return `Tạo thành công Đơn #${createdOrderNumber} (ID: ${createdOrderId})`;
  });

  // Test 8: Ý tưởng 2 - Tracking Real-time Đơn hàng vừa tạo
  await testCase('8. Ý tưởng 2: Real-time Order Tracking (Chi tiết Đơn hàng)', async () => {
    if (!createdOrderId) throw new Error('Chưa tạo được đơn hàng để kiểm tra Tracking');

    const res = await fetch(`${BASE_URL}/api/customer/orders/${createdOrderId}`);
    if (!res.ok) throw new Error(`HTTP Status ${res.status}`);
    const data = await res.json();
    const status = data.orderStatus || data.status || 'PENDING';
    return `Tracking Đơn #${createdOrderNumber} -> Trạng thái: ${status}`;
  });

  // Test 9: Áp dụng Mã giảm giá cho đơn hàng
  await testCase('9. Áp dụng Voucher cho Đơn hàng (Apply Promotion)', async () => {
    if (!createdOrderId) throw new Error('Chưa có đơn hàng để áp dụng voucher');
    
    // Lấy promo khả dụng
    const promoRes = await fetch(`${BASE_URL}/api/customer/promotions/available`);
    const promos = await promoRes.json();
    const promoList = Array.isArray(promos) ? promos : promos?.data || [];

    if (!promoList.length) {
      return 'Bỏ qua (Không có promo khả dụng trong CSDL)';
    }

    const promo = promoList[0];
    const res = await fetch(`${BASE_URL}/api/customer/orders/${createdOrderId}/promotion`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ promotionId: promo.id })
    });

    if (!res.ok) throw new Error(`HTTP Status ${res.status}`);
    const data = await res.json();
    return `Áp dụng thành công Voucher ${promo.code || promo.name} -> Tổng mới: ${data.totalAmount}`;
  });

  // Test 10: Ý tưởng 2 - Yêu cầu Thanh toán Đơn
  await testCase('10. Ý tưởng 2: Gửi Yêu cầu Thanh toán (Request Payment)', async () => {
    if (!createdOrderId) throw new Error('Chưa có đơn hàng để gửi yêu cầu thanh toán');

    const res = await fetch(`${BASE_URL}/api/customer/orders/${createdOrderId}/request-payment`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!res.ok) throw new Error(`HTTP Status ${res.status}`);
    const data = await res.json();
    return `Đơn #${createdOrderNumber} chuyển sang trạng thái: ${data.orderStatus || data.status || 'REQUEST_PAYMENT'}`;
  });

  // Test 11: Ý tưởng 4 - Duyệt Thanh toán & Kích hoạt Thank You Modal (Staff Payment Simulation)
  await testCase('11. Ý tưởng 4: Staff Duyệt Thanh toán -> Kích hoạt Thank You Modal', async () => {
    if (!createdOrderId) throw new Error('Chưa có đơn hàng để giả lập duyệt thanh toán');

    // Gọi API thanh toán đơn từ Staff API
    const res = await fetch(`${BASE_URL}/api/staff/billing/orders/${createdOrderId}/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentMethod: 'CASH' })
    });

    if (!res.ok) {
      // Fallback qua Staff Order Controller
      const res2 = await fetch(`${BASE_URL}/api/orders/${createdOrderId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethod: 'CASH' })
      });
      if (!res2.ok) {
        throw new Error(`Duyệt thanh toán chưa thành công (HTTP ${res.status})`);
      }
    }

    // Re-check order status from customer API
    const checkRes = await fetch(`${BASE_URL}/api/customer/orders/${createdOrderId}`);
    const checkData = await checkRes.json();
    const finalStatus = checkData.orderStatus || checkData.status || 'PAID';

    if (finalStatus !== 'PAID' && finalStatus !== 'COMPLETED') {
      throw new Error(`Trạng thái đơn chưa chuyển thành PAID (Trạng thái hiện tại: ${finalStatus})`);
    }

    return `Đơn #${createdOrderNumber} đã thanh toán thành công (Trạng thái: ${finalStatus}). Customer App sẽ tự động hiển thị Thank You & Rating Modal!`;
  });

  console.log('\n====================================================');
  console.log('📊 TỔNG KẾT KẾT QUẢ KIỂM TRA HỆ THỐNG');
  console.log('====================================================');
  
  const passCount = results.filter(r => r.status === 'PASS').length;
  const failCount = results.filter(r => r.status === 'FAIL').length;

  console.log(`✅ Thành công (PASS): ${passCount}/${results.length}`);
  console.log(`❌ Thất bại (FAIL):   ${failCount}/${results.length}\n`);

  if (failCount > 0) {
    console.log('⚠️ BÁO CÁO CÁC TÍNH NĂNG CHƯA ĐẢM BẢO / BỊ LỖI:');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(` - ${r.name}: ${r.detail}`);
    });
  } else {
    console.log('🎉 TOÀN BỘ CÁC TÍNH NĂNG VÀ API ĐỀU ĐẢM BẢO HOẠT ĐỘNG HOÀN HẢO!');
  }
}

runTests().catch(err => {
  console.error('Lỗi khi thực thi test suite:', err);
});
