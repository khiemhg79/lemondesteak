export function money(value) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value || 0));
}

export function clean(obj) {
  return Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, value === '' ? null : value]));
}
