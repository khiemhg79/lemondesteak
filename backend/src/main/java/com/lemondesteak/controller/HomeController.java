package com.lemondesteak.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class HomeController {

    @GetMapping("/")
    public Map<String, Object> home() {
        return Map.of(
                "status", "OK",
                "message", "LemondeSteak API is running",
                "menuItems", "/api/menu/items",
                "menuCategories", "/api/menu/categories",
                "login", "/api/auth/login",
                "register", "/api/auth/register"
        );
    }
}
