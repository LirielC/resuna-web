package com.resuna.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.resuna.model.Resume;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.*;

/**
 * Service for translating resumes using AI (Portuguese to English only).
 */
@Service
public class ResumeTranslationService {

    private static final Logger logger = LoggerFactory.getLogger(ResumeTranslationService.class);
    private final OpenRouterService openRouterService;
    private final ObjectMapper objectMapper;

    public ResumeTranslationService(OpenRouterService openRouterService, ObjectMapper objectMapper) {
        this.openRouterService = openRouterService;
        this.objectMapper = objectMapper;
    }

    /**
     * Translate resume from Portuguese to English using AI.
     * Returns the full Resume object with all fields translated.
     */
    public Resume translateToEnglish(Resume resume) throws IOException {
        String prompt = buildTranslationPrompt(resume);
        String aiResponse = openRouterService.generateText(prompt);

        return parseTranslatedResume(aiResponse, resume);
    }

    private String buildTranslationPrompt(Resume resume) throws IOException {
        // Serialize resume to JSON for AI
        String resumeJson = objectMapper.writeValueAsString(resume);

        return """
            You are a professional translator specializing in resumes/CVs. Translate the following resume from Portuguese to English.

            CRITICAL RULES:
            1. Return ONLY valid JSON, no markdown, no explanations, no text before or after
            2. Translate ALL text fields (title, summary, bullets, skills, everything)
            3. Keep the EXACT same JSON structure
            4. Do NOT translate: dates, emails, phone numbers, URLs, proper names (people, companies, universities)
            5. Use professional, ATS-friendly English
            6. Maintain technical terms appropriately (e.g., "JavaScript" stays "JavaScript")

            INPUT RESUME (Portuguese):
            """ + resumeJson + """

            OUTPUT: Return the complete translated resume as JSON with the same structure.
            """;
    }

    private Resume parseTranslatedResume(String aiResponse, Resume originalResume) throws IOException {
        try {
            if (aiResponse == null || aiResponse.isBlank()) {
                throw new IOException("Empty translation response from AI");
            }

            logger.debug("AI Translation response received (length: {})", aiResponse.length());

            // Extract JSON from response
            String jsonStr = extractJSON(aiResponse);

            logger.debug("Extracted JSON length: {}", jsonStr.length());

            // Parse the translated resume
            Resume translatedResume = objectMapper.readValue(jsonStr, Resume.class);

            // Preserve metadata from original
            translatedResume.setId(originalResume.getId());
            translatedResume.setUserId(originalResume.getUserId());
            translatedResume.setCreatedAt(originalResume.getCreatedAt());
            translatedResume.setUpdatedAt(originalResume.getUpdatedAt());

            // Fail closed: if translation is effectively identical to source, treat as failure.
            if (isEffectivelyUnchanged(originalResume, translatedResume)) {
                throw new IOException("AI returned untranslated content");
            }

            logger.info("Successfully translated resume {}", originalResume.getId());
            return translatedResume;

        } catch (Exception e) {
            logger.error("Failed to parse translated resume: {} (response length: {})",
                e.getMessage(), aiResponse != null ? aiResponse.length() : 0);
            throw new IOException("Failed to translate resume content into valid English JSON", e);
        }
    }

    private String extractJSON(String text) {
        // Remove markdown code blocks if present
        text = text.trim();
        if (text.startsWith("```json")) {
            text = text.substring(7);
        } else if (text.startsWith("```")) {
            text = text.substring(3);
        }
        if (text.endsWith("```")) {
            text = text.substring(0, text.length() - 3);
        }

        // Find first { and last }
        int start = text.indexOf('{');
        int end = text.lastIndexOf('}');

        if (start >= 0 && end > start) {
            return text.substring(start, end + 1);
        }

        return text.trim();
    }

    private boolean isEffectivelyUnchanged(Resume original, Resume translated) {
        String source = normalize(buildTextFingerprint(original));
        String target = normalize(buildTextFingerprint(translated));

        if (source.isBlank() || target.isBlank()) {
            return false;
        }

        return source.equals(target);
    }

    private String buildTextFingerprint(Resume resume) {
        if (resume == null) {
            return "";
        }

        StringBuilder sb = new StringBuilder();

        appendText(sb, resume.getTitle());
        appendText(sb, resume.getSummary());

        if (resume.getExperience() != null) {
            for (Resume.Experience exp : resume.getExperience()) {
                appendText(sb, exp.getTitle());
                appendText(sb, exp.getCompany());
                appendText(sb, exp.getLocation());
                if (exp.getBullets() != null) {
                    for (String bullet : exp.getBullets()) {
                        appendText(sb, bullet);
                    }
                }
            }
        }

        if (resume.getProjects() != null) {
            for (Resume.Project proj : resume.getProjects()) {
                appendText(sb, proj.getName());
                appendText(sb, proj.getDescription());
                if (proj.getBullets() != null) {
                    for (String bullet : proj.getBullets()) {
                        appendText(sb, bullet);
                    }
                }
            }
        }

        if (resume.getEducation() != null) {
            for (Resume.Education edu : resume.getEducation()) {
                appendText(sb, edu.getDegree());
                appendText(sb, edu.getInstitution());
                appendText(sb, edu.getLocation());
            }
        }

        if (resume.getSkills() != null) {
            for (String skill : resume.getSkills()) {
                appendText(sb, skill);
            }
        }

        if (resume.getCertifications() != null) {
            for (Resume.Certification cert : resume.getCertifications()) {
                appendText(sb, cert.getName());
                appendText(sb, cert.getIssuer());
            }
        }

        if (resume.getLanguages() != null) {
            for (Resume.Language lang : resume.getLanguages()) {
                appendText(sb, lang.getName());
                appendText(sb, lang.getLevel());
            }
        }

        return sb.toString();
    }

    private void appendText(StringBuilder sb, String value) {
        if (value == null || value.isBlank()) {
            return;
        }
        if (sb.length() > 0) {
            sb.append(' ');
        }
        sb.append(value);
    }

    private String normalize(String value) {
        if (value == null) {
            return "";
        }
        return value.toLowerCase(Locale.ROOT)
                .replaceAll("\\s+", " ")
                .replaceAll("[^\\p{L}\\p{N} ]", "")
                .trim();
    }
}
