export function cleanSearchKeyword(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

export function normalizeText(value) {
  return cleanSearchKeyword(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function isSelling(food) {
  if (!food) return false;

  const active = food.isActive ?? food.active ?? true;
  const available = food.isAvailable ?? food.available ?? true;

  return active !== false && available !== false;
}

function getFoodSearchText(food) {
  return {
    name: normalizeText(food.name),
    description: normalizeText(food.description),
    rawName: String(food.name || '')
  };
}

function getSearchPriority(food, keyword) {
  const searchValue = normalizeText(keyword);

  if (!searchValue) return 0;

  const { name, description } = getFoodSearchText(food);

  if (name === searchValue) return 1;
  if (name.startsWith(searchValue)) return 2;
  if (name.includes(searchValue)) return 3;
  if (description.includes(searchValue)) return 4;

  return 999;
}

function sortBySearchPriority(list, keyword) {
  const searchValue = normalizeText(keyword);

  if (!searchValue) {
    return [...list].sort((a, b) => {
      const sortA = Number(a.sortOrder ?? 0);
      const sortB = Number(b.sortOrder ?? 0);

      if (sortA !== sortB) return sortA - sortB;

      return String(a.name || '').localeCompare(String(b.name || ''), 'vi');
    });
  }

  return list
    .map((food, index) => ({
      food,
      index,
      priority: getSearchPriority(food, searchValue)
    }))
    .filter((entry) => entry.priority < 999)
    .sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.index - b.index;
    })
    .map((entry) => entry.food);
}

export function filterMenuByKeywordAndCategory(items = [], keyword = '', categoryId = '') {
  const filteredByStatusAndCategory = items.filter((item) => {
    const matchStatus = isSelling(item);
    const matchCategory = categoryId ? item.categoryId === categoryId : true;

    return matchStatus && matchCategory;
  });

  return sortBySearchPriority(filteredByStatusAndCategory, keyword);
}

export function filterCombosByKeyword(combos = [], keyword = '') {
  const sellingCombos = combos.filter(isSelling);

  return sortBySearchPriority(sellingCombos, keyword);
}