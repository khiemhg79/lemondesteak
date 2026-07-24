const tabs = [
  ['reports', 'Thống kê'],
  ['users', 'Người dùng'],
  ['items', 'Món ăn'],
  ['categories', 'Danh mục'],
  ['combos', 'Combo'],
  ['promos', 'Khuyến mãi'],
  ['tables', 'Bàn']
];

export default function AdminTabs({ tab, setTab }) {
  return (
    <div className="tabs">
      {tabs.map(([key, label]) => (
        <button key={key} className={`tab ${tab === key ? 'active' : ''}`} onClick={() => setTab(key)}>
          {label}
        </button>
      ))}
    </div>
  );
}
