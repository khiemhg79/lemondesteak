import { Search, X } from 'lucide-react';

export default function MenuSearch({ keyword, setKeyword, onSearch, onClear }) {
  return (
    <form className="search-card" onSubmit={onSearch}>
      <Search size={19} />

      <input
        value={keyword}
        onChange={(event) => setKeyword(event.target.value)}
        placeholder="Tìm kiếm món ăn..."
        autoComplete="off"
      />

      {keyword.trim() && (
        <button className="search-clear" type="button" onClick={onClear}>
          <X size={15} />
        </button>
      )}

      <button className="search-submit" type="submit">
        Tìm
      </button>
    </form>
  );
}