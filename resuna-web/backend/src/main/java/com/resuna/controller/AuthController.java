package com.resuna.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.resuna.service.FirebaseAuthService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final FirebaseAuthService authService;

    public AuthController(FirebaseAuthService authService) {
        this.authService = authService;
    }

    /**
     * Get current authenticated user info.
     * This endpoint validates the token and returns user details.
     */
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body(Map.of(
                "error", "Unauthorized",
                "message", "Missing authorization token"
            ));
        }
        
        String token = authHeader.substring(7);
        
        try {
            Map<String, Object> user = authService.verifyToken(token);
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of(
                "error", "Unauthorized",
                "message", "Invalid or expired token"
            ));
        }
    }

    /**
     * Health check for auth service
     */
    @GetMapping("/health")
    public ResponseEntity<?> healthCheck() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "ok");
        response.put("service", "auth");
        return ResponseEntity.ok(response);
    }
}
