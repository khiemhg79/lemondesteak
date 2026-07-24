package com.lemondesteak.controller;

import com.lemondesteak.dto.AdminCategoryCreateRequest;
import com.lemondesteak.dto.AdminCategoryUpdateRequest;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.sql.Timestamp;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/menu")
@RequiredArgsConstructor
public class AdminMenuCategoryController {

    private final EntityManager entityManager;

    @GetMapping("/categories/all")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public List<AdminCategoryResponse> getAllCategories() {
        List<Object[]> rows = entityManager
                .createNativeQuery("""
                        select
                            c.id,
                            c."categoryName",
                            c.description,
                            c.image,
                            c."sortOrder",
                            c."isActive",
                            c."createdAt",
                            c."updatedAt",
                            count(i.id) as item_count
                        from categories c
                        left join items i
                            on i."categoryId" = c.id
                           and i."isActive" = true
                        group by
                            c.id,
                            c."categoryName",
                            c.description,
                            c.image,
                            c."sortOrder",
                            c."isActive",
                            c."createdAt",
                            c."updatedAt"
                        order by c."sortOrder", c."createdAt" desc
                        """)
                .getResultList();

        return rows.stream()
                .map(this::toResponse)
                .toList();
    }

    @PostMapping("/categories")
    @Transactional
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public AdminCategoryResponse createCategory(
            @RequestBody AdminCategoryCreateRequest request
    ) {
        CategoryData data = validateData(
                request.categoryName(),
                request.description(),
                request.image(),
                request.sortOrder(),
                request.isActive()
        );

        String id = UUID.randomUUID().toString();

        entityManager
                .createNativeQuery("""
                        insert into categories (
                            id,
                            "categoryName",
                            description,
                            image,
                            "sortOrder",
                            "isActive",
                            "createdAt",
                            "updatedAt"
                        )
                        values (
                            :id,
                            :categoryName,
                            :description,
                            :image,
                            :sortOrder,
                            :isActive,
                            now(),
                            now()
                        )
                        """)
                .setParameter("id", id)
                .setParameter("categoryName", data.categoryName())
                .setParameter("description", data.description())
                .setParameter("image", data.image())
                .setParameter("sortOrder", data.sortOrder())
                .setParameter("isActive", data.isActive())
                .executeUpdate();

        return findCategoryById(id);
    }

    @PutMapping("/categories/{id}")
    @Transactional
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public AdminCategoryResponse updateCategory(
            @PathVariable String id,
            @RequestBody AdminCategoryUpdateRequest request
    ) {
        findCategoryById(id);

        CategoryData data = validateData(
                request.categoryName(),
                request.description(),
                request.image(),
                request.sortOrder(),
                request.isActive()
        );

        entityManager
                .createNativeQuery("""
                        update categories
                        set "categoryName" = :categoryName,
                            description = :description,
                            image = :image,
                            "sortOrder" = :sortOrder,
                            "isActive" = :isActive,
                            "updatedAt" = now()
                        where id = :id
                        """)
                .setParameter("id", id)
                .setParameter("categoryName", data.categoryName())
                .setParameter("description", data.description())
                .setParameter("image", data.image())
                .setParameter("sortOrder", data.sortOrder())
                .setParameter("isActive", data.isActive())
                .executeUpdate();

        return findCategoryById(id);
    }

    @DeleteMapping("/categories/{id}")
    @Transactional
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public DeleteCategoryResponse deleteCategory(@PathVariable String id) {
        findCategoryById(id);

        entityManager
                .createNativeQuery("""
                        update categories
                        set "isActive" = false,
                            "updatedAt" = now()
                        where id = :id
                        """)
                .setParameter("id", id)
                .executeUpdate();

        return new DeleteCategoryResponse(id, "Đã xóa/tạm dừng danh mục");
    }

    private AdminCategoryResponse findCategoryById(String id) {
        List<Object[]> rows = entityManager
                .createNativeQuery("""
                        select
                            c.id,
                            c."categoryName",
                            c.description,
                            c.image,
                            c."sortOrder",
                            c."isActive",
                            c."createdAt",
                            c."updatedAt",
                            count(i.id) as item_count
                        from categories c
                        left join items i
                            on i."categoryId" = c.id
                           and i."isActive" = true
                        where c.id = :id
                        group by
                            c.id,
                            c."categoryName",
                            c.description,
                            c.image,
                            c."sortOrder",
                            c."isActive",
                            c."createdAt",
                            c."updatedAt"
                        limit 1
                        """)
                .setParameter("id", id)
                .getResultList();

        if (rows.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Không tìm thấy danh mục"
            );
        }

        return toResponse(rows.get(0));
    }

    private CategoryData validateData(
            String rawCategoryName,
            String rawDescription,
            String rawImage,
            Integer rawSortOrder,
            Boolean rawIsActive
    ) {
        String categoryName = cleanText(rawCategoryName);

        if (categoryName.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Tên danh mục không được bỏ trống"
            );
        }

        if (categoryName.length() > 50) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Tên danh mục tối đa 50 ký tự"
            );
        }

        Integer sortOrder = rawSortOrder == null ? 0 : rawSortOrder;

        if (sortOrder < 0) {
            sortOrder = 0;
        }

        Boolean isActive = rawIsActive == null || rawIsActive;

        return new CategoryData(
                categoryName,
                cleanNullableText(rawDescription),
                cleanNullableText(rawImage),
                sortOrder,
                isActive
        );
    }

    private AdminCategoryResponse toResponse(Object[] row) {
        return new AdminCategoryResponse(
                stringValue(row[0]),
                stringValue(row[1]),
                stringValue(row[2]),
                stringValue(row[3]),
                intValue(row[4]),
                booleanValue(row[5]),
                offsetDateTimeValue(row[6]),
                offsetDateTimeValue(row[7]),
                intValue(row[8])
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

    private record CategoryData(
            String categoryName,
            String description,
            String image,
            Integer sortOrder,
            Boolean isActive
    ) {
    }

    public record AdminCategoryResponse(
            String id,
            String categoryName,
            String description,
            String image,
            Integer sortOrder,
            Boolean isActive,
            OffsetDateTime createdAt,
            OffsetDateTime updatedAt,
            Integer itemCount
    ) {
    }

    public record DeleteCategoryResponse(
            String id,
            String message
    ) {
    }
}