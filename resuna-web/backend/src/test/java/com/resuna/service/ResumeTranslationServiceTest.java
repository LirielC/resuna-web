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
        when(openRouterService.generateJson(anyString())).thenReturn("invalid response");

        IOException ex = assertThrows(IOException.class,
                () -> resumeTranslationService.translateToEnglish(original));

        assertTrue(ex.getMessage().contains("Failed to translate"));
    }

    @Test
    @DisplayName("translateToEnglish throws when AI returns unchanged source content")
    void translateToEnglish_throwsWhenUnchanged() throws Exception {
        Resume original = buildPortugueseResume();
        String unchangedJson = objectMapper.writeValueAsString(original);
        when(openRouterService.generateJson(anyString())).thenReturn(unchangedJson);

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
        when(openRouterService.generateJson(anyString())).thenReturn(translatedJson);

        Resume translated = resumeTranslationService.translateToEnglish(original);

        assertNotNull(translated);
        assertEquals("Professional Software Engineer", translated.getTitle());
        assertEquals("Software engineer focused on backend APIs.", translated.getSummary());
        assertEquals("id-original", translated.getId(), "Original ID must be preserved before persistence layer changes it");
        assertEquals("user-123", translated.getUserId());
        assertEquals(original.getCreatedAt(), translated.getCreatedAt());
        assertEquals(original.getUpdatedAt(), translated.getUpdatedAt());
    }

    // ── Location normalization ────────────────────────────────────────────────

    @Test
    @DisplayName("normalizeLocationForEnglish converts 'City, SP' to 'City, Brazil'")
    void normalizeLocation_stateCode() {
        assertEquals("São Paulo, Brazil",
                resumeTranslationService.normalizeLocationForEnglish("São Paulo, SP"));
    }

    @Test
    @DisplayName("normalizeLocationForEnglish handles all BR state codes")
    void normalizeLocation_allStateCodes() {
        assertEquals("Curitiba, Brazil",
                resumeTranslationService.normalizeLocationForEnglish("Curitiba, PR"));
        assertEquals("Rio de Janeiro, Brazil",
                resumeTranslationService.normalizeLocationForEnglish("Rio de Janeiro, RJ"));
        assertEquals("Belo Horizonte, Brazil",
                resumeTranslationService.normalizeLocationForEnglish("Belo Horizonte, MG"));
        assertEquals("Brasília, Brazil",
                resumeTranslationService.normalizeLocationForEnglish("Brasília, DF"));
    }

    @Test
    @DisplayName("normalizeLocationForEnglish normalizes 'Brasil' spelling to 'Brazil'")
    void normalizeLocation_brasilSpelling() {
        assertEquals("São Paulo, Brazil",
                resumeTranslationService.normalizeLocationForEnglish("São Paulo, Brasil"));
    }

    @Test
    @DisplayName("normalizeLocationForEnglish strips extra segments like 'City, SP, Brasil'")
    void normalizeLocation_withCountrySuffix() {
        assertEquals("Campinas, Brazil",
                resumeTranslationService.normalizeLocationForEnglish("Campinas, SP, Brasil"));
    }

    @Test
    @DisplayName("normalizeLocationForEnglish leaves non-Brazilian locations unchanged")
    void normalizeLocation_nonBrazilian() {
        assertEquals("San Francisco, CA",
                resumeTranslationService.normalizeLocationForEnglish("San Francisco, CA"));
        assertEquals("Remote",
                resumeTranslationService.normalizeLocationForEnglish("Remote"));
    }

    @Test
    @DisplayName("normalizeLocationForEnglish handles null and blank gracefully")
    void normalizeLocation_nullAndBlank() {
        assertNull(resumeTranslationService.normalizeLocationForEnglish(null));
        assertEquals("  ", resumeTranslationService.normalizeLocationForEnglish("  "));
    }

    @Test
    @DisplayName("translateToEnglish normalizes personalInfo.location when state code is present")
    void translateToEnglish_normalizesPersonalInfoLocation() throws Exception {
        Resume original = buildPortugueseResume();
        Resume.PersonalInfo pi = new Resume.PersonalInfo();
        pi.setFullName("Maria Silva");
        pi.setEmail("maria@example.com");
        pi.setLocation("São Paulo, SP");
        original.setPersonalInfo(pi);

        Resume translatedPayload = buildEnglishResumePayload();
        Resume.PersonalInfo translatedPi = new Resume.PersonalInfo();
        translatedPi.setFullName("Maria Silva");
        translatedPi.setEmail("maria@example.com");
        translatedPi.setLocation("São Paulo, SP");
        translatedPayload.setPersonalInfo(translatedPi);

        String translatedJson = objectMapper.writeValueAsString(translatedPayload);
        when(openRouterService.generateJson(anyString())).thenReturn(translatedJson);

        Resume result = resumeTranslationService.translateToEnglish(original);

        assertEquals("São Paulo, Brazil", result.getPersonalInfo().getLocation());
    }

    // ── Institution name translation ─────────────────────────────────────────

    @Test
    @DisplayName("translateInstitutionName: Universidade Federal do → Federal University of")
    void translateInstitution_federalUniversity() {
        assertEquals("Federal University of Rio de Janeiro",
                resumeTranslationService.translateInstitutionName("Universidade Federal do Rio de Janeiro"));
    }

    @Test
    @DisplayName("translateInstitutionName: Universidade do Estado do → State University of")
    void translateInstitution_stateUniversityDoEstado() {
        assertEquals("State University of Rio de Janeiro",
                resumeTranslationService.translateInstitutionName("Universidade do Estado do Rio de Janeiro"));
    }

    @Test
    @DisplayName("translateInstitutionName: Universidade Estadual de → State University of")
    void translateInstitution_stateUniversityEstadual() {
        assertEquals("State University of Campinas",
                resumeTranslationService.translateInstitutionName("Universidade Estadual de Campinas"));
    }

    @Test
    @DisplayName("translateInstitutionName: PUC prefix")
    void translateInstitution_puc() {
        assertEquals("Pontifical Catholic University of São Paulo",
                resumeTranslationService.translateInstitutionName("Pontifícia Universidade Católica de São Paulo"));
    }

    @Test
    @DisplayName("translateInstitutionName: Instituto Federal de")
    void translateInstitution_institutoFederal() {
        assertEquals("Federal Institute of Minas Gerais",
                resumeTranslationService.translateInstitutionName("Instituto Federal de Minas Gerais"));
    }

    @Test
    @DisplayName("translateInstitutionName: Faculdade de (field) → School of")
    void translateInstitution_faculdadeField() {
        assertEquals("School of Medicina",
                resumeTranslationService.translateInstitutionName("Faculdade de Medicina"));
    }

    @Test
    @DisplayName("translateInstitutionName: Faculdade ProperName → ProperName College")
    void translateInstitution_faculdadeProperName() {
        assertEquals("Estácio de Sá College",
                resumeTranslationService.translateInstitutionName("Faculdade Estácio de Sá"));
    }

    @Test
    @DisplayName("translateInstitutionName: Universidade ProperName → ProperName University")
    void translateInstitution_universidadeProperName() {
        assertEquals("Positivo University",
                resumeTranslationService.translateInstitutionName("Universidade Positivo"));
    }

    @Test
    @DisplayName("translateInstitutionName: Centro Universitário ProperName → ProperName University Center")
    void translateInstitution_centroUniversitarioProperName() {
        assertEquals("FMU University Center",
                resumeTranslationService.translateInstitutionName("Centro Universitário FMU"));
    }

    @Test
    @DisplayName("translateInstitutionName: null and blank return as-is")
    void translateInstitution_nullBlank() {
        assertNull(resumeTranslationService.translateInstitutionName(null));
        assertEquals("  ", resumeTranslationService.translateInstitutionName("  "));
    }

    @Test
    @DisplayName("translateInstitutionName: unknown institution returns unchanged")
    void translateInstitution_unknownUnchanged() {
        assertEquals("MIT",
                resumeTranslationService.translateInstitutionName("MIT"));
        assertEquals("Harvard Business School",
                resumeTranslationService.translateInstitutionName("Harvard Business School"));
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
