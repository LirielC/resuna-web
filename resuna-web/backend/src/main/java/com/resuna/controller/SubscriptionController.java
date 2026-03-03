package com.resuna.controller;

import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.resuna.exception.UnauthorizedException;
import com.resuna.model.UserSubscription;
import com.resuna.service.SubscriptionService;
import com.resuna.util.SecurityUtils;

import jakarta.servlet.http.HttpServletRequest;

/**
 * REST controller for subscription and credits management.
 *
 * FREE & OPEN-SOURCE MODEL:
 * - No payment processing
 * - Daily credit limits only
 * - Everyone gets same free tier
 */
@RestController
@RequestMapping("/api/subscription")
public class SubscriptionController {

    private static final Logger logger = LoggerFactory.getLogger(SubscriptionController.class);

    private final SubscriptionService subscriptionService;
    private final SecurityUtils securityUtils;

    public SubscriptionController(SubscriptionService subscriptionService, SecurityUtils securityUtils) {
        this.subscriptionService = subscriptionService;
        this.securityUtils = securityUtils;
    }

    private String getCurrentUserId(HttpServletRequest request) {
        Object userId = request.getAttribute("userId");
        if (userId == null) {
            throw new UnauthorizedException("User not authenticated");
        }
        return userId.toString();
    }

    private String getUserEmail(HttpServletRequest request) {
        Object email = request.getAttribute("userEmail");
        return email != null ? email.toString() : null;
    }

    private String getClientIp(HttpServletRequest request) {
        return securityUtils.getSecureClientIp(request);
    }

    private String getClientFingerprint(HttpServletRequest request) {
        return securityUtils.getClientFingerprint(request);
    }

    /**
     * Get current user's credit balance and usage stats.
     *
     * FREE MODEL:
     * - Credits reset daily
     * - Everyone gets same amount
     * - No payment required
     */
    @GetMapping("/credits")
    public ResponseEntity<Map<String, Object>> getCredits(HttpServletRequest request) {
        try {
            String userId = getCurrentUserId(request);
            String userEmail = getUserEmail(request);
            String ipAddress = getClientIp(request);
            String fingerprint = getClientFingerprint(request);

            UserSubscription subscription = subscriptionService.getUserSubscription(
                    userId, userEmail, ipAddress, fingerprint);

            Map<String, Object> response = new HashMap<>();
            response.put("creditsRemaining", subscription.getCreditsRemaining());
            response.put("creditsUsed", subscription.getCreditsUsed());
            response.put("dailyLimit", subscription.getDailyLimit());
            response.put("resetTime", subscription.getResetTime());
            response.put("tier", "FREE"); // Always free
            response.put("status", subscription.getStatus().toString());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("Error getting credits", e);
            return ResponseEntity.status(500).build();
        }
    }

    /**
     * Get subscription info.
     *
     * FREE MODEL:
     * - Everyone has "FREE" tier
     * - No expiration
     * - Daily credit reset
     */
    @GetMapping("/info")
    public ResponseEntity<Map<String, Object>> getSubscriptionInfo(HttpServletRequest request) {
        try {
            String userId = getCurrentUserId(request);
            String userEmail = getUserEmail(request);
            String ipAddress = getClientIp(request);
            String fingerprint = getClientFingerprint(request);

            UserSubscription subscription = subscriptionService.getUserSubscription(
                    userId, userEmail, ipAddress, fingerprint);

            Map<String, Object> response = new HashMap<>();
            response.put("tier", "FREE");
            response.put("status", "ACTIVE");
            response.put("dailyCredits", subscription.getDailyLimit());
            response.put("creditsRemaining", subscription.getCreditsRemaining());
            response.put("features", Map.of(
                "aiAssistant", true,
                "atsAnalysis", true,
                "pdfExport", true,
                "docxExport", true,
                "translation", true,
                "coverLetter", true
            ));
            response.put("limits", Map.of(
                "dailyAiRequests", subscription.getDailyLimit(),
                "resumeCount", "unlimited",
                "storage", "unlimited"
            ));

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("Error getting subscription info", e);
            return ResponseEntity.status(500).build();
        }
    }
}
