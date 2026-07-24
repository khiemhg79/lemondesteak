import { ShoppingCart } from 'lucide-react';
import { money } from '../../utils/format.js';
import './cart.css';

export default function FloatingCart({ cartCount, total, onClick }) {
  return (
    <button className="cart-floating" type="button" onClick={onClick}>
      <span>
        <ShoppingCart size={21} />
        {cartCount > 0 && <i>{cartCount}</i>}
      </span>

      <b>{money(total)}</b>
    </button>
  );
}