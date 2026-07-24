package com.lemondesteak.service;

import com.lemondesteak.dto.CategoryResponse;
import com.lemondesteak.dto.ComboResponse;
import com.lemondesteak.dto.ItemResponse;
import com.lemondesteak.entity.Category;
import com.lemondesteak.entity.Combo;
import com.lemondesteak.entity.Item;
import com.lemondesteak.repository.CategoryRepository;
import com.lemondesteak.repository.ComboRepository;
import com.lemondesteak.repository.ItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MenuService {
    private final CategoryRepository categoryRepository;
    private final ItemRepository itemRepository;
    private final ComboRepository comboRepository;

    public List<CategoryResponse> categories() {
        return categoryRepository.findByIsActiveTrueOrderBySortOrderAscCategoryNameAsc()
                .stream().map(this::toCategoryResponse).toList();
    }

    public List<ItemResponse> items(String categoryId, String keyword) {
        List<Item> items;
        if (categoryId != null && !categoryId.isBlank()) {
            items = itemRepository.findByCategory_IdAndIsActiveTrueAndIsAvailableTrueOrderBySortOrderAscNameAsc(categoryId);
        } else {
            items = itemRepository.searchAvailable(keyword);
        }
        return items.stream().map(this::toItemResponse).toList();
    }

    public List<ComboResponse> combos() {
        return comboRepository.findByIsActiveTrueOrderByNameAsc().stream().map(this::toComboResponse).toList();
    }

    private CategoryResponse toCategoryResponse(Category category) {
        return new CategoryResponse(category.getId(), category.getCategoryName(), category.getDescription(), category.getImage(), category.getSortOrder());
    }

    private ItemResponse toItemResponse(Item item) {
        Category c = item.getCategory();
        return new ItemResponse(
                item.getId(),
                item.getName(),
                item.getDescription(),
                item.getPrice(),
                item.getImage(),
                item.getIsAvailable(),
                c == null ? null : c.getId(),
                c == null ? null : c.getCategoryName()
        );
    }

    private ComboResponse toComboResponse(Combo combo) {
        return new ComboResponse(combo.getId(), combo.getName(), combo.getDescription(), combo.getPrice(), combo.getImage());
    }
}
