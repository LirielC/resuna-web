package com.resuna.service;

import com.resuna.model.FeatureFlags;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;

/**
 * Applies the common policy for AI endpoints.
 * Keeping this policy outside controllers makes all AI routes behave consistently.
 */
@Service
public class AiRequestGuardService {

    private static final Logger logger = LoggerFactory.getLogger(AiRequestGuardService.class);

    private final FeatureFlagsService featureFlagsService;
    private final SubscriptionService subscriptionService;
    private final TurnstileService turnstileService;
    private final com.resuna.util.SecurityUtils securityUtils;

    public AiRequestGuardService(FeatureFlagsService featureFlagsService,
            SubscriptionService subscriptionService,
            TurnstileService turnstileService,
            com.resuna.util.SecurityUtils securityUtils) {
        this.featureFlagsService = featureFlagsService;
        this.subscriptionService = subscriptionService;
        this.turnstileService = turnstileService;
        this.securityUtils = securityUtils;
    }

    public ResponseEntity<?> check(String userId, String userEmail, HttpServletRequest request) {
        return check(userId, userEmail, request, true);
    }

    public ResponseEntity<?> check(String userId, String userEmail,
            HttpServletRequest request, boolean requireCaptcha) {
        FeatureFlags flags = featureFlagsService.getFlags(userId);
        if (!flags.isAiEnabled()) {
            return forbidden("Feature disabled for your account");
        }

        String ipAddress = securityUtils.getSecureClientIp(request);
        String fingerprint = securityUtils.getClientFingerprint(request);
        if (!subscriptionService.canUseAIFeatures(userId, userEmail, ipAddress, fingerprint)) {
            return forbidden("Insufficient credits. Please purchase more to continue.");
        }

        if (requireCaptcha) {
            String captchaToken = request.getHeader("X-Captcha-Token");
            if (!turnstileService.verify(captchaToken, ipAddress)) {
                logger.warn("[SECURITY] CAPTCHA verification failed for user {}", userId);
                return forbidden("Verificação de segurança obrigatória. Complete o CAPTCHA e tente novamente.");
            }
        }
        return null;
    }

    public boolean consumeCredit(String userId, String userEmail, HttpServletRequest request) {
        return subscriptionService.consumeCredits(userId, 1, userEmail,
                securityUtils.getSecureClientIp(request), securityUtils.getClientFingerprint(request));
    }

    private ResponseEntity<?> forbidden(String message) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", message));
    }
}
