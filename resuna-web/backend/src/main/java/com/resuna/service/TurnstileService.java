package com.resuna.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.Map;

/**
 * Cloudflare Turnstile CAPTCHA verification service
 *
 * Turnstile is Cloudflare's free, privacy-friendly CAPTCHA alternative.
 * It's invisible in most cases and shows a simple checkbox when needed.
 *
 * Setup:
 * 1. Get keys at https://dash.cloudflare.com/
 * 2. Configure in application.yml:
 *    turnstile.secret-key=${TURNSTILE_SECRET_KEY}
 *    turnstile.enabled=${TURNSTILE_ENABLED:false}
 */
@Service
public class TurnstileService {

    private static final Logger logger = LoggerFactory.getLogger(TurnstileService.class);

    @Value("${turnstile.secret-key:}")
    private String secretKey;

    @Value("${turnstile.enabled:false}")
    private boolean enabled;

    private static final String VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

    // Fraud detection metrics
    private final Map<String, AtomicInteger> failedAttemptsByIp = new ConcurrentHashMap<>();
    private final AtomicInteger totalVerifications = new AtomicInteger(0);
    private final AtomicInteger totalFailures = new AtomicInteger(0);
    private final AtomicInteger totalFraudDetected = new AtomicInteger(0);

    private static final int FRAUD_THRESHOLD = 5; // Suspeito após 5 falhas

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Verify Turnstile CAPTCHA token
     *
     * @param token Token from frontend
     * @param remoteIp Client IP address (optional but recommended)
     * @return true if verification passes
     */
    public boolean verify(String token, String remoteIp) {
        totalVerifications.incrementAndGet();

        // If Turnstile is disabled, always pass
        if (!enabled) {
            logger.debug("Turnstile CAPTCHA disabled - skipping verification");
            return true;
        }

        // Validate inputs
        if (token == null || token.isBlank()) {
            logger.warn("⚠️ [SECURITY] Turnstile token is null or blank from IP: {}", remoteIp);
            recordFailure(remoteIp, "missing_token");
            return false;
        }

        if (secretKey == null || secretKey.isBlank()) {
            logger.error("❌ [CONFIG] Turnstile secret key not configured!");
            return false;
        }

        // Check if IP has too many failed attempts (potential bot)
        if (isPotentialBot(remoteIp)) {
            logger.warn("🚨 [FRAUD] Potential bot detected from IP: {} ({} failed attempts)",
                remoteIp, failedAttemptsByIp.get(remoteIp).get());
            totalFraudDetected.incrementAndGet();
        }

        try {
            // Prepare request to Cloudflare
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
            params.add("secret", secretKey);
            params.add("response", token);
            if (remoteIp != null && !remoteIp.isBlank()) {
                params.add("remoteip", remoteIp);
            }

            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);

            // Call Cloudflare API
            TurnstileResponse response = restTemplate.postForObject(
                VERIFY_URL,
                request,
                TurnstileResponse.class
            );

            if (response == null) {
                logger.error("Turnstile response is null");
                return false;
            }

            // Check result
            if (!response.success) {
                String errors = response.errorCodes != null ? String.join(", ", response.errorCodes) : "unknown";
                logger.warn("⚠️ [TURNSTILE] Verification failed from IP: {} - Errors: {}", remoteIp, errors);
                recordFailure(remoteIp, errors);
                return false;
            }

            // Success - clear failed attempts for this IP
            failedAttemptsByIp.remove(remoteIp);
            logger.info("✅ [TURNSTILE] Verified successfully from IP: {} (hostname: {})",
                remoteIp, response.hostname);
            return true;

        } catch (Exception e) {
            logger.error("❌ [TURNSTILE] Error verifying CAPTCHA from IP: {} - {}", remoteIp, e.getMessage());
            recordFailure(remoteIp, "exception");
            return false;
        }
    }

    /**
     * Record a failed verification attempt
     */
    private void recordFailure(String remoteIp, String reason) {
        totalFailures.incrementAndGet();
        if (remoteIp != null && !remoteIp.isBlank()) {
            failedAttemptsByIp.computeIfAbsent(remoteIp, k -> new AtomicInteger(0)).incrementAndGet();
        }

        // Log metrics periodically
        int total = totalVerifications.get();
        if (total % 100 == 0) {
            logSecurityMetrics();
        }
    }

    /**
     * Check if an IP is behaving like a bot
     */
    private boolean isPotentialBot(String remoteIp) {
        if (remoteIp == null || remoteIp.isBlank()) {
            return false;
        }
        AtomicInteger failures = failedAttemptsByIp.get(remoteIp);
        return failures != null && failures.get() >= FRAUD_THRESHOLD;
    }

    /**
     * Log security metrics for monitoring
     */
    private void logSecurityMetrics() {
        int total = totalVerifications.get();
        int failures = totalFailures.get();
        int fraud = totalFraudDetected.get();
        double failureRate = total > 0 ? (failures * 100.0 / total) : 0;

        logger.info("📊 [TURNSTILE METRICS] Total: {} | Failures: {} ({:.1f}%) | Fraud Detected: {}",
            total, failures, failureRate, fraud);
    }

    /**
     * Periodically clear failed-attempt counters to prevent unbounded memory growth.
     */
    @Scheduled(fixedRate = 3600000)
    public void clearFailedAttempts() {
        failedAttemptsByIp.clear();
        logger.debug("Cleared failed-attempt counters");
    }

    /**
     * Get current security metrics (for admin dashboard)
     */
    public Map<String, Object> getMetrics() {
        return Map.of(
            "totalVerifications", totalVerifications.get(),
            "totalFailures", totalFailures.get(),
            "totalFraudDetected", totalFraudDetected.get(),
            "failureRate", totalVerifications.get() > 0
                ? (totalFailures.get() * 100.0 / totalVerifications.get()) : 0,
            "suspiciousIps", failedAttemptsByIp.size()
        );
    }

    /**
     * Cloudflare Turnstile API response
     */
    private static class TurnstileResponse {
        public boolean success;

        @JsonProperty("challenge_ts")
        public String challengeTs;

        public String hostname;

        @JsonProperty("error-codes")
        public String[] errorCodes;

        public String action;  // Available if configured
        public String cdata;   // Available if configured
    }
}
