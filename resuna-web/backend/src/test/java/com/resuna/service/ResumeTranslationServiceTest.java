package com.resuna.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.resuna.model.Resume;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ResumeTranslationServiceTest {

    private OpenRouterService openRouterService;
    private ResumeTranslationService resumeTranslationService;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        openRouterService = mock(OpenRouterService.class);
        objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());
        resumeTranslationService = new ResumeTranslationService(openRouterService, objectMapper);
    }

    @Test
    @DisplayName("translateToEnglish throws when AI does not return valid JSON")
    void translateToEnglish_throwsOnInvalidJson() throws Exception {
        Resume original = buildPortugueseResume();
        when(openRouterService.generateText(anyString())).thenReturn("invalid response");

        IOException ex = assertThrows(IOException.class,
                () -> resumeTranslationService.translateToEnglish(original));

        assertTrue(ex.getMessage().contains("Failed to translate"));
    }

    @Test
    @DisplayName("translateToEnglish throws when AI returns unchanged source content")
    void translateToEnglish_throwsWhenUnchanged() throws Exception {
        Resume original = buildPortugueseResume();
        String unchangedJson = objectMapper.writeValueAsString(original);
        when(openRouterService.generateText(anyString())).thenReturn(unchangedJson);

        IOException ex = assertThrows(IOException.class,
                () -> resumeTranslationService.translateToEnglish(original));

        assertTrue(ex.getMessage().contains("Failed to translate"));
    }

    @Test
    @DisplayName("translateToEnglish returns translated resume and preserves metadata")
    void translateToEnglish_returnsTranslatedResume() throws Exception {
        Resume original = buildPortugueseResume();
        Resume translatedPayload = buildEnglishResumePayload();

        String translatedJson = objectMapper.writeValueAsString(translatedPayload);
        when(openRouterService.generateText(anyString())).thenReturn(translatedJson);

        Resume translated = resumeTranslationService.translateToEnglish(original);

        assertNotNull(translated);
        assertEquals("Professional Software Engineer", translated.getTitle());
        assertEquals("Software engineer focused on backend APIs.", translated.getSummary());
        assertEquals("id-original", translated.getId(), "Original ID must be preserved before persistence layer changes it");
        assertEquals("user-123", translated.getUserId());
        assertEquals(original.getCreatedAt(), translated.getCreatedAt());
        assertEquals(original.getUpdatedAt(), translated.getUpdatedAt());
    }

    private Resume buildPortugueseResume() {
        Resume resume = new Resume();
        resume.setId("id-original");
        resume.setUserId("user-123");
        resume.setTitle("Engenheiro de Software");
        resume.setSummary("Engenheiro de software com foco em APIs backend.");
        resume.setSkills(List.of("Java", "Spring Boot"));
        resume.setCreatedAt(Instant.parse("2026-01-01T10:00:00Z"));
        resume.setUpdatedAt(Instant.parse("2026-01-02T10:00:00Z"));

        Resume.Experience exp = new Resume.Experience();
        exp.setTitle("Desenvolvedor Backend");
        exp.setCompany("Empresa X");
        exp.setBullets(List.of("Desenvolvi APIs REST para integração."));
        resume.setExperience(List.of(exp));

        Resume.Education edu = new Resume.Education();
        edu.setDegree("Bacharelado em Ciência da Computação");
        edu.setInstitution("Universidade Y");
        resume.setEducation(List.of(edu));

        return resume;
    }

    private Resume buildEnglishResumePayload() {
        Resume resume = new Resume();
        resume.setTitle("Professional Software Engineer");
        resume.setSummary("Software engineer focused on backend APIs.");
        resume.setSkills(List.of("Java", "Spring Boot"));

        Resume.Experience exp = new Resume.Experience();
        exp.setTitle("Backend Developer");
        exp.setCompany("Company X");
        exp.setBullets(List.of("Developed REST APIs for integrations."));
        resume.setExperience(List.of(exp));

        Resume.Education edu = new Resume.Education();
        edu.setDegree("Bachelor in Computer Science");
        edu.setInstitution("University Y");
        resume.setEducation(List.of(edu));

        return resume;
    }
}
