import { useState } from 'react';
import { Search } from 'lucide-react';

import TableCard from '../components/menu/TableCard.jsx';
import MenuSearch from '../components/menu/MenuSearch.jsx';
import CategoryTabs from '../components/menu/CategoryTabs.jsx';
import FoodCard from '../components/menu/FoodCard.jsx';
import FoodDetailModal from '../components/menu/FoodDetailModal.jsx';

import { cleanSearchKeyword } from '../utils/search.js';

export default function MenuPage({
  table,
  auth,
  keyword,
  setKeyword,
  runSearch,
  clearSearch,
  categories,
  categoryId,
  setCategoryId,
  visibleItems,
  visibleCombos,
  menuLoading,
  add
}) {
  const [detailItem, setDetailItem] = useState(null);

  const cleanKeyword = cleanSearchKeyword(keyword);
  const totalResult = visibleItems.length + visibleCombos.length;
  const hasSearch = Boolean(cleanKeyword);

  const openDetail = (item) => {
    setDetailItem(item);
  };

  const closeDetail = () => {
    setDetailItem(null);
  };

  return (
    <>
      <TableCard {...table} auth={auth} />

      <MenuSearch
        keyword={keyword}
        setKeyword={setKeyword}
        onSearch={runSearch}
        onClear={clearSearch}
      />

      <CategoryTabs
        categories={categories}
        categoryId={categoryId}
        setCategoryId={setCategoryId}
      />

      <section className="search-result-bar">
        {hasSearch ? (
          <span>
            Từ khóa: <b>{cleanKeyword}</b> · Tìm thấy <b>{totalResult}</b> món
          </span>
        ) : categoryId ? (
          <span>Đang hiển thị món ăn theo danh mục đã chọn.</span>
        ) : (
          <span>Nhập tên món hoặc chọn danh mục để tìm kiếm món ăn.</span>
        )}
      </section>

      <main className="food-list">
        {menuLoading ? (
          <div className="empty">
            <Search size={34} />
            <p>Đang tải thực đơn...</p>
          </div>
        ) : totalResult > 0 ? (
          <>
            {visibleItems.map((item) => (
              <FoodCard
                key={item.id}
                item={item}
                onAdd={add}
                onViewDetail={openDetail}
              />
            ))}

            {!!visibleCombos.length && (
              <>
                <h2 className="section-title">Combo</h2>

                {visibleCombos.map((combo) => (
                  <FoodCard
                    key={combo.id}
                    item={{
                      ...combo,
                      type: 'combo'
                    }}
                    onAdd={add}
                    onViewDetail={openDetail}
                  />
                ))}
              </>
            )}
          </>
        ) : (
          <div className="empty">
            <Search size={38} />

            <h3>Không có món ăn phù hợp</h3>

            <p>
              {hasSearch
                ? `Không có món ăn trùng khớp với từ khóa “${cleanKeyword}”.`
                : 'Không có món ăn trong danh mục này.'}
            </p>

            <button className="btn" type="button" onClick={clearSearch}>
              Xóa tìm kiếm
            </button>
          </div>
        )}
      </main>

      <FoodDetailModal
        open={Boolean(detailItem)}
        item={detailItem}
        onClose={closeDetail}
        onAdd={add}
      />
    </>
  );
}