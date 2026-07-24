export default function CategoryTabs({ categories, categoryId, setCategoryId }) {
  return (
    <nav className="category-scroll">
      <button className={categoryId === '' ? 'active' : ''} onClick={() => setCategoryId('')}>
        Tất cả
      </button>

      {categories.map((category) => (
        <button
          key={category.id}
          className={categoryId === category.id ? 'active' : ''}
          onClick={() => setCategoryId(category.id)}
        >
          {category.categoryName}
        </button>
      ))}
    </nav>
  );
}
