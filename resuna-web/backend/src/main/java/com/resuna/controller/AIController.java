package com.resuna.controller;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.resuna.exception.UnauthorizedException;
import com.resuna.model.CoverLetterRequest;
import com.resuna.model.CoverLetterResponse;
import com.resuna.model.CritiqueResponse;
import com.resuna.model.RefineRequest;
import com.resuna.model.RefineResponse;
import com.resuna.model.Resume;
import com.resuna.model.TranslateRequest;
import com.resuna.model.UserSubscription;
import com.resuna.service.FeatureFlagsService;
import com.resuna.service.OpenRouterService;
import com.resuna.service.ResumeService;
import com.resuna.service.SubscriptionService;
import com.resuna.service.TurnstileService;
import com.resuna.util.SecurityUtils;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

/**
 * REST controller for AI-powered features (Premium).
 */
@RestController
@RequestMapping("/api/ai")
public class AIController {

    private static final Logger logger = LoggerFactory.getLogger(AIController.class);

    private final OpenRouterService aiService;
    private final ResumeService resumeService;
    private final SubscriptionService subscriptionService;
    private final FeatureFlagsService featureFlagsService;
    private final SecurityUtils securityUtils;
    private final TurnstileService turnstileService;
    private final ObjectMapper objectMapper;

    public AIController(OpenRouterService aiService,
            ResumeService resumeService,
            SubscriptionService subscriptionService,
            FeatureFlagsService featureFlagsService,
            SecurityUtils securityUtils,
            TurnstileService turnstileService,
            ObjectMapper objectMapper) {
        this.aiService = aiService;
        this.resumeService = resumeService;
        this.subscriptionService = subscriptionService;
        this.featureFlagsService = featureFlagsService;
        this.securityUtils = securityUtils;
        this.turnstileService = turnstileService;
        this.objectMapper = objectMapper;
    }

    private String getCurrentUserId(HttpServletRequest request) {
        Object userId = request.getAttribute("userId");
        if (userId == null) {
            throw new UnauthorizedException("User not authenticated");
        }
        return userId.toString();
    }

    public static class CritiqueRequest {
        @NotNull(message = "resume is required")
        private Resume resume;

        @Size(max = 20)
        private String language;

        @Size(max = 2048)
        private String captchaToken;

        public Resume getResume() {
            return resume;
        }

        public void setResume(Resume resume) {
            this.resume = resume;
        }

        public String getLanguage() {
            return language;
        }

        public void setLanguage(String language) {
            this.language = language;
        }

        public String getCaptchaToken() {
            return captchaToken;
        }

        public void setCaptchaToken(String captchaToken) {
            this.captchaToken = captchaToken;
        }
    }

    @PostMapping("/critique")
    public ResponseEntity<?> critiqueResume(
            @Valid @RequestBody CritiqueRequest request,
            HttpServletRequest httpRequest) {
        try {
            String userId = getCurrentUserId(httpRequest);
            String userEmail = getUserEmail(httpRequest);
            String ipAddress = getClientIp(httpRequest);
            String fingerprint = getClientFingerprint(httpRequest);
            String captchaToken = request.getCaptchaToken();

            logger.info("AI Critique request received");

            if (!featureFlagsService.getFlags(userId).isAiEnabled()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Feature disabled"));
            }

            if (!subscriptionService.canUseAIFeatures(userId, userEmail, ipAddress, fingerprint)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Insufficient credits"));
            }

            // ✅ CAPTCHA verification (REQUIRED for AI endpoints)
            // Protects against abuse and bot attacks on expensive AI operations
            if (!verifyCaptcha(captchaToken, ipAddress, true)) {
                logger.warn("🚨 [SECURITY] CAPTCHA verification failed for user {} from IP {}", userId, ipAddress);
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error",
                                "Verificação de segurança obrigatória. Complete o CAPTCHA e tente novamente."));
            }

            Resume resume = request.getResume();
            String language = request.getLanguage() != null ? request.getLanguage() : "pt-BR";
            CritiqueResponse response = aiService.critiqueResume(resume, language);
            boolean consumed = subscriptionService.consumeCredits(
                    userId, response.getCreditsUsed(), userEmail, ipAddress, fingerprint);
            if (!consumed) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Insufficient credits"));
            }

            logger.info("AI Critique completed. Score: {}", response.getOverallScore());
            UserSubscription subscription = subscriptionService.getUserSubscription(
                    userId, userEmail, ipAddress, fingerprint);
            return ResponseEntity.ok()
                    .header("X-Credits-Remaining", String.valueOf(subscription.getCreditsRemaining()))
                    .body(response);

        } catch (IOException e) {
            logger.error("AI service unavailable for critique", e);
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("error", "Serviço de IA temporariamente indisponível. Tente novamente em instantes."));
        } catch (Exception e) {
            logger.error("Error critiquing resume", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erro ao analisar currículo. Tente novamente."));
        }
    }

    @PostMapping("/refine")
    public ResponseEntity<?> refineBullets(
            @Valid @RequestBody RefineRequest request,
            HttpServletRequest httpRequest) {
        try {
            String userId = getCurrentUserId(httpRequest);
            String userEmail = getUserEmail(httpRequest);
            String ipAddress = getClientIp(httpRequest);
            String fingerprint = getClientFingerprint(httpRequest);
            logger.info("AI Refine request received");

            if (!featureFlagsService.getFlags(userId).isAiEnabled()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Feature disabled"));
            }

            if (!subscriptionService.canUseAIFeatures(userId, userEmail, ipAddress, fingerprint)) {
                logger.warn("User {} does not have premium access", userId);
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Insufficient credits"));
            }

            // ✅ CAPTCHA verification (REQUIRED for AI endpoints)
            if (!verifyCaptcha(request.getCaptchaToken(), ipAddress, true)) {
                logger.warn("🚨 [SECURITY] CAPTCHA verification failed for /refine from IP {}", ipAddress);
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error",
                                "Verificação de segurança obrigatória. Complete o CAPTCHA e tente novamente."));
            }

            Resume resume = request.getResume() != null
                    ? request.getResume()
                    : resumeService.getResumeById(request.getResumeId(), userId);
            RefineResponse response = aiService.refineBullets(resume, request);
            boolean consumed = subscriptionService.consumeCredits(
                    userId, response.getCreditsUsed(), userEmail, ipAddress, fingerprint);
            if (!consumed) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Insufficient credits"));
            }

            logger.info("AI Refine completed. Generated {} refinements", response.getRefinements().size());
            UserSubscription subscription = subscriptionService.getUserSubscription(
                    userId, userEmail, ipAddress, fingerprint);
            return ResponseEntity.ok()
                    .header("X-Credits-Remaining", String.valueOf(subscription.getCreditsRemaining()))
                    .body(response);

        } catch (IOException e) {
            logger.error("AI service unavailable for refine", e);
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("error", "Serviço de IA temporariamente indisponível. Tente novamente em instantes."));
        } catch (Exception e) {
            logger.error("Error refining bullets", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erro ao refinar tópicos. Tente novamente."));
        }
    }

    @PostMapping("/cover-letter")
    public ResponseEntity<?> generateCoverLetter(
            @Valid @RequestBody CoverLetterRequest request,
            HttpServletRequest httpRequest) {
        try {
            String userId = getCurrentUserId(httpRequest);
            String userEmail = getUserEmail(httpRequest);
            String ipAddress = getClientIp(httpRequest);
            String fingerprint = getClientFingerprint(httpRequest);
            logger.info("AI Cover Letter request received");

            if (!featureFlagsService.getFlags(userId).isAiEnabled()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Feature disabled"));
            }

            if (!subscriptionService.canUseAIFeatures(userId, userEmail, ipAddress, fingerprint)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Insufficient credits"));
            }

            // ✅ CAPTCHA verification (REQUIRED for AI endpoints)
            if (!verifyCaptcha(request.getCaptchaToken(), ipAddress, true)) {
                logger.warn("🚨 [SECURITY] CAPTCHA verification failed for /cover-letter from IP {}", ipAddress);
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error",
                                "Verificação de segurança obrigatória. Complete o CAPTCHA e tente novamente."));
            }

            Resume resume = request.getResume() != null
                    ? request.getResume()
                    : resumeService.getResumeById(request.getResumeId(), userId);
            CoverLetterResponse response = aiService.generateCoverLetter(resume, request);
            boolean consumed = subscriptionService.consumeCredits(
                    userId, response.getCreditsUsed(), userEmail, ipAddress, fingerprint);
            if (!consumed) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Insufficient credits"));
            }

            logger.info("AI Cover Letter generated. {} words", response.getWordCount());
            UserSubscription subscription = subscriptionService.getUserSubscription(
                    userId, userEmail, ipAddress, fingerprint);
            return ResponseEntity.ok()
                    .header("X-Credits-Remaining", String.valueOf(subscription.getCreditsRemaining()))
                    .body(response);

        } catch (IOException e) {
            logger.error("AI service unavailable for cover letter", e);
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("error", "Serviço de IA temporariamente indisponível. Tente novamente em instantes."));
        } catch (Exception e) {
            logger.error("Error generating cover letter", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erro ao gerar carta de apresentação. Tente novamente."));
        }
    }

    @PostMapping("/translate")
    public ResponseEntity<?> translateResume(
            @Valid @RequestBody TranslateRequest request,
            HttpServletRequest httpRequest) {
        try {
            String userId = getCurrentUserId(httpRequest);
            String userEmail = getUserEmail(httpRequest);
            String ipAddress = getClientIp(httpRequest);
            String fingerprint = getClientFingerprint(httpRequest);
            logger.info("AI Translate request received");

            if (!isValidLanguage(request.getTargetLanguage())) {
                return ResponseEntity.badRequest().build();
            }

            if (!featureFlagsService.getFlags(userId).isAiEnabled()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Feature disabled"));
            }

            if (!subscriptionService.canUseAIFeatures(userId, userEmail, ipAddress, fingerprint)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Insufficient credits"));
            }

            // ✅ CAPTCHA verification (REQUIRED for AI endpoints)
            if (!verifyCaptcha(request.getCaptchaToken(), ipAddress, true)) {
                logger.warn("🚨 [SECURITY] CAPTCHA verification failed for /translate from IP {}", ipAddress);
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error",
                                "Verificação de segurança obrigatória. Complete o CAPTCHA e tente novamente."));
            }

            Resume originalResume = request.getResume() != null
                    ? request.getResume()
                    : resumeService.getResumeById(request.getResumeId(), userId);
            Resume translatedResume = aiService.translateResume(originalResume, request.getTargetLanguage());

            translatedResume.setId(null); // client will assign UUID
            translatedResume.setUserId(userId);
            translatedResume.setCreatedAt(Instant.now());
            translatedResume.setUpdatedAt(Instant.now());

            if (request.getNewResumeName() != null) {
                translatedResume.setTitle(request.getNewResumeName());
            }

            boolean consumed = subscriptionService.consumeCredits(userId, 1, userEmail, ipAddress, fingerprint);
            if (!consumed) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Insufficient credits"));
            }

            logger.info("AI Translation completed");
            UserSubscription subscription = subscriptionService.getUserSubscription(
                    userId, userEmail, ipAddress, fingerprint);

            // Return the translated resume directly so the client can save it to
            // localStorage
            Map<String, Object> responseBody = new java.util.HashMap<>();
            responseBody.put("translatedResume", translatedResume);
            responseBody.put("targetLanguage", request.getTargetLanguage());
            responseBody.put("creditsUsed", 1);
            responseBody.put("message", "Tradução concluída com sucesso!");

            return ResponseEntity.ok()
                    .header("X-Credits-Remaining", String.valueOf(subscription.getCreditsRemaining()))
                    .body(responseBody);

        } catch (IOException e) {
            logger.error("AI service unavailable for translation", e);
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("error", "Serviço de IA temporariamente indisponível. Tente novamente em instantes."));
        } catch (Exception e) {
            logger.error("Error translating resume", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erro ao traduzir currículo. Tente novamente."));
        }
    }

    @GetMapping("/usage")
    public ResponseEntity<Map<String, Object>> getUsage(
            HttpServletRequest httpRequest) {
        String userId = getCurrentUserId(httpRequest);
        String userEmail = getUserEmail(httpRequest);
        String ipAddress = getClientIp(httpRequest);
        String fingerprint = getClientFingerprint(httpRequest);

        UserSubscription subscription = subscriptionService.getUserSubscription(userId, userEmail, ipAddress,
                fingerprint);

        Map<String, Object> usage = new java.util.HashMap<>();
        usage.put("userId", userId);
        usage.put("creditsRemaining", subscription.getCreditsRemaining());
        usage.put("creditsUsed", subscription.getCreditsUsed());
        usage.put("subscriptionStatus", subscription.getStatus().toString());
        usage.put("subscriptionTier", subscription.getTier().toString());
        usage.put("hasPremiumAccess", subscription.hasPremiumAccess());

        if (subscription.getTrialEndsAt() != null) {
            usage.put("trialEndsAt", subscription.getTrialEndsAt().toString());
        }

        if (subscription.getSubscriptionEnd() != null) {
            usage.put("subscriptionEndsAt", subscription.getSubscriptionEnd().toString());
        }

        return ResponseEntity.ok(usage);
    }

    private boolean isValidLanguage(String lang) {
        return lang != null && (lang.equalsIgnoreCase("pt-BR") ||
                lang.equalsIgnoreCase("fr") ||
                lang.equalsIgnoreCase("es") ||
                lang.equalsIgnoreCase("ja"));
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
     * Verify Turnstile CAPTCHA token
     *
     * @param captchaToken Token from frontend (can be null)
     * @param ipAddress    Client IP
     * @param required     If true, CAPTCHA is mandatory; if false, only verify if
     *                     token is provided
     * @return true if verification passes or CAPTCHA is not required
     */
    private boolean verifyCaptcha(String captchaToken, String ipAddress, boolean required) {
        // If CAPTCHA is not required and no token provided, allow
        if (!required && (captchaToken == null || captchaToken.isBlank())) {
            return true;
        }

        // If CAPTCHA is required but no token provided, deny
        if (required && (captchaToken == null || captchaToken.isBlank())) {
            logger.warn("CAPTCHA required but no token provided from IP: {}", ipAddress);
            return false;
        }

        // Verify the token
        return turnstileService.verify(captchaToken, ipAddress);
    }

    private String getLanguageName(String code) {
        switch (code.toLowerCase()) {
            case "pt-br":
                return "Brazilian Portuguese";
            case "fr":
                return "French";
            case "es":
                return "Spanish";
            case "ja":
                return "Japanese";
            default:
                return "Unknown";
        }
    }
}
