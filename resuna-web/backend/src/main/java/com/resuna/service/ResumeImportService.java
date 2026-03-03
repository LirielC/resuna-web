package com.resuna.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.resuna.util.FileValidator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;

/**
 * Service for intelligently importing resume data from PDF using AI.
 */
@Service
public class ResumeImportService {

    private static final Logger logger = LoggerFactory.getLogger(ResumeImportService.class);
    private final PDFExtractionService pdfExtractionService;
    private final OpenRouterService openRouterService;
    private final ObjectMapper objectMapper;
    private final FileValidator fileValidator;
    private final PDFSecurityService pdfSecurityService;

    public ResumeImportService(PDFExtractionService pdfExtractionService,
                               OpenRouterService openRouterService,
                               ObjectMapper objectMapper,
                               FileValidator fileValidator,
                               PDFSecurityService pdfSecurityService) {
        this.pdfExtractionService = pdfExtractionService;
        this.openRouterService = openRouterService;
        this.objectMapper = objectMapper;
        this.fileValidator = fileValidator;
        this.pdfSecurityService = pdfSecurityService;
    }

    /**
     * Extract structured resume data from PDF using AI.
     */
    public Map<String, Object> extractResumeData(MultipartFile file) throws IOException {
        // Validate file security (magic bytes, size, type)
        fileValidator.validatePdfFile(file);
        String safeFilename = fileValidator.sanitizeFilename(file.getOriginalFilename());
        logger.info("Processing PDF import: {}", safeFilename);

        // Extract text from PDF
        String rawText = pdfExtractionService.extractText(file);

        // Use AI to extract structured data, with graceful fallback if model fails
        try {
            String aiResponse = extractWithAI(rawText);
            if (aiResponse == null || aiResponse.isBlank()) {
                logger.warn("AI returned empty response for PDF import. Falling back to basic extraction.");
                return basicExtraction(rawText);
            }

            return parseAIResponse(aiResponse, rawText);
        } catch (IOException e) {
            logger.warn("AI extraction failed, using basic extraction fallback: {}", e.getMessage());
            return basicExtraction(rawText);
        }
    }

    private String extractWithAI(String resumeText) throws IOException {
        String prompt = buildExtractionPrompt(resumeText);
        return openRouterService.generateText(prompt);
    }

    private String buildExtractionPrompt(String resumeText) {
        String systemInstructions = """
            Você é um especialista em análise de currículos. Extraia TODAS as informações estruturadas do currículo abaixo e retorne APENAS um objeto JSON válido, sem texto adicional.

            REGRAS IMPORTANTES:
            1. Retorne APENAS o JSON, sem markdown, sem explicações, sem texto antes ou depois
            2. Use null para campos não encontrados
            3. Extraia TODAS as habilidades/competências técnicas encontradas
            4. Extraia TODOS os projetos mencionados
            5. Extraia TODAS as certificações/cursos
            6. Extraia TODOS os idiomas mencionados
            7. Para experiências, extraia título do cargo, empresa, período e descrições
            8. Para educação, extraia grau/curso, instituição e período

            Formato JSON esperado:
            {
              "personalInfo": {
                "fullName": "Nome Completo",
                "email": "email@exemplo.com",
                "phone": "+55...",
                "location": "Cidade, Estado",
                "linkedin": "linkedin.com/in/...",
                "github": "github.com/...",
                "website": "https://..."
              },
              "summary": "Resumo profissional ou objetivo",
              "experience": [
                {
                  "title": "Cargo",
                  "company": "Empresa",
                  "location": "Cidade",
                  "startDate": "2020-01",
                  "endDate": "2023-12",
                  "current": false,
                  "bullets": ["Responsabilidade 1", "Responsabilidade 2"]
                }
              ],
              "education": [
                {
                  "degree": "Bacharelado em...",
                  "institution": "Universidade",
                  "location": "Cidade",
                  "graduationDate": "2020-12",
                  "gpa": null
                }
              ],
              "skills": ["JavaScript", "React", "Node.js"],
              "projects": [
                {
                  "name": "Nome do Projeto",
                  "description": "Descrição",
                  "technologies": ["React", "Node.js"],
                  "url": "https://...",
                  "bullets": ["Detalhe 1", "Detalhe 2"]
                }
              ],
              "certifications": [
                {
                  "name": "Nome da Certificação",
                  "issuer": "Emissor",
                  "date": "2023-06",
                  "url": null
                }
              ],
              "languages": [
                {
                  "name": "Português",
                  "level": "native"
                },
                {
                  "name": "Inglês",
                  "level": "fluent"
                }
              ]
            }

            Níveis de idioma válidos: "native", "fluent", "advanced", "intermediate", "basic"

            Retorne APENAS o JSON:""";
        return pdfSecurityService.buildSecurePrompt(systemInstructions, resumeText);
    }

    private Map<String, Object> parseAIResponse(String aiResponse, String rawText) {
        try {
            // Try to extract JSON from response (AI might add markdown formatting)
            String jsonStr = extractJSON(aiResponse);

            JsonNode root = objectMapper.readTree(jsonStr);
            Map<String, Object> result = new LinkedHashMap<>();

            // Personal Info
            JsonNode personalInfo = root.get("personalInfo");
            if (personalInfo != null) {
                result.put("name", getTextValue(personalInfo, "fullName"));
                result.put("email", getTextValue(personalInfo, "email"));
                result.put("phone", getTextValue(personalInfo, "phone"));
                result.put("location", getTextValue(personalInfo, "location"));
                result.put("linkedin", getTextValue(personalInfo, "linkedin"));
                result.put("github", getTextValue(personalInfo, "github"));
                result.put("website", getTextValue(personalInfo, "website"));
            } else {
                // Fallback to basic extraction
                Map<String, String> contactInfo = pdfExtractionService.extractContactInfo(rawText);
                result.put("name", contactInfo.getOrDefault("name", ""));
                result.put("email", contactInfo.getOrDefault("email", ""));
                result.put("phone", contactInfo.getOrDefault("phone", ""));
                result.put("location", "");
                result.put("linkedin", contactInfo.getOrDefault("linkedin", ""));
                result.put("github", contactInfo.getOrDefault("github", ""));
                result.put("website", "");
            }

            // Summary
            result.put("summary", getTextValue(root, "summary"));

            // Skills
            List<String> skills = new ArrayList<>();
            JsonNode skillsNode = root.get("skills");
            if (skillsNode != null && skillsNode.isArray()) {
                for (JsonNode skill : skillsNode) {
                    if (skill.isTextual()) {
                        skills.add(skill.asText());
                    }
                }
            }
            result.put("skills", skills);

            // Experience
            result.put("experience", parseArrayNode(root.get("experience")));

            // Education
            result.put("education", parseArrayNode(root.get("education")));

            // Projects
            result.put("projects", parseArrayNode(root.get("projects")));

            // Certifications
            result.put("certifications", parseArrayNode(root.get("certifications")));

            // Languages
            result.put("languages", parseArrayNode(root.get("languages")));

            // Raw text for reference
            result.put("rawText", rawText);

            return result;

        } catch (Exception e) {
            logger.error("Failed to parse AI response as JSON: {}", e.getMessage());
            // Return basic extraction as fallback
            return basicExtraction(rawText);
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

    private String getTextValue(JsonNode node, String fieldName) {
        if (node == null || !node.has(fieldName)) {
            return "";
        }
        JsonNode field = node.get(fieldName);
        if (field.isNull()) {
            return "";
        }
        return field.asText("");
    }

    private List<Map<String, Object>> parseArrayNode(JsonNode arrayNode) {
        List<Map<String, Object>> result = new ArrayList<>();
        if (arrayNode != null && arrayNode.isArray()) {
            for (JsonNode item : arrayNode) {
                Map<String, Object> map = objectMapper.convertValue(item, Map.class);
                result.add(map);
            }
        }
        return result;
    }

    private Map<String, Object> basicExtraction(String rawText) {
        // Fallback to basic regex extraction
        Map<String, String> contactInfo = pdfExtractionService.extractContactInfo(rawText);
        Map<String, String> sections = pdfExtractionService.extractSections(rawText);
        List<String> skills = pdfExtractionService.extractSkills(rawText);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("name", contactInfo.getOrDefault("name", ""));
        result.put("email", contactInfo.getOrDefault("email", ""));
        result.put("phone", contactInfo.getOrDefault("phone", ""));
        result.put("location", "");
        result.put("linkedin", contactInfo.getOrDefault("linkedin", ""));
        result.put("github", contactInfo.getOrDefault("github", ""));
        result.put("website", "");
        result.put("summary", sections.getOrDefault("summary", ""));
        result.put("skills", skills);
        result.put("experience", new ArrayList<>());
        result.put("education", new ArrayList<>());
        result.put("projects", new ArrayList<>());
        result.put("certifications", new ArrayList<>());
        result.put("languages", new ArrayList<>());
        result.put("rawText", rawText);

        return result;
    }
}
