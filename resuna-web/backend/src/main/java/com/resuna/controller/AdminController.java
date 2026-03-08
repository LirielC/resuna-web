package com.resuna.controller;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.google.firebase.auth.FirebaseAuth;
import com.resuna.service.AnalyticsService;
import com.resuna.service.BillingEventService;
import com.resuna.service.FeatureFlagsService;
import com.resuna.service.SubscriptionService;
import com.resuna.service.UsageAggregateService;
import com.resuna.service.UserProfileService;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private static final Logger logger = LoggerFactory.getLogger(AdminController.class);

    private final AnalyticsService analyticsService;
    private final SubscriptionService subscriptionService;
    private final UserProfileService userProfileService;
    private final UsageAggregateService usageAggregateService;
    private final BillingEventService billingEventService;
    private final FeatureFlagsService featureFlagsService;

    @Value("${app.super-admin-email:}")
    private String superAdminEmail;

    @Value("${app.debug:false}")
    private boolean debugMode;

    public AdminController(AnalyticsService analyticsService,
            SubscriptionService subscriptionService,
            UserProfileService userProfileService,
            UsageAggregateService usageAggregateService,
            BillingEventService billingEventService,
            FeatureFlagsService featureFlagsService) {
        this.analyticsService = analyticsService;
        this.subscriptionService = subscriptionService;
        this.userProfileService = userProfileService;
        this.usageAggregateService = usageAggregateService;
        this.billingEventService = billingEventService;
        this.featureFlagsService = featureFlagsService;
    }

    /**
     * Check if the user has admin custom claim.
     * Uses claims already decoded by AuthFilter — no redundant token re-parsing.
     */
    private boolean isAdmin(HttpServletRequest request, String authHeader) {
        try {
            if (isSuperAdminEnforced() && !isSuperAdmin(request)) {
                return false;
            }
            Object claimsAttr = request.getAttribute("userClaims");
            if (claimsAttr instanceof Map<?, ?> claimsMap) {
                Object adminClaim = claimsMap.get("admin");
                return Boolean.TRUE.equals(adminClaim);
            }
            // If claims are not present in request, user is not authenticated
            return false;
        } catch (Exception e) {
            logger.error("Error verifying admin status: {}", e.getMessage());
            return false;
        }
    }

    private boolean isSuperAdminEnforced() {
        return superAdminEmail != null && !superAdminEmail.isBlank();
    }

    private boolean isSuperAdmin(HttpServletRequest request) {
        Object email = request.getAttribute("userEmail");
        return email != null && superAdminEmail.equalsIgnoreCase(email.toString());
    }

    /**
     * Safely format error message based on debug mode.
     * In production (debug=false), returns generic message to prevent PII/system info leakage.
     * In debug mode (debug=true), returns detailed exception message.
     */
    private String safeErrorMessage(Exception e) {
        if (debugMode) {
            return e.getMessage();
        }
        return "An internal error occurred. Please contact support if the issue persists.";
    }

    /**
     * Get dashboard statistics.
     */
    @GetMapping("/stats")
    public ResponseEntity<?> getDashboardStats(
            @RequestHeader("Authorization") String authHeader,
            HttpServletRequest request) {
        if (!isAdmin(request, authHeader)) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied. Admin privileges required."));
        }

        try {
            Map<String, Object> stats = analyticsService.getDashboardStats();
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            logger.error("Error getting dashboard stats: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", safeErrorMessage(e)));
        }
    }

    /**
     * Get recent activities with pagination.
     */
    @GetMapping("/activities")
    public ResponseEntity<?> getRecentActivities(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            HttpServletRequest request) {
        if (!isAdmin(request, authHeader)) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
        }

        try {
            Map<String, Object> activities = analyticsService.getRecentActivities(page, size);
            return ResponseEntity.ok(activities);
        } catch (Exception e) {
            logger.error("Error getting activities: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", safeErrorMessage(e)));
        }
    }

    /**
     * Get all users with their last activity.
     */
    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers(
            @RequestHeader("Authorization") String authHeader,
            HttpServletRequest request) {
        if (!isAdmin(request, authHeader)) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
        }

        try {
            List<Map<String, Object>> users = analyticsService.getAllUsersWithLastActivity();
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            logger.error("Error getting users: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", safeErrorMessage(e)));
        }
    }

    /**
     * Get user profiles (admin only).
     */
    @GetMapping("/users/profiles")
    public ResponseEntity<?> getUserProfiles(
            @RequestHeader("Authorization") String authHeader,
            HttpServletRequest request) {
        if (!isAdmin(request, authHeader)) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
        }

        return ResponseEntity.ok(new ArrayList<>(userProfileService.getAllProfiles().values()));
    }

    /**
     * Get aggregated usage + credits for users (admin only).
     */
    @GetMapping("/users/usage")
    public ResponseEntity<?> getUserUsage(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(defaultValue = "30") int days,
            HttpServletRequest request) {
        if (!isAdmin(request, authHeader)) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
        }

        try {
            List<Map<String, Object>> usage = analyticsService.getUserUsageSummary(days);
            Map<String, com.resuna.model.UserSubscription> subscriptions = subscriptionService
                    .getAllSubscriptionsSnapshot();

            Map<String, Map<String, Object>> merged = new LinkedHashMap<>();
            for (Map<String, Object> entry : usage) {
                String userId = (String) entry.get("userId");
                merged.put(userId, new LinkedHashMap<>(entry));
            }

            for (Map.Entry<String, com.resuna.model.UserSubscription> entry : subscriptions.entrySet()) {
                String userId = entry.getKey();
                com.resuna.model.UserSubscription sub = entry.getValue();
                Map<String, Object> row = merged.computeIfAbsent(userId, id -> {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("userId", id);
                    map.put("email", null);
                    map.put("totalRequests", 0L);
                    map.put("lastActivity", null);
                    return map;
                });
                row.put("creditsRemaining", sub.getCreditsRemaining());
                row.put("creditsUsed", sub.getCreditsUsed());
                row.put("subscriptionStatus", sub.getStatus() != null ? sub.getStatus().toString() : "UNKNOWN");
                row.put("subscriptionTier", sub.getTier() != null ? sub.getTier().toString() : "FREE");
            }

            return ResponseEntity.ok(new ArrayList<>(merged.values()));
        } catch (Exception e) {
            logger.error("Error getting user usage: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", safeErrorMessage(e)));
        }
    }

    /**
     * Get usage aggregates (admin only).
     */
    @GetMapping("/usage-aggregates")
    public ResponseEntity<?> getUsageAggregates(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(defaultValue = "day") String periodType,
            @RequestParam(defaultValue = "30") int days,
            HttpServletRequest request) {
        if (!isAdmin(request, authHeader)) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
        }

        try {
            String sinceKey = UsageAggregateKeyHelper.sinceKey(periodType, days);
            return ResponseEntity.ok(usageAggregateService.getAggregates(periodType, sinceKey));
        } catch (Exception e) {
            logger.error("Error getting usage aggregates: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", safeErrorMessage(e)));
        }
    }

    /**
     * Get billing events (admin only).
     */
    @GetMapping("/billing-events")
    public ResponseEntity<?> getBillingEvents(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(required = false) String userId,
            @RequestParam(defaultValue = "50") int limit,
            HttpServletRequest request) {
        if (!isAdmin(request, authHeader)) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
        }

        if (userId != null && !userId.isBlank()) {
            return ResponseEntity.ok(billingEventService.getEventsForUser(userId, limit));
        }
        return ResponseEntity.ok(billingEventService.getRecentEvents(limit));
    }

    /**
     * Get feature flags for a user (admin only).
     */
    @GetMapping("/feature-flags/{userId}")
    public ResponseEntity<?> getFeatureFlags(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable String userId,
            HttpServletRequest request) {
        if (!isAdmin(request, authHeader)) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
        }
        return ResponseEntity.ok(featureFlagsService.getFlags(userId));
    }

    /**
     * Update feature flags for a user (admin only).
     */
    @PutMapping("/feature-flags/{userId}")
    public ResponseEntity<?> setFeatureFlags(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable String userId,
            @RequestBody Map<String, Object> body,
            HttpServletRequest request) {
        if (!isAdmin(request, authHeader)) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
        }
        boolean aiEnabled = Boolean.TRUE.equals(body.get("aiEnabled"));
        boolean atsEnabled = Boolean.TRUE.equals(body.get("atsEnabled"));
        return ResponseEntity.ok(featureFlagsService.setFlags(userId, aiEnabled, atsEnabled));
    }

    private static class UsageAggregateKeyHelper {
        private static String sinceKey(String periodType, int days) {
            java.time.LocalDate now = java.time.LocalDate.now(java.time.ZoneOffset.UTC);
            if ("week".equalsIgnoreCase(periodType)) {
                java.time.LocalDate since = now.minusDays(days);
                java.time.temporal.WeekFields weekFields = java.time.temporal.WeekFields.of(java.util.Locale.US);
                int week = since.get(weekFields.weekOfWeekBasedYear());
                int year = since.get(weekFields.weekBasedYear());
                return String.format("%d-W%02d", year, week);
            }
            return now.minusDays(days).toString();
        }
    }

    /**
     * Get activities for a specific user.
     */
    @GetMapping("/users/{userId}/activities")
    public ResponseEntity<?> getUserActivities(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable String userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            HttpServletRequest request) {
        if (!isAdmin(request, authHeader)) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
        }

        try {
            Map<String, Object> activities = analyticsService.getUserActivities(userId, page, size);
            return ResponseEntity.ok(activities);
        } catch (Exception e) {
            logger.error("Error getting user activities: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", safeErrorMessage(e)));
        }
    }

    /**
     * Endpoint to set admin claim for a user.
     * Restricted to super-admin only — a regular admin cannot promote other admins.
     * Requires SUPER_ADMIN_EMAIL to be configured; fails closed if not set.
     */
    @PostMapping("/set-admin/{uid}")
    public ResponseEntity<?> setAdminClaim(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable String uid,
            @RequestParam boolean isAdmin,
            HttpServletRequest request) {
        // Only the super-admin can change admin claims — regular admins cannot.
        if (!isSuperAdminEnforced() || !isSuperAdmin(request)) {
            logger.warn("🚨 [SECURITY] Unauthorized attempt to change admin claim for uid={} by {}",
                    uid, request.getAttribute("userEmail"));
            return ResponseEntity.status(403).body(Map.of("error", "Access denied: super-admin required"));
        }

        try {
            Map<String, Object> claims = Map.of("admin", isAdmin);
            FirebaseAuth.getInstance().setCustomUserClaims(uid, claims);
            logger.info("✅ [AUDIT] Super-admin {} set admin={} for uid={}",
                    request.getAttribute("userEmail"), isAdmin, uid);
            return ResponseEntity.ok(Map.of("success", true, "message", "Admin claim updated"));
        } catch (Exception e) {
            logger.error("Error setting admin claim: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", safeErrorMessage(e)));
        }
    }
}
