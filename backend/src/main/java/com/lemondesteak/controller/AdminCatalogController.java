package com.lemondesteak.controller;

import com.lemondesteak.dto.CategoryResponse;
import com.lemondesteak.dto.ComboResponse;
import com.lemondesteak.dto.ItemResponse;
import com.lemondesteak.dto.PromotionResponse;
import com.lemondesteak.entity.Category;
import com.lemondesteak.entity.Combo;
import com.lemondesteak.entity.Item;
import com.lemondesteak.entity.Promotion;
import com.lemondesteak.exception.NotFoundException;
import com.lemondesteak.repository.CategoryRepository;
import com.lemondesteak.repository.ComboRepository;
import com.lemondesteak.repository.ItemRepository;
import com.lemondesteak.repository.PromotionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/catalog")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminCatalogController {
    private final CategoryRepository categoryRepository;
    private final ItemRepository itemRepository;
    private final ComboRepository comboRepository;
    private final PromotionRepository promotionRepository;

    @GetMapping("/categories")
    public List<CategoryResponse> categories() {
        return categoryRepository.findAll().stream()
                .sorted((a, b) -> {
                    int s = Integer.compare(value(a.getSortOrder()), value(b.getSortOrder()));
                    return s != 0 ? s : safe(a.getCategoryName()).compareToIgnoreCase(safe(b.getCategoryName()));
                })
                .map(c -> new CategoryResponse(c.getId(), c.getCategoryName(), c.getDescription(), c.getImage(), c.getSortOrder()))
                .toList();
    }

    @PostMapping("/categories")
    @Transactional
    public CategoryResponse createCategory(@RequestBody Map<String, Object> body) {
        Category c = new Category();
        applyCategory(c, body);
        return toCategoryResponse(categoryRepository.save(c));
    }

    @PutMapping("/categories/{id}")
    @Transactional
    public CategoryResponse updateCategory(@PathVariable String id, @RequestBody Map<String, Object> body) {
        Category c = categoryRepository.findById(id).orElseThrow(() -> new NotFoundException("Không tìm thấy danh mục"));
        applyCategory(c, body);
        return toCategoryResponse(categoryRepository.save(c));
    }

    @DeleteMapping("/categories/{id}")
    @Transactional
    public Map<String, Object> deleteCategory(@PathVariable String id) {
        Category c = categoryRepository.findById(id).orElseThrow(() -> new NotFoundException("Không tìm thấy danh mục"));
        c.setIsActive(false);
        categoryRepository.save(c);
        return Map.of("success", true);
    }

    @GetMapping("/items")
    public List<ItemResponse> items() {
        return itemRepository.findAll().stream()
                .sorted((a, b) -> {
                    int s = Integer.compare(value(a.getSortOrder()), value(b.getSortOrder()));
                    return s != 0 ? s : safe(a.getName()).compareToIgnoreCase(safe(b.getName()));
                })
                .map(this::toItemResponse)
                .toList();
    }

    @PostMapping("/items")
    @Transactional
    public ItemResponse createItem(@RequestBody Map<String, Object> body) {
        Item item = new Item();
        applyItem(item, body);
        return toItemResponse(itemRepository.save(item));
    }

    @PutMapping("/items/{id}")
    @Transactional
    public ItemResponse updateItem(@PathVariable String id, @RequestBody Map<String, Object> body) {
        Item item = itemRepository.findById(id).orElseThrow(() -> new NotFoundException("Không tìm thấy món ăn"));
        applyItem(item, body);
        return toItemResponse(itemRepository.save(item));
    }

    @DeleteMapping("/items/{id}")
    @Transactional
    public Map<String, Object> deleteItem(@PathVariable String id) {
        Item item = itemRepository.findById(id).orElseThrow(() -> new NotFoundException("Không tìm thấy món ăn"));
        item.setIsActive(false);
        itemRepository.save(item);
        return Map.of("success", true);
    }

    @GetMapping("/combos")
    public List<ComboResponse> combos() {
        return comboRepository.findAll().stream()
                .sorted((a, b) -> safe(a.getName()).compareToIgnoreCase(safe(b.getName())))
                .map(c -> new ComboResponse(c.getId(), c.getName(), c.getDescription(), c.getPrice(), c.getImage()))
                .toList();
    }

    @PostMapping("/combos")
    @Transactional
    public ComboResponse createCombo(@RequestBody Map<String, Object> body) {
        Combo combo = new Combo();
        applyCombo(combo, body);
        return toComboResponse(comboRepository.save(combo));
    }

    @PutMapping("/combos/{id}")
    @Transactional
    public ComboResponse updateCombo(@PathVariable String id, @RequestBody Map<String, Object> body) {
        Combo combo = comboRepository.findById(id).orElseThrow(() -> new NotFoundException("Không tìm thấy combo"));
        applyCombo(combo, body);
        return toComboResponse(comboRepository.save(combo));
    }

    @DeleteMapping("/combos/{id}")
    @Transactional
    public Map<String, Object> deleteCombo(@PathVariable String id) {
        Combo combo = comboRepository.findById(id).orElseThrow(() -> new NotFoundException("Không tìm thấy combo"));
        combo.setIsActive(false);
        comboRepository.save(combo);
        return Map.of("success", true);
    }

    @GetMapping("/promotions")
    public List<PromotionResponse> promotions() {
        return promotionRepository.findAll().stream()
                .sorted((a, b) -> a.getEndDate().compareTo(b.getEndDate()))
                .map(this::toPromotionResponse)
                .toList();
    }

    @PostMapping("/promotions")
    @Transactional
    public PromotionResponse createPromotion(@RequestBody Map<String, Object> body) {
        Promotion promotion = new Promotion();
        applyPromotion(promotion, body);
        return toPromotionResponse(promotionRepository.save(promotion));
    }

    @PutMapping("/promotions/{id}")
    @Transactional
    public PromotionResponse updatePromotion(@PathVariable String id, @RequestBody Map<String, Object> body) {
        Promotion promotion = promotionRepository.findById(id).orElseThrow(() -> new NotFoundException("Không tìm thấy khuyến mãi"));
        applyPromotion(promotion, body);
        return toPromotionResponse(promotionRepository.save(promotion));
    }

    @DeleteMapping("/promotions/{id}")
    @Transactional
    public Map<String, Object> deletePromotion(@PathVariable String id) {
        Promotion promotion = promotionRepository.findById(id).orElseThrow(() -> new NotFoundException("Không tìm thấy khuyến mãi"));
        promotion.setIsActive(false);
        promotionRepository.save(promotion);
        return Map.of("success", true);
    }

    private void applyCategory(Category c, Map<String, Object> body) {
        c.setCategoryName(str(body, "categoryName", c.getCategoryName()));
        c.setDescription(strNullable(body, "description", c.getDescription()));
        c.setImage(strNullable(body, "image", c.getImage()));
        c.setSortOrder(integer(body, "sortOrder", c.getSortOrder() == null ? 0 : c.getSortOrder()));
        c.setIsActive(bool(body, "isActive", c.getIsActive() == null || c.getIsActive()));
    }

    private void applyItem(Item item, Map<String, Object> body) {
        item.setName(str(body, "name", item.getName()));
        item.setDescription(strNullable(body, "description", item.getDescription()));
        item.setPrice(decimal(body, "price", item.getPrice()));
        item.setImage(strNullable(body, "image", item.getImage()));
        item.setIsAvailable(bool(body, "isAvailable", item.getIsAvailable() == null || item.getIsAvailable()));
        item.setIsActive(bool(body, "isActive", item.getIsActive() == null || item.getIsActive()));
        item.setSortOrder(integer(body, "sortOrder", item.getSortOrder() == null ? 0 : item.getSortOrder()));
        String categoryId = strNullable(body, "categoryId", item.getCategory() == null ? null : item.getCategory().getId());
        if (categoryId != null && !categoryId.isBlank()) {
            item.setCategory(categoryRepository.findById(categoryId).orElseThrow(() -> new NotFoundException("Không tìm thấy danh mục")));
        } else {
            item.setCategory(null);
        }
    }

    private void applyCombo(Combo combo, Map<String, Object> body) {
        combo.setName(str(body, "name", combo.getName()));
        combo.setDescription(strNullable(body, "description", combo.getDescription()));
        combo.setPrice(decimal(body, "price", combo.getPrice()));
        combo.setImage(strNullable(body, "image", combo.getImage()));
        combo.setIsActive(bool(body, "isActive", combo.getIsActive() == null || combo.getIsActive()));
    }

    private void applyPromotion(Promotion p, Map<String, Object> body) {
        p.setName(str(body, "name", p.getName()));
        p.setType(str(body, "type", p.getType() == null ? "PERCENT" : p.getType()));
        p.setValue(decimal(body, "value", p.getValue()));
        p.setMinOrderAmount(decimal(body, "minOrderAmount", p.getMinOrderAmount()));
        p.setMaxDiscount(decimalNullable(body, "maxDiscount", p.getMaxDiscount()));
        p.setDescription(strNullable(body, "description", p.getDescription()));
        p.setStartDate(date(body, "startDate", p.getStartDate() == null ? OffsetDateTime.now() : p.getStartDate()));
        p.setEndDate(date(body, "endDate", p.getEndDate() == null ? OffsetDateTime.now().plusDays(30) : p.getEndDate()));
        p.setUsageLimit(integerNullable(body, "usageLimit", p.getUsageLimit()));
        p.setUsedCount(integer(body, "usedCount", p.getUsedCount() == null ? 0 : p.getUsedCount()));
        p.setIsActive(bool(body, "isActive", p.getIsActive() == null || p.getIsActive()));
    }

    private CategoryResponse toCategoryResponse(Category c) {
        return new CategoryResponse(c.getId(), c.getCategoryName(), c.getDescription(), c.getImage(), c.getSortOrder());
    }

    private ItemResponse toItemResponse(Item i) {
        Category c = i.getCategory();
        return new ItemResponse(i.getId(), i.getName(), i.getDescription(), i.getPrice(), i.getImage(), i.getIsAvailable(),
                c == null ? null : c.getId(), c == null ? null : c.getCategoryName());
    }

    private ComboResponse toComboResponse(Combo c) {
        return new ComboResponse(c.getId(), c.getName(), c.getDescription(), c.getPrice(), c.getImage());
    }

    private PromotionResponse toPromotionResponse(Promotion p) {
        return new PromotionResponse(p.getId(), p.getName(), p.getType(), p.getValue(), p.getMinOrderAmount(), p.getMaxDiscount(),
                p.getDescription(), p.getStartDate(), p.getEndDate(), p.getUsageLimit(), p.getUsedCount());
    }

    private String str(Map<String, Object> body, String key, String fallback) {
        String value = strNullable(body, key, fallback);
        return value == null ? "" : value;
    }

    private String strNullable(Map<String, Object> body, String key, String fallback) {
        if (!body.containsKey(key)) return fallback;
        Object v = body.get(key);
        if (v == null) return null;
        String s = String.valueOf(v).trim();
        return s.isBlank() ? null : s;
    }

    private BigDecimal decimal(Map<String, Object> body, String key, BigDecimal fallback) {
        BigDecimal d = decimalNullable(body, key, fallback);
        return d == null ? BigDecimal.ZERO : d;
    }

    private BigDecimal decimalNullable(Map<String, Object> body, String key, BigDecimal fallback) {
        String s = strNullable(body, key, null);
        if (s == null) return fallback;
        return new BigDecimal(s);
    }

    private Integer integer(Map<String, Object> body, String key, Integer fallback) {
        Integer i = integerNullable(body, key, fallback);
        return i == null ? 0 : i;
    }

    private Integer integerNullable(Map<String, Object> body, String key, Integer fallback) {
        String s = strNullable(body, key, null);
        if (s == null) return fallback;
        return Integer.parseInt(s);
    }

    private boolean bool(Map<String, Object> body, String key, boolean fallback) {
        if (!body.containsKey(key)) return fallback;
        Object v = body.get(key);
        if (v == null) return false;
        if (v instanceof Boolean b) return b;
        return Boolean.parseBoolean(String.valueOf(v));
    }

    private OffsetDateTime date(Map<String, Object> body, String key, OffsetDateTime fallback) {
        String s = strNullable(body, key, null);
        if (s == null) return fallback;
        if (s.length() == 10) return OffsetDateTime.parse(s + "T00:00:00+07:00");
        return OffsetDateTime.parse(s);
    }

    private int value(Integer number) {
        return number == null ? 0 : number;
    }

    private String safe(String s) {
        return s == null ? "" : s;
    }
}
