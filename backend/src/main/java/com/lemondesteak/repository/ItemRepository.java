package com.lemondesteak.repository;

import com.lemondesteak.entity.Item;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ItemRepository extends JpaRepository<Item, String> {
    List<Item> findByIsActiveTrueAndIsAvailableTrueOrderBySortOrderAscNameAsc();
    List<Item> findByCategory_IdAndIsActiveTrueAndIsAvailableTrueOrderBySortOrderAscNameAsc(String categoryId);

    @Query("""
        select i from Item i
        where i.isActive = true
          and i.isAvailable = true
          and (:keyword is null or :keyword = '' or lower(i.name) like lower(concat('%', :keyword, '%'))
               or lower(coalesce(i.description, '')) like lower(concat('%', :keyword, '%')))
        order by i.sortOrder asc, i.name asc
    """)
    List<Item> searchAvailable(@Param("keyword") String keyword);
}
