package com.resuna.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.resuna.util.FileValidator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
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

    @Autowired(required = false)
    @Lazy
    private GeminiService geminiService;

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

        // Prefer Gemini: better model, native JSON mode, higher output token limit
        if (geminiService != null && geminiService.isAvailable()) {
            try {
                logger.info("Using Gemini for PDF import (JSON mode)");
                return geminiService.generateJson(prompt);
            } catch (IOException e) {
                logger.warn("Gemini failed for PDF import, falling back to OpenRouter: {}", e.getMessage());
            }
        }

        return openRouterService.generateJson(prompt);
    }

    private String buildExtractionPrompt(String resumeText) {
        String systemInstructions = """
            Você é um especialista em extração de dados de currículos. Extraia TODAS as informações do currículo abaixo e retorne APENAS um objeto JSON válido, sem markdown, sem explicações, sem texto antes ou depois.

            REGRAS CRÍTICAS:
            1. Retorne APENAS o JSON — nada mais
            2. Use null para campos não encontrados, [] para listas vazias
            3. PRESERVE O IDIOMA ORIGINAL — não traduza nada. Se o currículo está em português, mantenha em português
            4. Seções em português que você deve reconhecer:
               - "Habilidades" / "Competências" / "Tecnologias" / "Stack" → array skills
               - "Certificações" / "Cursos" / "Certificados" / "Formações Complementares" → array certifications
               - "Idiomas" / "Línguas" → array languages
               - "Projetos" / "Portfólio" / "Trabalhos" → array projects
               - "Experiência" / "Experiência Profissional" / "Histórico Profissional" → array experience
               - "Educação" / "Formação" / "Formação Acadêmica" / "Graduação" → array education
               - "Resumo" / "Sobre" / "Objetivo" / "Perfil" → string summary
            5. Localização (cidade, estado, país) vai APENAS em personalInfo.location — NUNCA em skills
            6. Extraia TODAS as habilidades listadas — não omita nenhuma tecnologia, ferramenta ou competência
            7. Para certificações: inclua qualquer curso, certificado ou formação complementar encontrada
            8. Para idiomas, mapeie proficiência para o nível correto:
               - "Nativo" / "Língua materna" → "native"
               - "Fluente" → "fluent"
               - "Avançado" → "advanced"
               - "Intermediário" → "intermediate"
               - "Básico" / "Elementar" / "Iniciante" → "basic"

            Estrutura JSON esperada (use null ou [] para dados ausentes):
            {
              "personalInfo": {
                "fullName": "nome extraído do currículo",
                "email": "email extraído",
                "phone": "telefone extraído",
                "location": "Cidade, Estado",
                "linkedin": "url do linkedin se presente",
                "github": "url do github se presente",
                "website": "site pessoal se presente"
              },
              "summary": "texto do resumo/objetivo profissional",
              "experience": [
                {
                  "title": "Cargo exatamente como está no currículo",
                  "company": "Nome da empresa",
                  "location": "Cidade",
                  "startDate": "2020-01",
                  "endDate": "2023-12",
                  "current": false,
                  "bullets": ["Responsabilidade ou conquista 1", "Responsabilidade 2"]
                }
              ],
              "education": [
                {
                  "degree": "Curso/Grau exatamente como está",
                  "institution": "Nome da instituição",
                  "location": "Cidade",
                  "graduationDate": "2020-12",
                  "gpa": null
                }
              ],
              "skills": ["JavaScript", "React", "Node.js", "Python"],
              "projects": [
                {
                  "name": "Nome do projeto",
                  "description": "Descrição",
                  "technologies": ["React", "Node.js"],
                  "url": "https://...",
                  "bullets": ["Detalhe 1"]
                }
              ],
              "certifications": [
                {
                  "name": "Nome da certificação ou curso",
                  "issuer": "Emissor/Instituição",
                  "date": "2023-06",
                  "url": null
                }
              ],
              "languages": [
                {"name": "Português", "level": "native"},
                {"name": "Inglês", "level": "advanced"}
              ]
            }

            RETORNE APENAS O JSON:""";
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
                result.put("phone", normalizePhone(getTextValue(personalInfo, "phone")));
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

            // Skills — filter out personal data that AI may have misclassified
            String extractedEmail = (String) result.getOrDefault("email", "");
            String extractedPhone = (String) result.getOrDefault("phone", "");
            String extractedName = (String) result.getOrDefault("name", "");
            String extractedLocation = (String) result.getOrDefault("location", "");

            List<String> skills = new ArrayList<>();
            JsonNode skillsNode = root.get("skills");
            if (skillsNode != null && skillsNode.isArray()) {
                for (JsonNode skill : skillsNode) {
                    if (skill.isTextual()) {
                        String s = skill.asText().trim();
                        if (!isPersonalData(s, extractedEmail, extractedPhone, extractedName, extractedLocation)) {
                            skills.add(s);
                        }
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

    /**
     * Normalizes Brazilian phone numbers to E.164-like format with +55 prefix.
     * Input examples: "97339-5375", "(21) 97339-5375", "021 97339-5375"
     * Output: "+55 (21) 97339-5375" or "+55 97339-5375"
     */
    private String normalizePhone(String phone) {
        if (phone == null || phone.isBlank()) return phone;
        String p = phone.trim();
        // Already has country code
        if (p.startsWith("+")) return p;
        // Strip non-digit chars for analysis
        String digits = p.replaceAll("[^\\d]", "");
        if (digits.isEmpty()) return p;
        // Remove leading 0 (old trunk prefix)
        if (digits.startsWith("0") && digits.length() > 10) {
            digits = digits.substring(1);
        }
        // Brazilian number: 10 digits (2 DDD + 8 number) or 11 digits (2 DDD + 9 number)
        if (digits.length() == 10 || digits.length() == 11) {
            String ddd = digits.substring(0, 2);
            String number = digits.substring(2);
            String formatted = number.length() == 9
                    ? number.substring(0, 5) + "-" + number.substring(5)
                    : number.substring(0, 4) + "-" + number.substring(4);
            return "+55 (" + ddd + ") " + formatted;
        }
        // 8 or 9 digit number without DDD — just add +55
        if (digits.length() == 8 || digits.length() == 9) {
            return "+55 " + p;
        }
        return p;
    }

    /**
     * Returns true if the given skill string looks like personal data
     * (email, phone, URL, full name, city) rather than an actual skill.
     */
    private boolean isPersonalData(String s, String email, String phone, String name, String location) {
        if (s.isBlank()) return true;
        // Email pattern
        if (s.contains("@")) return true;
        // URL / social profile
        if (s.contains("linkedin.com") || s.contains("github.com") || s.contains("://")) return true;
        // Phone-like: contains digit sequence with dash/parens typical of phones
        if (s.matches(".*\\d{4,}.*") && s.matches(".*[\\-().+\\s].*\\d.*")) return true;
        // Matches extracted personal fields (case-insensitive)
        if (!email.isBlank() && s.equalsIgnoreCase(email)) return true;
        if (!name.isBlank() && s.equalsIgnoreCase(name)) return true;
        // Matches part of location (city or state abbreviation)
        if (!location.isBlank()) {
            for (String part : location.split("[,/]")) {
                String trimmed = part.trim();
                if (trimmed.length() > 1 && s.equalsIgnoreCase(trimmed)) return true;
            }
        }
        // Raw phone digits overlap
        if (!phone.isBlank()) {
            String phoneDigits = phone.replaceAll("[^\\d]", "");
            String sDigits = s.replaceAll("[^\\d]", "");
            if (!phoneDigits.isBlank() && sDigits.length() >= 8 && phoneDigits.contains(sDigits)) return true;
        }
        return false;
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
