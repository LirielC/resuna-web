package com.resuna.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RefactoringHelpersTest {

    @Test
    void normalizesExportLinksSafely() {
        assertEquals("5511987654321", ResumeExportLinkFormatter.whatsappNumber("(11) 98765-4321"));
        assertEquals("https://github.com/example", ResumeExportLinkFormatter.sanitizeUrl("github.com/example"));
        assertEquals("mailto:user@example.com", ResumeExportLinkFormatter.sanitizeUrl("mailto:user@example.com"));
        assertEquals(null, ResumeExportLinkFormatter.sanitizeUrl("javascript:alert(1)"));
    }

    @Test
    void extractsStructuredProviderContent() throws Exception {
        OpenRouterResponseParser parser = new OpenRouterResponseParser(new ObjectMapper());
        String response = "{\"choices\":[{\"message\":{\"content\":[{\"type\":\"text\",\"text\":\"ok\"}]}}]}";
        assertEquals("ok", parser.extractText(response));
    }

    @Test
    void matchesKeywordsAndSynonymsWithWordBoundaries() {
        PDFKeywordMatcher matcher = new PDFKeywordMatcher();
        Map<String, Set<String>> synonyms = Map.of("react", Set.of("reactjs"));
        assertTrue(matcher.contains("Built interfaces with ReactJS", "react", synonyms));
    }
}
