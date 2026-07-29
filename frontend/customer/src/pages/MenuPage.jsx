import { useState, useEffect, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, RefreshCw, Layers } from 'lucide-react';

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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(4); // Default 4 items per page for clear pagination
  const [visibleCount, setVisibleCount] = useState(6);
  const [mode, setMode] = useState('PAGINATION'); // 'PAGINATION' | 'INFINITE'

  const cleanKeyword = cleanSearchKeyword(keyword);

  // Combine items & combos for unified pagination / infinite scroll
  const allList = useMemo(() => {
    const list = [...visibleItems.map(i => ({ ...i, isCombo: false }))];
    if (Array.isArray(visibleCombos)) {
      list.push(...visibleCombos.map(c => ({ ...c, type: 'combo', isCombo: true })));
    }
    return list;
  }, [visibleItems, visibleCombos]);

  const totalResult = allList.length;
  const totalPages = Math.ceil(totalResult / itemsPerPage) || 1;
  const hasSearch = Boolean(cleanKeyword);

  // Reset page when category or search or itemsPerPage changes
  useEffect(() => {
    setCurrentPage(1);
    setVisibleCount(itemsPerPage);
  }, [categoryId, keyword, itemsPerPage]);

  // Infinite Scroll Listener
  useEffect(() => {
    if (mode !== 'INFINITE') return;

    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 180) {
        setVisibleCount((prev) => Math.min(prev + 4, totalResult));
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [mode, totalResult]);

  const openDetail = (item) => {
    setDetailItem(item);
  };

  const closeDetail = () => {
    setDetailItem(null);
  };

  // Items to display depending on mode
  const currentDisplayedItems = useMemo(() => {
    if (mode === 'INFINITE') {
      return allList.slice(0, visibleCount);
    }
    const start = (currentPage - 1) * itemsPerPage;
    return allList.slice(start, start + itemsPerPage);
  }, [allList, mode, currentPage, visibleCount, itemsPerPage]);

  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalResult);

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

      <section className="search-result-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div>
          {hasSearch ? (
            <span>
              Từ khóa: <b>{cleanKeyword}</b> · Tìm thấy <b>{totalResult}</b> món
            </span>
          ) : categoryId ? (
            <span>Đang hiển thị <b>{totalResult}</b> món theo danh mục.</span>
          ) : (
            <span>Tổng cộng <b>{totalResult}</b> món ăn & combo.</span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Mode Toggle Button */}
          <button
            type="button"
            onClick={() => setMode(mode === 'PAGINATION' ? 'INFINITE' : 'PAGINATION')}
            style={{
              background: mode === 'INFINITE' ? '#fff5f2' : '#f1f5f9',
              color: mode === 'INFINITE' ? '#e63917' : '#475569',
              border: mode === 'INFINITE' ? '1px solid #feccae' : '1px solid #cbd5e1',
              padding: '4px 10px',
              borderRadius: 999,
              fontSize: 11.5,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <Layers size={14} />
            {mode === 'PAGINATION' ? '📜 Chế độ Phân Trang' : '⚡ Chế độ Cuộn Tự Động'}
          </button>
        </div>
      </section>

      <main className="food-list">
        {menuLoading ? (
          <div className="empty">
            <Search size={34} />
            <p>Đang tải thực đơn...</p>
          </div>
        ) : totalResult > 0 ? (
          <>
            {currentDisplayedItems.map((item) => (
              <FoodCard
                key={item.id}
                item={item}
                onAdd={add}
                onViewDetail={openDetail}
              />
            ))}

            {/* Always Visible Pagination Bar */}
            {mode === 'PAGINATION' && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 10,
                  marginTop: 20,
                  padding: '16px 14px',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 18,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                  width: '100%',
                  boxSizing: 'border-box'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: 8 }}>
                  <small style={{ color: '#64748b', fontWeight: 700 }}>
                    Hiển thị {startIndex} - {endIndex} trên {totalResult} món (Trang {currentPage}/{totalPages})
                  </small>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <small style={{ color: '#475569', fontWeight: 800 }}>Hiển thị:</small>
                    {[4, 6, 8].map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setItemsPerPage(size)}
                        style={{
                          background: itemsPerPage === size ? '#e63917' : '#f1f5f9',
                          color: itemsPerPage === size ? '#fff' : '#475569',
                          border: 'none',
                          borderRadius: 6,
                          padding: '2px 8px',
                          fontSize: 11.5,
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        {size} món
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => {
                      setCurrentPage((p) => Math.max(p - 1, 1));
                      window.scrollTo({ top: 220, behavior: 'smooth' });
                    }}
                    style={{
                      background: currentPage <= 1 ? '#f1f5f9' : '#ffffff',
                      color: currentPage <= 1 ? '#cbd5e1' : '#e63917',
                      border: '1px solid #fed7aa',
                      borderRadius: 10,
                      padding: '8px 14px',
                      fontWeight: 850,
                      fontSize: 13,
                      cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <ChevronLeft size={16} /> Trang trước
                  </button>

                  <div style={{ display: 'flex', gap: 4 }}>
                    {Array.from({ length: totalPages }).map((_, pIdx) => {
                      const pageNum = pIdx + 1;
                      const isActive = pageNum === currentPage;
                      return (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => {
                            setCurrentPage(pageNum);
                            window.scrollTo({ top: 220, behavior: 'smooth' });
                          }}
                          style={{
                            background: isActive ? 'linear-gradient(135deg, #e63917 0%, #ff6624 100%)' : '#ffffff',
                            color: isActive ? '#ffffff' : '#0f172a',
                            border: isActive ? 'none' : '1px solid #cbd5e1',
                            borderRadius: 8,
                            width: 36,
                            height: 36,
                            fontWeight: 900,
                            fontSize: 13.5,
                            cursor: 'pointer',
                            boxShadow: isActive ? '0 4px 12px rgba(230,57,23,0.3)' : 'none'
                          }}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => {
                      setCurrentPage((p) => Math.min(p + 1, totalPages));
                      window.scrollTo({ top: 220, behavior: 'smooth' });
                    }}
                    style={{
                      background: currentPage >= totalPages ? '#f1f5f9' : '#ffffff',
                      color: currentPage >= totalPages ? '#cbd5e1' : '#e63917',
                      border: '1px solid #fed7aa',
                      borderRadius: 10,
                      padding: '8px 14px',
                      fontWeight: 850,
                      fontSize: 13,
                      cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    Trang sau <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Infinite Scroll Manual Load More Trigger */}
            {mode === 'INFINITE' && visibleCount < totalResult && (
              <div style={{ textAlignment: 'center', width: '100%', marginTop: 16 }}>
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => Math.min(prev + 6, totalResult))}
                  style={{
                    background: '#fff5f2',
                    color: '#e63917',
                    border: '1px solid #feccae',
                    borderRadius: 14,
                    padding: '10px 20px',
                    fontWeight: 900,
                    fontSize: 13.5,
                    cursor: 'pointer',
                    width: '100%'
                  }}
                >
                  ⚡ Tải Thêm Món Ăn ({totalResult - visibleCount} món còn lại...)
                </button>
              </div>
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