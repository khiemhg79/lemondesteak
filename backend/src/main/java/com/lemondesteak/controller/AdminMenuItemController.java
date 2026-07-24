package com.lemondesteak.controller;

import com.lemondesteak.dto.AdminComboCreateRequest;
import com.lemondesteak.dto.AdminComboItemRequest;
import com.lemondesteak.dto.AdminComboUpdateRequest;
import com.lemondesteak.dto.AdminItemCreateRequest;
import com.lemondesteak.dto.AdminItemUpdateRequest;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/menu")
@RequiredArgsConstructor
public class AdminMenuItemController {

    private final EntityManager entityManager;

    @GetMapping("/items")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public List<AdminItemResponse> getItems() {
        List<Object[]> rows = entityManager
                .createNativeQuery("""
                        select
                            i.id,
                            i.name,
                            i.description,
                            i.price,
                            i.image,
                            i."isAvailable",
                            i."sortOrder",
                            i."isActive",
                            i."createdAt",
                            i."updatedAt",
                            i."categoryId",
                            c."categoryName"
                        from items i
                        left join categories c on c.id = i."categoryId"
                        where i."isActive" = true
                        order by i."createdAt" desc, i.name
                        """)
                .getResultList();

        return rows.stream().map(this::toItemResponse).toList();
    }

    @GetMapping("/categories")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public List<AdminCategoryOptionResponse> getCategories() {
        List<Object[]> rows = entityManager
                .createNativeQuery("""
                        select
                            c.id,
                            c."categoryName",
                            c.description,
                            c."sortOrder",
                            c."isActive"
                        from categories c
                        where c."isActive" = true
                        order by c."sortOrder", c."categoryName"
                        """)
                .getResultList();

        return rows.stream()
                .map(row -> new AdminCategoryOptionResponse(
                        stringValue(row[0]),
                        stringValue(row[1]),
                        stringValue(row[2]),
                        intValue(row[3]),
                        booleanValue(row[4])
                ))
                .toList();
    }

    @PostMapping("/items")
    @Transactional
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public AdminItemResponse createItem(@RequestBody AdminItemCreateRequest request) {
        ItemData data = validateItemData(
                request.name(),
                request.price(),
                request.categoryId(),
                request.description(),
                request.image(),
                request.isAvailable()
        );

        String id = UUID.randomUUID().toString();

        entityManager
                .createNativeQuery("""
                        insert into items (
                            id,
                            name,
                            description,
                            price,
                            image,
                            "isAvailable",
                            "sortOrder",
                            "isActive",
                            "createdAt",
                            "updatedAt",
                            "categoryId"
                        )
                        values (
                            :id,
                            :name,
                            :description,
                            :price,
                            :image,
                            :isAvailable,
                            0,
                            true,
                            now(),
                            now(),
                            :categoryId
                        )
                        """)
                .setParameter("id", id)
                .setParameter("name", data.name())
                .setParameter("description", data.description())
                .setParameter("price", data.price())
                .setParameter("image", data.image())
                .setParameter("isAvailable", data.isAvailable())
                .setParameter("categoryId", data.categoryId())
                .executeUpdate();

        return findItemById(id);
    }

    @PutMapping("/items/{id}")
    @Transactional
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public AdminItemResponse updateItem(
            @PathVariable String id,
            @RequestBody AdminItemUpdateRequest request
    ) {
        findItemById(id);

        ItemData data = validateItemData(
                request.name(),
                request.price(),
                request.categoryId(),
                request.description(),
                request.image(),
                request.isAvailable()
        );

        entityManager
                .createNativeQuery("""
                        update items
                        set name = :name,
                            description = :description,
                            price = :price,
                            image = :image,
                            "isAvailable" = :isAvailable,
                            "categoryId" = :categoryId,
                            "updatedAt" = now()
                        where id = :id
                        """)
                .setParameter("id", id)
                .setParameter("name", data.name())
                .setParameter("description", data.description())
                .setParameter("price", data.price())
                .setParameter("image", data.image())
                .setParameter("isAvailable", data.isAvailable())
                .setParameter("categoryId", data.categoryId())
                .executeUpdate();

        return findItemById(id);
    }

    @DeleteMapping("/items/{id}")
    @Transactional
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public DeleteItemResponse deleteItem(@PathVariable String id) {
        findItemById(id);

        entityManager
                .createNativeQuery("""
                        update items
                        set "isActive" = false,
                            "isAvailable" = false,
                            "updatedAt" = now()
                        where id = :id
                        """)
                .setParameter("id", id)
                .executeUpdate();

        return new DeleteItemResponse(id, "Đã xóa món ăn khỏi danh sách");
    }

    @GetMapping("/combos")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public List<AdminComboResponse> getCombos() {
        List<Object[]> rows = entityManager
                .createNativeQuery("""
                        select
                            c.id,
                            c.name,
                            c.description,
                            c.price,
                            c.image,
                            c."isActive",
                            c."createdAt",
                            c."updatedAt"
                        from combos c
                        where c."isActive" = true
                        order by c."createdAt" desc, c.name
                        """)
                .getResultList();

        return rows.stream().map(this::toComboResponse).toList();
    }

    @PostMapping("/combos")
    @Transactional
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public AdminComboResponse createCombo(@RequestBody AdminComboCreateRequest request) {
        ComboData data = validateComboData(
                request.name(),
                request.price(),
                request.description(),
                request.image(),
                request.isActive(),
                request.items()
        );

        String comboId = UUID.randomUUID().toString();

        entityManager
                .createNativeQuery("""
                        insert into combos (
                            id,
                            name,
                            description,
                            price,
                            image,
                            "isActive",
                            "createdAt",
                            "updatedAt"
                        )
                        values (
                            :id,
                            :name,
                            :description,
                            :price,
                            :image,
                            :isActive,
                            now(),
                            now()
                        )
                        """)
                .setParameter("id", comboId)
                .setParameter("name", data.name())
                .setParameter("description", data.description())
                .setParameter("price", data.price())
                .setParameter("image", data.image())
                .setParameter("isActive", data.isActive())
                .executeUpdate();

        insertComboItems(comboId, data.items());

        return findComboById(comboId);
    }

    @PutMapping("/combos/{id}")
    @Transactional
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public AdminComboResponse updateCombo(
            @PathVariable String id,
            @RequestBody AdminComboUpdateRequest request
    ) {
        findComboById(id);

        ComboData data = validateComboData(
                request.name(),
                request.price(),
                request.description(),
                request.image(),
                request.isActive(),
                request.items()
        );

        entityManager
                .createNativeQuery("""
                        update combos
                        set name = :name,
                            description = :description,
                            price = :price,
                            image = :image,
                            "isActive" = :isActive,
                            "updatedAt" = now()
                        where id = :id
                        """)
                .setParameter("id", id)
                .setParameter("name", data.name())
                .setParameter("description", data.description())
                .setParameter("price", data.price())
                .setParameter("image", data.image())
                .setParameter("isActive", data.isActive())
                .executeUpdate();

        entityManager
                .createNativeQuery("""
                        delete from comboitems
                        where "comboId" = :comboId
                        """)
                .setParameter("comboId", id)
                .executeUpdate();

        insertComboItems(id, data.items());

        return findComboById(id);
    }

    @DeleteMapping("/combos/{id}")
    @Transactional
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public DeleteComboResponse deleteCombo(@PathVariable String id) {
        findComboById(id);

        entityManager
                .createNativeQuery("""
                        update combos
                        set "isActive" = false,
                            "updatedAt" = now()
                        where id = :id
                        """)
                .setParameter("id", id)
                .executeUpdate();

        return new DeleteComboResponse(id, "Đã xóa combo khỏi danh sách");
    }

    private void insertComboItems(String comboId, List<ComboItemData> items) {
        for (ComboItemData item : items) {
            entityManager
                    .createNativeQuery("""
                            insert into comboitems (
                                id,
                                "comboId",
                                "itemId",
                                quantity
                            )
                            values (
                                :id,
                                :comboId,
                                :itemId,
                                :quantity
                            )
                            """)
                    .setParameter("id", UUID.randomUUID().toString())
                    .setParameter("comboId", comboId)
                    .setParameter("itemId", item.itemId())
                    .setParameter("quantity", item.quantity())
                    .executeUpdate();
        }
    }

    private AdminItemResponse findItemById(String id) {
        List<Object[]> rows = entityManager
                .createNativeQuery("""
                        select
                            i.id,
                            i.name,
                            i.description,
                            i.price,
                            i.image,
                            i."isAvailable",
                            i."sortOrder",
                            i."isActive",
                            i."createdAt",
                            i."updatedAt",
                            i."categoryId",
                            c."categoryName"
                        from items i
                        left join categories c on c.id = i."categoryId"
                        where i.id = :id
                        limit 1
                        """)
                .setParameter("id", id)
                .getResultList();

        if (rows.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy món ăn");
        }

        return toItemResponse(rows.get(0));
    }

    private AdminComboResponse findComboById(String id) {
        List<Object[]> rows = entityManager
                .createNativeQuery("""
                        select
                            c.id,
                            c.name,
                            c.description,
                            c.price,
                            c.image,
                            c."isActive",
                            c."createdAt",
                            c."updatedAt"
                        from combos c
                        where c.id = :id
                        limit 1
                        """)
                .setParameter("id", id)
                .getResultList();

        if (rows.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy combo");
        }

        return toComboResponse(rows.get(0));
    }

    private List<AdminComboLineResponse> findComboLines(String comboId) {
        List<Object[]> rows = entityManager
                .createNativeQuery("""
                        select
                            ci.id,
                            ci."itemId",
                            i.name,
                            i.image,
                            ci.quantity,
                            i.price
                        from comboitems ci
                        join items i on i.id = ci."itemId"
                        where ci."comboId" = :comboId
                        order by i.name
                        """)
                .setParameter("comboId", comboId)
                .getResultList();

        return rows.stream()
                .map(row -> new AdminComboLineResponse(
                        stringValue(row[0]),
                        stringValue(row[1]),
                        stringValue(row[2]),
                        stringValue(row[3]),
                        intValue(row[4]),
                        bigDecimalValue(row[5])
                ))
                .toList();
    }

    private ItemData validateItemData(
            String rawName,
            BigDecimal rawPrice,
            String rawCategoryId,
            String rawDescription,
            String rawImage,
            Boolean rawIsAvailable
    ) {
        String name = cleanText(rawName);

        if (name.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên món ăn không được bỏ trống");
        }

        if (name.length() > 50) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên món ăn tối đa 50 ký tự");
        }

        BigDecimal price = rawPrice == null ? BigDecimal.ZERO : rawPrice;

        if (price.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Giá món ăn phải lớn hơn 0");
        }

        if (price.compareTo(BigDecimal.valueOf(999999999)) > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Giá món ăn tối đa 9 chữ số");
        }

        String categoryId = cleanText(rawCategoryId);

        if (categoryId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vui lòng chọn danh mục");
        }

        ensureCategoryExists(categoryId);

        String image = cleanNullableText(rawImage);

        if (image == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vui lòng chọn ảnh món ăn");
        }

        Boolean isAvailable = rawIsAvailable == null || rawIsAvailable;

        return new ItemData(
                name,
                price,
                categoryId,
                cleanNullableText(rawDescription),
                image,
                isAvailable
        );
    }

    private ComboData validateComboData(
            String rawName,
            BigDecimal rawPrice,
            String rawDescription,
            String rawImage,
            Boolean rawIsActive,
            List<AdminComboItemRequest> rawItems
    ) {
        String name = cleanText(rawName);

        if (name.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên combo không được bỏ trống");
        }

        if (name.length() > 50) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên combo tối đa 50 ký tự");
        }

        BigDecimal price = rawPrice == null ? BigDecimal.ZERO : rawPrice;

        if (price.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Giá combo phải lớn hơn 0");
        }

        if (price.compareTo(BigDecimal.valueOf(999999999)) > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Giá combo tối đa 9 chữ số");
        }

        String image = cleanNullableText(rawImage);

        if (image == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vui lòng chọn ảnh combo");
        }

        if (rawItems == null || rawItems.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vui lòng thêm món vào combo");
        }

        Map<String, Integer> mergedItems = new LinkedHashMap<>();

        for (AdminComboItemRequest item : rawItems) {
            String itemId = cleanText(item.itemId());
            Integer quantity = item.quantity() == null ? 1 : item.quantity();

            if (itemId.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Món trong combo không hợp lệ");
            }

            if (quantity <= 0) {
                quantity = 1;
            }

            ensureItemCanBeUsedInCombo(itemId);
            mergedItems.merge(itemId, quantity, Integer::sum);
        }

        List<ComboItemData> items = mergedItems.entrySet()
                .stream()
                .map(entry -> new ComboItemData(entry.getKey(), entry.getValue()))
                .toList();

        Boolean isActive = rawIsActive == null || rawIsActive;

        return new ComboData(
                name,
                price,
                cleanNullableText(rawDescription),
                image,
                isActive,
                items
        );
    }

    private void ensureCategoryExists(String categoryId) {
        Number count = (Number) entityManager
                .createNativeQuery("""
                        select count(*)
                        from categories
                        where id = :categoryId
                          and "isActive" = true
                        """)
                .setParameter("categoryId", categoryId)
                .getSingleResult();

        if (count.longValue() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Danh mục không tồn tại hoặc đã bị khóa");
        }
    }

    private void ensureItemCanBeUsedInCombo(String itemId) {
        Number count = (Number) entityManager
                .createNativeQuery("""
                        select count(*)
                        from items
                        where id = :itemId
                          and "isActive" = true
                          and "isAvailable" = true
                        """)
                .setParameter("itemId", itemId)
                .getSingleResult();

        if (count.longValue() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Món trong combo không tồn tại hoặc đã hết hàng");
        }
    }

    private AdminItemResponse toItemResponse(Object[] row) {
        return new AdminItemResponse(
                stringValue(row[0]),
                stringValue(row[1]),
                stringValue(row[2]),
                bigDecimalValue(row[3]),
                stringValue(row[4]),
                booleanValue(row[5]),
                intValue(row[6]),
                booleanValue(row[7]),
                offsetDateTimeValue(row[8]),
                offsetDateTimeValue(row[9]),
                stringValue(row[10]),
                stringValue(row[11])
        );
    }

    private AdminComboResponse toComboResponse(Object[] row) {
        String comboId = stringValue(row[0]);

        return new AdminComboResponse(
                comboId,
                stringValue(row[1]),
                stringValue(row[2]),
                bigDecimalValue(row[3]),
                stringValue(row[4]),
                booleanValue(row[5]),
                offsetDateTimeValue(row[6]),
                offsetDateTimeValue(row[7]),
                findComboLines(comboId)
        );
    }

    private String cleanText(String value) {
        return value == null ? "" : value.trim();
    }

    private String cleanNullableText(String value) {
        String cleaned = cleanText(value);
        return cleaned.isBlank() ? null : cleaned;
    }

    private String stringValue(Object value) {
        return value == null ? "" : String.valueOf(value);
    }

    private Integer intValue(Object value) {
        if (value == null) return 0;
        if (value instanceof Number number) return number.intValue();
        return Integer.parseInt(String.valueOf(value));
    }

    private BigDecimal bigDecimalValue(Object value) {
        if (value == null) return BigDecimal.ZERO;
        if (value instanceof BigDecimal decimal) return decimal;
        if (value instanceof Number number) return BigDecimal.valueOf(number.doubleValue());
        return new BigDecimal(String.valueOf(value));
    }

    private Boolean booleanValue(Object value) {
        if (value == null) return false;
        if (value instanceof Boolean bool) return bool;
        return Boolean.parseBoolean(String.valueOf(value));
    }

    private OffsetDateTime offsetDateTimeValue(Object value) {
        if (value == null) return null;

        if (value instanceof OffsetDateTime offsetDateTime) {
            return offsetDateTime;
        }

        if (value instanceof Timestamp timestamp) {
            return timestamp.toInstant()
                    .atZone(ZoneId.systemDefault())
                    .toOffsetDateTime();
        }

        return null;
    }

    private record ItemData(
            String name,
            BigDecimal price,
            String categoryId,
            String description,
            String image,
            Boolean isAvailable
    ) {
    }

    private record ComboData(
            String name,
            BigDecimal price,
            String description,
            String image,
            Boolean isActive,
            List<ComboItemData> items
    ) {
    }

    private record ComboItemData(
            String itemId,
            Integer quantity
    ) {
    }

    public record AdminItemResponse(
            String id,
            String name,
            String description,
            BigDecimal price,
            String image,
            Boolean isAvailable,
            Integer sortOrder,
            Boolean isActive,
            OffsetDateTime createdAt,
            OffsetDateTime updatedAt,
            String categoryId,
            String categoryName
    ) {
    }

    public record AdminCategoryOptionResponse(
            String id,
            String categoryName,
            String description,
            Integer sortOrder,
            Boolean isActive
    ) {
    }

    public record AdminComboResponse(
            String id,
            String name,
            String description,
            BigDecimal price,
            String image,
            Boolean isActive,
            OffsetDateTime createdAt,
            OffsetDateTime updatedAt,
            List<AdminComboLineResponse> items
    ) {
    }

    public record AdminComboLineResponse(
            String comboItemId,
            String itemId,
            String itemName,
            String itemImage,
            Integer quantity,
            BigDecimal itemPrice
    ) {
    }

    public record DeleteItemResponse(
            String id,
            String message
    ) {
    }

    public record DeleteComboResponse(
            String id,
            String message
    ) {
    }
}