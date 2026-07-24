package com.lemondesteak.controller;

import com.lemondesteak.dto.CategoryResponse;
import com.lemondesteak.dto.ComboResponse;
import com.lemondesteak.dto.ItemResponse;
import com.lemondesteak.service.MenuService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/menu")
@RequiredArgsConstructor
public class MenuController {
    private final MenuService menuService;

    @GetMapping("/categories")
    public List<CategoryResponse> categories() {
        return menuService.categories();
    }

    @GetMapping("/items")
    public List<ItemResponse> items(@RequestParam(required = false) String categoryId,
                                    @RequestParam(required = false) String keyword) {
        return menuService.items(categoryId, keyword);
    }

    @GetMapping("/combos")
    public List<ComboResponse> combos() {
        return menuService.combos();
    }
}
