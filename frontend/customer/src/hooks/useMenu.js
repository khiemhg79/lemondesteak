import { useState } from 'react';
import { api } from '../services/api.js';

export function useMenu(toast) {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [combos, setCombos] = useState([]);
  const [menuLoading, setMenuLoading] = useState(false);

  const loadMenu = async () => {
    setMenuLoading(true);

    try {
      const [categoryData, itemData, comboData] = await Promise.all([
        api('/api/menu/categories'),
        api('/api/menu/items'),
        api('/api/menu/combos')
      ]);

      setCategories(categoryData || []);
      setItems(itemData || []);
      setCombos(comboData || []);
    } catch (err) {
      toast(err.message || 'Không tải được thực đơn.');
    } finally {
      setMenuLoading(false);
    }
  };

  return { categories, items, combos, menuLoading, loadMenu };
}
