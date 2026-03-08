package com.resuna.controller;

import com.resuna.exception.UnauthorizedException;
import com.resuna.model.Resume;
import com.resuna.model.UserSubscription;
import com.resuna.service.AnalyticsService;
import com.resuna.service.ExportService;
import com.resuna.service.FeatureFlagsService;
import com.resuna.service.PDFSecurityService;
import com.resuna.service.ResumeImportService;
import com.resuna.service.ResumeService;
import com.resuna.service.ResumeTranslationService;
import com.resuna.service.SubscriptionService;
import com.resuna.service.TurnstileService;
import com.resuna.util.SecurityUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ExecutionException;

@RestController
@RequestMapping("/api/resumes")
public class ResumeController {

    private static final Logger logger = LoggerFactory.getLogger(ResumeController.class);

    private final ResumeService resumeService;
    private final ExportService exportService;
    private final AnalyticsService analyticsService;
    private final ResumeImportService resumeImportService;
    private final PDFSecurityService pdfSecurityService;
    private final ResumeTranslationService resumeTranslationService;
    private final FeatureFlagsService featureFlagsService;
    private final SubscriptionService subscriptionService;
    private final TurnstileService turnstileService;
    private final SecurityUtils securityUtils;

    public ResumeController(ResumeService resumeService, ExportService exportService,
            AnalyticsService analyticsService, ResumeImportService resumeImportService,
            PDFSecurityService pdfSecurityService, ResumeTranslationService resumeTranslationService,
            FeatureFlagsService featureFlagsService, SubscriptionService subscriptionService,
            TurnstileService turnstileService, SecurityUtils securityUtils) {
        this.resumeService = resumeService;
        this.exportService = exportService;
        this.analyticsService = analyticsService;
        this.resumeImportService = resumeImportService;
        this.pdfSecurityService = pdfSecurityService;
        this.resumeTranslationService = resumeTranslationService;
        this.featureFlagsService = featureFlagsService;
        this.subscriptionService = subscriptionService;
        this.turnstileService = turnstileService;
        this.securityUtils = securityUtils;
    }

    private String getCurrentUserId(HttpServletRequest request) {
        Object userId = request.getAttribute("userId");
        if (userId == null) {
            throw new UnauthorizedException("User not authenticated");
        }
        return userId.toString();
    }

    @GetMapping
    public ResponseEntity<List<Resume>> getAllResumes(HttpServletRequest request)
            throws ExecutionException, InterruptedException {
        String userId = getCurrentUserId(request);
        List<Resume> resumes = resumeService.getAllResumes(userId);
        return ResponseEntity.ok(resumes);
    }

    @PostMapping
    public ResponseEntity<Resume> createResume(
            @Valid @RequestBody Resume resume,
            HttpServletRequest request) throws ExecutionException, InterruptedException {
        String userId = getCurrentUserId(request);
        Resume createdResume = resumeService.createResume(resume, userId);

        // Log activity (DO NOT log resume title - may contain PII)
        analyticsService.logActivity(userId, null, "CREATE_RESUME",
                String.format("{\"resumeId\":\"%s\"}", createdResume.getId()),
                securityUtils.getSecureClientIp(request), request.getHeader("User-Agent"));

        return ResponseEntity.status(HttpStatus.CREATED).body(createdResume);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Resume> getResumeById(
            @PathVariable String id,
            HttpServletRequest request)
            throws ExecutionException, InterruptedException {
        String userId = getCurrentUserId(request);
        Resume resume = resumeService.getResumeById(id, userId);
        return ResponseEntity.ok(resume);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Resume> updateResume(
            @PathVariable String id,
            @Valid @RequestBody Resume resume,
            HttpServletRequest request)
            throws ExecutionException, InterruptedException {
        String userId = getCurrentUserId(request);
        Resume updatedResume = resumeService.updateResume(id, resume, userId);

        analyticsService.logActivity(userId, null, "UPDATE_RESUME",
                String.format("{\"resumeId\":\"%s\"}", id),
                securityUtils.getSecureClientIp(request), request.getHeader("User-Agent"));

        return ResponseEntity.ok(updatedResume);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteResume(
            @PathVariable String id,
            HttpServletRequest request)
            throws ExecutionException, InterruptedException {
        String userId = getCurrentUserId(request);
        resumeService.deleteResume(id, userId);

        analyticsService.logActivity(userId, null, "DELETE_RESUME",
                String.format("{\"resumeId\":\"%s\"}", id),
                securityUtils.getSecureClientIp(request), request.getHeader("User-Agent"));

        return ResponseEntity.noContent().build();
    }

    private static final Set<String> ALLOWED_LOCALES = Set.of("pt-BR", "en", "pt");

    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> exportToPdf(
            @PathVariable String id,
            @RequestParam(value = "locale", defaultValue = "pt-BR") String locale,
            HttpServletRequest request) throws Exception {
        if (!ALLOWED_LOCALES.contains(locale)) {
            return ResponseEntity.badRequest().body(null);
        }
        String userId = getCurrentUserId(request);
        logger.info("Exporting PDF for resume ID: {} with locale: {} for user: {}", id, locale, userId);
        Resume resume = resumeService.getResumeById(id, userId);
        byte[] pdfBytes = exportService.exportToPdf(resume, locale);

        analyticsService.logActivity(userId, null, "EXPORT_PDF",
                "{\"resumeId\":\"" + id + "\"}",
                securityUtils.getSecureClientIp(request), request.getHeader("User-Agent"));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment",
                sanitizeFilename(resume.getTitle()) + ".pdf");

        return ResponseEntity.ok().headers(headers).body(pdfBytes);
    }

    @GetMapping("/{id}/docx")
    public ResponseEntity<byte[]> exportToDocx(
            @PathVariable String id,
            @RequestParam(value = "locale", defaultValue = "pt-BR") String locale,
            HttpServletRequest request) throws Exception {
        if (!ALLOWED_LOCALES.contains(locale)) {
            return ResponseEntity.badRequest().body(null);
        }
        String userId = getCurrentUserId(request);
        Resume resume = resumeService.getResumeById(id, userId);
        byte[] docxBytes = exportService.exportToDocx(resume, locale);

        analyticsService.logActivity(userId, null, "EXPORT_DOCX",
                "{\"resumeId\":\"" + id + "\"}",
                securityUtils.getSecureClientIp(request), request.getHeader("User-Agent"));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"));
        headers.setContentDispositionFormData("attachment",
                sanitizeFilename(resume.getTitle()) + ".docx");

        return ResponseEntity.ok().headers(headers).body(docxBytes);
    }

    /**
     * Export resume to PDF from request body (localStorage-based workflow).
     *
     * POST /api/resumes/export/pdf?locale=pt-BR
     */
    @PostMapping("/export/pdf")
    public ResponseEntity<byte[]> exportBodyToPdf(
            @RequestBody Resume resume,
            @RequestParam(value = "locale", defaultValue = "pt-BR") String locale,
            HttpServletRequest request) throws Exception {
        if (!ALLOWED_LOCALES.contains(locale)) {
            return ResponseEntity.badRequest().body(null);
        }
        // If no explicit locale given (defaulted to pt-BR), check the resume's own language field
        String effectiveLocale = locale;
        if ("pt-BR".equals(locale) && resume.getLanguage() != null && !resume.getLanguage().isEmpty()) {
            effectiveLocale = resume.getLanguage();
        }
        String userId = getCurrentUserId(request);
        logger.info("Exporting PDF from body with locale: {} for user: {}", effectiveLocale, userId);
        byte[] pdfBytes = exportService.exportToPdf(resume, effectiveLocale);

        logActivitySafely(userId, "EXPORT_PDF",
                "{\"source\":\"body\"}",
                securityUtils.getSecureClientIp(request), request.getHeader("User-Agent"));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment",
                sanitizeFilename(resume.getTitle()) + ".pdf");

        return ResponseEntity.ok().headers(headers).body(pdfBytes);
    }

    /**
     * Export resume to DOCX from request body (localStorage-based workflow).
     *
     * POST /api/resumes/export/docx
     */
    @PostMapping("/export/docx")
    public ResponseEntity<byte[]> exportBodyToDocx(
            @RequestBody Resume resume,
            @RequestParam(value = "locale", defaultValue = "pt-BR") String locale,
            HttpServletRequest request) throws Exception {
        if (!ALLOWED_LOCALES.contains(locale)) {
            return ResponseEntity.badRequest().body(null);
        }
        String userId = getCurrentUserId(request);
        byte[] docxBytes = exportService.exportToDocx(resume, locale);

        logActivitySafely(userId, "EXPORT_DOCX",
                "{\"source\":\"body\"}",
                securityUtils.getSecureClientIp(request), request.getHeader("User-Agent"));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"));
        headers.setContentDispositionFormData("attachment",
                sanitizeFilename(resume.getTitle()) + ".docx");

        return ResponseEntity.ok().headers(headers).body(docxBytes);
    }

    /**
     * Translate resume from body to English without saving to DB.
     *
     * POST /api/resumes/export/translate
     */
    @PostMapping("/export/translate")
    public ResponseEntity<?> exportTranslate(
            @RequestBody Resume resume,
            HttpServletRequest request) {
        String userId = getCurrentUserId(request);
        String userEmail = getUserEmail(request);

        // CAPTCHA not required here — user is authenticated via Firebase and credits are consumed below.
        ResponseEntity<?> guard = checkAiGuards(userId, userEmail, request, false);
        if (guard != null) return guard;

        try {
            Resume translatedResume = resumeTranslationService.translateToEnglish(resume);
            String originalTitle = translatedResume.getTitle();
            if (originalTitle != null && !originalTitle.contains("(English)")) {
                translatedResume.setTitle(originalTitle + " (English)");
            }

            boolean consumed = consumeAiCredits(userId, userEmail, request);
            if (!consumed) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Insufficient credits"));
            }

            logActivitySafely(userId, "TRANSLATE_RESUME",
                    "{\"source\":\"body\",\"targetLanguage\":\"en\"}",
                    securityUtils.getSecureClientIp(request), request.getHeader("User-Agent"));

            UserSubscription subscription = subscriptionService.getUserSubscription(
                    userId, userEmail,
                    securityUtils.getSecureClientIp(request),
                    securityUtils.getClientFingerprint(request));
            return ResponseEntity.ok()
                    .header("X-Credits-Remaining", String.valueOf(subscription.getCreditsRemaining()))
                    .body(translatedResume);

        } catch (IOException e) {
            logger.warn("Translation temporarily failed: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of(
                    "errorCode", "TRANSLATION_TEMPORARY_FAILURE",
                    "message", "Não foi possível traduzir o currículo agora. Tente novamente em instantes.",
                    "retryable", true));
        } catch (Exception e) {
            logger.error("Failed to translate resume from body: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "errorCode", "TRANSLATION_UNEXPECTED_FAILURE",
                            "message", "Falha ao traduzir currículo. Tente novamente.",
                            "retryable", false));
        }
    }

    /**
     * Import resume data from a PDF file.
     *
     * POST /api/resumes/import-pdf
     * Content-Type: multipart/form-data
     *
     * @param file The PDF resume file to extract data from
     * @return Extracted resume data as a structured Resume object
     */
    @PostMapping(value = "/import-pdf", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> importFromPdf(
            @RequestParam("file") MultipartFile file,
            HttpServletRequest request) throws IOException {
        String userId = getCurrentUserId(request);
        String userEmail = getUserEmail(request);

        // Guard: feature flags + credits only (no CAPTCHA — import is data extraction, not AI generation)
        if (!featureFlagsService.getFlags(userId).isAiEnabled()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Feature disabled for your account"));
        }
        String ipAddress = securityUtils.getSecureClientIp(request);
        String fingerprint = securityUtils.getClientFingerprint(request);
        if (!subscriptionService.canUseAIFeatures(userId, userEmail, ipAddress, fingerprint)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Insufficient credits. Please purchase more to continue."));
        }

        // Validate file
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Arquivo PDF é obrigatório"));
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.equalsIgnoreCase("application/pdf")) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "O arquivo deve ser um PDF"));
        }

        if (file.getSize() > 5 * 1024 * 1024) { // 5MB limit
            return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
                    .body(Map.of("error", "O arquivo é muito grande (máximo 5MB)"));
        }

        // Security validation: Check for malicious PDFs and prompt injection
        try {
            pdfSecurityService.validatePDF(file);
        } catch (PDFSecurityService.SecurityException e) {
            logger.error("Security validation failed for user {}: {}", userId, e.getMessage());
            logActivitySafely(userId, "SECURITY_ALERT",
                    "{\"type\":\"pdf_import_validation_failed\",\"reason\":\"" + e.getMessage() + "\"}",
                    securityUtils.getSecureClientIp(request), request.getHeader("User-Agent"));
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "PDF inválido ou não seguro"));
        } catch (IOException e) {
            logger.error("Failed to validate PDF for user {}: {}", userId, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erro ao validar PDF"));
        }

        try {
            // Use AI to extract structured resume data
            Map<String, Object> extractedData = resumeImportService.extractResumeData(file);

            boolean consumed = consumeAiCredits(userId, userEmail, request);
            if (!consumed) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Insufficient credits"));
            }

            logActivitySafely(userId, "IMPORT_PDF_RESUME",
                    "{\"success\":true}",
                    securityUtils.getSecureClientIp(request), request.getHeader("User-Agent"));

            UserSubscription subscription = subscriptionService.getUserSubscription(
                    userId, userEmail,
                    securityUtils.getSecureClientIp(request),
                    securityUtils.getClientFingerprint(request));
            return ResponseEntity.ok()
                    .header("X-Credits-Remaining", String.valueOf(subscription.getCreditsRemaining()))
                    .body(extractedData);

        } catch (IOException e) {
            logActivitySafely(userId, "IMPORT_PDF_RESUME_FAILED",
                    "{\"error\":\"io_exception\"}",
                    securityUtils.getSecureClientIp(request), request.getHeader("User-Agent"));
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Falha ao processar PDF"));
        }
    }

    /**
     * Translate resume from Portuguese to English using AI.
     *
     * POST /api/resumes/{id}/translate
     *
     * @param id The resume ID to translate
     * @return Translated resume JSON (creates new resume with translated content)
     */
    @PostMapping("/{id}/translate")
    public ResponseEntity<?> translateResume(
            @PathVariable String id,
            HttpServletRequest request) {
        String userId = getCurrentUserId(request);
        String userEmail = getUserEmail(request);

        ResponseEntity<?> guard = checkAiGuards(userId, userEmail, request);
        if (guard != null) return guard;

        try {
            Resume resume = resumeService.getResumeById(id, userId);
            Resume translatedResume = resumeTranslationService.translateToEnglish(resume);
            logger.info("Translation completed for resume {}", id);

            String originalTitle = translatedResume.getTitle();
            if (originalTitle != null && !originalTitle.contains("(English)")) {
                translatedResume.setTitle(originalTitle + " (English)");
            }

            translatedResume.setId(null);
            Resume savedTranslatedResume = resumeService.createResume(translatedResume, userId);

            boolean consumed = consumeAiCredits(userId, userEmail, request);
            if (!consumed) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Insufficient credits"));
            }

            logActivitySafely(userId, "TRANSLATE_RESUME",
                    "{\"originalResumeId\":\"" + id + "\",\"translatedResumeId\":\"" + savedTranslatedResume.getId() + "\",\"targetLanguage\":\"en\"}",
                    securityUtils.getSecureClientIp(request), request.getHeader("User-Agent"));

            UserSubscription subscription = subscriptionService.getUserSubscription(
                    userId, userEmail,
                    securityUtils.getSecureClientIp(request),
                    securityUtils.getClientFingerprint(request));
            return ResponseEntity.ok()
                    .header("X-Credits-Remaining", String.valueOf(subscription.getCreditsRemaining()))
                    .body(savedTranslatedResume);

        } catch (IOException e) {
            logger.warn("Translation temporarily failed for resume {}: {}", id, e.getMessage());
            logActivitySafely(userId, "TRANSLATE_RESUME_FAILED",
                    "{\"resumeId\":\"" + id + "\",\"error\":\"" + e.getMessage() + "\"}",
                    securityUtils.getSecureClientIp(request), request.getHeader("User-Agent"));

            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of(
                    "errorCode", "TRANSLATION_TEMPORARY_FAILURE",
                    "message", "Não foi possível traduzir o currículo agora. Tente novamente em instantes.",
                    "retryable", true));
        } catch (Exception e) {
            logger.error("Failed to translate resume {}: {}", id, e.getMessage());
            logActivitySafely(userId, "TRANSLATE_RESUME_FAILED",
                    "{\"resumeId\":\"" + id + "\",\"error\":\"unexpected_error\"}",
                    securityUtils.getSecureClientIp(request), request.getHeader("User-Agent"));
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "errorCode", "TRANSLATION_UNEXPECTED_FAILURE",
                            "message", "Falha ao traduzir currículo. Tente novamente.",
                            "retryable", false));
        }
    }

    /**
     * Guard for AI-powered routes: feature flags → credits → CAPTCHA (required when enabled).
     * Returns a non-null error ResponseEntity if the request should be rejected, null if allowed.
     * Captcha token is read from the X-Captcha-Token header.
     */
    private ResponseEntity<?> checkAiGuards(String userId, String userEmail, HttpServletRequest request) {
        return checkAiGuards(userId, userEmail, request, true);
    }

    /** Same as checkAiGuards but optionally skips CAPTCHA verification. */
    private ResponseEntity<?> checkAiGuards(String userId, String userEmail, HttpServletRequest request, boolean requireCaptcha) {
        if (!featureFlagsService.getFlags(userId).isAiEnabled()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Feature disabled for your account"));
        }

        String ipAddress = securityUtils.getSecureClientIp(request);
        String fingerprint = securityUtils.getClientFingerprint(request);

        if (!subscriptionService.canUseAIFeatures(userId, userEmail, ipAddress, fingerprint)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Insufficient credits. Please purchase more to continue."));
        }

        if (requireCaptcha) {
            String captchaToken = request.getHeader("X-Captcha-Token");
            if (!turnstileService.verify(captchaToken, ipAddress)) {
                logger.warn("🚨 [SECURITY] CAPTCHA verification failed for user {} on AI route", userId);
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Verificação de segurança obrigatória. Complete o CAPTCHA e tente novamente."));
            }
        }

        return null; // all checks passed
    }

    private boolean consumeAiCredits(String userId, String userEmail, HttpServletRequest request) {
        String ipAddress = securityUtils.getSecureClientIp(request);
        String fingerprint = securityUtils.getClientFingerprint(request);
        return subscriptionService.consumeCredits(userId, 1, userEmail, ipAddress, fingerprint);
    }

    private String getUserEmail(HttpServletRequest request) {
        Object email = request.getAttribute("userEmail");
        return email != null ? email.toString() : null;
    }

    private String sanitizeFilename(String filename) {
        if (filename == null)
            return "resume";
        return filename.replaceAll("[^a-zA-Z0-9-_]", "_");
    }

    private void logActivitySafely(String userId, String action, String details, String ipAddress, String userAgent) {
        try {
            analyticsService.logActivity(userId, null, action, details, ipAddress, userAgent);
        } catch (RuntimeException ex) {
            logger.warn("Failed to enqueue analytics action '{}': {}", action, ex.getMessage());
        }
    }
}
