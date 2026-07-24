import { History, Home, ReceiptText, ShoppingCart, User } from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab, cartCount }) {
  const navItems = [
    ['menu', 'Món ăn', Home],
    ['current', 'Đơn hiện tại', ReceiptText],
    ['history', 'Lịch sử', History],
    ['user', 'Người dùng', User]
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map(([key, label, Icon]) => (
        <button
          key={key}
          className={activeTab === key ? 'active' : ''}
          onClick={() => setActiveTab(key)}
        >
          <Icon size={19} />
          <span>{label}</span>
        </button>
      ))}

      <button className="cart-nav">
        <ShoppingCart size={21} />
        <span>{cartCount} món</span>
      </button>
    </nav>
  );
}
