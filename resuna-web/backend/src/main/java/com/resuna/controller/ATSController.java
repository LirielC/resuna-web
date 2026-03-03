package com.resuna.controller;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.resuna.exception.UnauthorizedException;
import com.resuna.model.ATSAnalysisRequest;
import com.resuna.model.ATSAnalysisResult;
import com.resuna.model.ATSScore;
import com.resuna.model.PDFAnalysisResponse;
import com.resuna.service.ATSService;
import com.resuna.service.AnalyticsService;
import com.resuna.service.FeatureFlagsService;
import com.resuna.service.PDFAnalysisService;
import com.resuna.service.PDFSecurityService;
import com.resuna.service.SubscriptionService;
import com.resuna.service.TurnstileService;
import com.resuna.util.SecurityUtils;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * REST controller for ATS analysis operations.
 */
@RestController
@RequestMapping("/api/ats")
public class ATSController {

    private static final Logger logger = LoggerFactory.getLogger(ATSController.class);

    private final ATSService atsService;
    private final PDFAnalysisService pdfAnalysisService;
    private final AnalyticsService analyticsService;
    private final SubscriptionService subscriptionService;
    private final FeatureFlagsService featureFlagsService;
    private final PDFSecurityService pdfSecurityService;
    private final TurnstileService turnstileService;
    private final SecurityUtils securityUtils;
    private static final long MAX_PDF_SIZE_BYTES = 5 * 1024 * 1024;

    public ATSController(ATSService atsService, PDFAnalysisService pdfAnalysisService,
            AnalyticsService analyticsService, SubscriptionService subscriptionService,
            FeatureFlagsService featureFlagsService, PDFSecurityService pdfSecurityService,
            TurnstileService turnstileService, SecurityUtils securityUtils) {
        this.atsService = atsService;
        this.pdfAnalysisService = pdfAnalysisService;
        this.analyticsService = analyticsService;
        this.subscriptionService = subscriptionService;
        this.featureFlagsService = featureFlagsService;
        this.pdfSecurityService = pdfSecurityService;
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

    /**
     * Analyze resume against job description.
     * 
     * POST /api/ats/analyze
     * Body: {
     * "resumeId": "uuid",
     * "jobDescription": "...",
     * "jobTitle": "Software Engineer",
     * "company": "Google"
     * }
     */
    @PostMapping("/analyze")
    public ResponseEntity<?> analyzeResume(
            @Valid @RequestBody ATSAnalysisRequest request,
            HttpServletRequest httpRequest) throws Exception {
        String userId = getCurrentUserId(httpRequest);
        String userEmail = getUserEmail(httpRequest);
        String ipAddress = securityUtils.getSecureClientIp(httpRequest);
        String fingerprint = getClientFingerprint(httpRequest);
        if (!featureFlagsService.getFlags(userId).isAtsEnabled()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Feature disabled"));
        }
        if (request.getJobDescription() != null
                && pdfSecurityService.detectPromptInjection(request.getJobDescription())) {
            logger.warn("Prompt injection attempt detected in job description from user {}", userId);
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Invalid content in job description"));
        }
        if (!subscriptionService.canUseAIFeatures(userId, userEmail, ipAddress, fingerprint)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Insufficient credits"));
        }
        ATSAnalysisResult result = atsService.analyze(request, userId);
        boolean consumed = subscriptionService.consumeCredits(userId, 1, userEmail, ipAddress, fingerprint);
        if (!consumed) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Insufficient credits"));
        }

        analyticsService.logActivity(userId, null, "ATS_ANALYSIS",
                "{\"resumeId\":\"" + request.getResumeId() + "\",\"score\":" + result.getScore() + "}",
                httpRequest.getRemoteAddr(), httpRequest.getHeader("User-Agent"));

        return ResponseEntity.status(HttpStatus.CREATED)
                .header("X-Credits-Remaining", String.valueOf(
                        subscriptionService.getUserSubscription(userId, userEmail, ipAddress, fingerprint)
                                .getCreditsRemaining()))
                .body(result);
    }

    /**
     * Get ATS score for a resume (latest analysis).
     * 
     * GET /api/ats/score/{resumeId}
     */
    @GetMapping("/score/{resumeId}")
    public ResponseEntity<ATSScore> getScore(
            @PathVariable String resumeId,
            HttpServletRequest request) {
        String userId = getCurrentUserId(request);
        ATSScore score = atsService.getScore(resumeId, userId);
        return ResponseEntity.ok(score);
    }

    /**
     * Get all analyses for a resume.
     * 
     * GET /api/ats/analyses/resume/{resumeId}
     */
    @GetMapping("/analyses/resume/{resumeId}")
    public ResponseEntity<List<ATSAnalysisResult>> getAnalysesByResumeId(
            @PathVariable String resumeId,
            HttpServletRequest request) {
        String userId = getCurrentUserId(request);
        List<ATSAnalysisResult> analyses = atsService.getAnalysesByResumeId(resumeId, userId);
        return ResponseEntity.ok(analyses);
    }

    /**
     * Get all analyses for the current user.
     * 
     * GET /api/ats/analyses
     */
    @GetMapping("/analyses")
    public ResponseEntity<List<ATSAnalysisResult>> getAnalysesByUserId(
            HttpServletRequest request) {
        String userId = getCurrentUserId(request);
        List<ATSAnalysisResult> analyses = atsService.getAnalysesByUserId(userId);
        return ResponseEntity.ok(analyses);
    }

    /**
     * Delete an analysis.
     * 
     * DELETE /api/ats/analyses/{analysisId}
     */
    @DeleteMapping("/analyses/{analysisId}")
    public ResponseEntity<Void> deleteAnalysis(
            @PathVariable String analysisId,
            HttpServletRequest request) {
        String userId = getCurrentUserId(request);
        atsService.deleteAnalysis(analysisId, userId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Analyze a PDF resume against a job description.
     * 
     * POST /api/ats/analyze-pdf
     * Content-Type: multipart/form-data
     * 
     * @param file           The PDF resume file
     * @param jobDescription The job description to match against
     */
    @PostMapping(value = "/analyze-pdf", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> analyzePdf(
            @RequestParam("file") MultipartFile file,
            @RequestParam("jobDescription") String jobDescription,
            @RequestParam(value = "language", defaultValue = "pt-BR") String language,
            HttpServletRequest httpRequest) throws IOException {
        String userId = getCurrentUserId(httpRequest);
        String userEmail = getUserEmail(httpRequest);
        String ipAddress = securityUtils.getSecureClientIp(httpRequest);
        String fingerprint = getClientFingerprint(httpRequest);
        if (!featureFlagsService.getFlags(userId).isAtsEnabled()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Feature disabled"));
        }
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        if (jobDescription == null || jobDescription.isBlank() || jobDescription.length() > 8000) {
            return ResponseEntity.badRequest().build();
        }
        if (pdfSecurityService.detectPromptInjection(jobDescription)) {
            logger.warn("Prompt injection attempt in job description from user {}", userId);
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Invalid content in job description"));
        }
        if (file.getSize() > MAX_PDF_SIZE_BYTES) {
            return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).build();
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.equalsIgnoreCase("application/pdf")) {
            return ResponseEntity.badRequest().build();
        }
        if (!hasPdfSignature(file)) {
            return ResponseEntity.badRequest().build();
        }

        // Security validation: Check for malicious PDFs and prompt injection
        try {
            pdfSecurityService.validatePDF(file);
        } catch (PDFSecurityService.SecurityException e) {
            logger.error("Security validation failed for user {}: {}", userId, e.getMessage());
            analyticsService.logActivity(userId, null, "SECURITY_ALERT",
                "{\"type\":\"pdf_validation_failed\",\"reason\":\"" + e.getMessage() + "\"}",
                httpRequest.getRemoteAddr(), httpRequest.getHeader("User-Agent"));
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Invalid or unsafe PDF file"));
        }

        if (!subscriptionService.canUseAIFeatures(userId, userEmail, ipAddress, fingerprint)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Insufficient credits"));
        }
        PDFAnalysisResponse result;
        try {
            result = pdfAnalysisService.analyze(file, jobDescription, language);
        } catch (PDFSecurityService.SecurityException e) {
            logger.warn("Security issue in PDF content for user {}: {}", userId, e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Conteúdo suspeito detectado no PDF ou na descrição da vaga"));
        } catch (java.io.IOException e) {
            logger.error("Failed to extract text from PDF for user {}", userId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Falha ao processar o PDF. Verifique se o arquivo não está corrompido."));
        }
        boolean consumed = subscriptionService.consumeCredits(userId, 1, userEmail, ipAddress, fingerprint);
        if (!consumed) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Insufficient credits"));
        }

        // Log activity (DO NOT log fileName - may contain PII)
        analyticsService.logActivity(userId, null, "ATS_ANALYSIS_PDF",
                "{\"score\":" + result.getScore() + "}",
                httpRequest.getRemoteAddr(), httpRequest.getHeader("User-Agent"));

        return ResponseEntity.ok()
                .header("X-Credits-Remaining", String.valueOf(
                        subscriptionService.getUserSubscription(userId, userEmail, ipAddress, fingerprint)
                                .getCreditsRemaining()))
                .body(result);
    }

    private String getUserEmail(HttpServletRequest request) {
        Object email = request.getAttribute("userEmail");
        return email != null ? email.toString() : null;
    }

    /**
     * Extract keywords from a job description (free — no credits required).
     *
     * POST /api/ats/extract-keywords
     * Body: { "jobDescription": "..." }
     */
    @PostMapping("/extract-keywords")
    public ResponseEntity<?> extractKeywords(
            @RequestBody Map<String, String> body,
            HttpServletRequest request) {
        getCurrentUserId(request); // ensures user is authenticated

        String jobDescription = body.get("jobDescription");
        if (jobDescription == null || jobDescription.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "jobDescription is required"));
        }
        if (jobDescription.length() > 10000) {
            return ResponseEntity.badRequest().body(Map.of("error", "jobDescription too long (max 10000 chars)"));
        }

        // Reuse existing prompt injection detection
        if (pdfSecurityService.detectPromptInjection(jobDescription)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid content in job description"));
        }

        Map<String, List<String>> keywords = atsService.extractKeywords(jobDescription);
        int total = keywords.values().stream().mapToInt(List::size).sum();

        return ResponseEntity.ok(Map.of("keywords", keywords, "total", total));
    }

    private String getClientFingerprint(HttpServletRequest request) {
        String fingerprint = request.getHeader("X-Client-Fingerprint");
        return (fingerprint != null && !fingerprint.isBlank()) ? fingerprint : null;
    }

    private boolean hasPdfSignature(MultipartFile file) throws IOException {
        byte[] signature = new byte[5];
        try (InputStream inputStream = file.getInputStream()) {
            int read = inputStream.read(signature);
            if (read < signature.length) {
                return false;
            }
        }
        return signature[0] == '%' && signature[1] == 'P' && signature[2] == 'D'
                && signature[3] == 'F' && signature[4] == '-';
    }
}
