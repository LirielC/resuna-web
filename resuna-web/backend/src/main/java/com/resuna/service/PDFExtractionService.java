package com.resuna.service;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Service for extracting text and sections from PDF files.
 */
@Service
public class PDFExtractionService {

    private static final Logger logger = LoggerFactory.getLogger(PDFExtractionService.class);
    private final PDFSecurityService pdfSecurityService;

    public PDFExtractionService(PDFSecurityService pdfSecurityService) {
        this.pdfSecurityService = pdfSecurityService;
    }

    /**
     * Extract all text from a PDF file.
     */
    public String extractText(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("PDF file is required");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.equals("application/pdf")) {
            throw new IllegalArgumentException("File must be a PDF");
        }

        // PDFBox 3.x uses Loader.loadPDF with byte array
        try (PDDocument document = Loader.loadPDF(file.getBytes())) {
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true);

            String text = stripper.getText(document);
            logger.info("Extracted {} characters from PDF with {} pages",
                    text.length(), document.getNumberOfPages());

            // Sanitize extracted text to prevent prompt injection
            String sanitizedText = pdfSecurityService.sanitizeExtractedText(text);

            // Detect prompt injection attempts
            if (pdfSecurityService.detectPromptInjection(sanitizedText)) {
                logger.error("SECURITY ALERT: Prompt injection detected in PDF text");
                throw new IOException("PDF contém conteúdo suspeito ou tentativa de injeção de prompt");
            }

            return sanitizedText;
        } catch (IOException e) {
            logger.error("Failed to extract text from PDF: {}", e.getMessage());
            throw new IOException("Failed to read PDF file: " + e.getMessage(), e);
        } catch (Exception e) {
            // PDFBox can throw RuntimeException for certain malformed/encrypted PDFs
            logger.error("Unexpected error extracting text from PDF: {}", e.getMessage());
            throw new IOException("Failed to parse PDF file: " + e.getMessage(), e);
        }
    }

    /**
     * Extract structured sections from PDF text.
     */
    public Map<String, String> extractSections(String text) {
        Map<String, String> sections = new LinkedHashMap<>();

        // Common resume section headers (English + Portuguese)
        String[] sectionPatterns = {
                "(?i)(summary|professional\\s*summary|objective|profile|resumo|resumo\\s*profissional|objetivo|perfil)",
                "(?i)(experience|work\\s*experience|employment|professional\\s*experience|experiência|experiência\\s*profissional|emprego|histórico\\s*profissional)",
                "(?i)(education|academic|qualifications|educação|formação|formação\\s*acadêmica|qualificações)",
                "(?i)(skills|technical\\s*skills|core\\s*competencies|technologies|habilidades|competências|competências\\s*técnicas|tecnologias)",
                "(?i)(projects|personal\\s*projects|projetos|projetos\\s*pessoais)",
                "(?i)(certifications|certificates|licenses|certificações|certificados|licenças)",
                "(?i)(languages|language\\s*proficiency|idiomas|línguas)",
                "(?i)(awards|achievements|honors|prêmios|conquistas|honras)"
        };

        String[] sectionNames = {
                "summary", "experience", "education", "skills",
                "projects", "certifications", "languages", "awards"
        };

        List<SectionMatch> matches = new ArrayList<>();

        for (int i = 0; i < sectionPatterns.length; i++) {
            Pattern pattern = Pattern.compile("^\\s*" + sectionPatterns[i] + "\\s*:?\\s*$",
                    Pattern.MULTILINE);
            Matcher matcher = pattern.matcher(text);
            while (matcher.find()) {
                matches.add(new SectionMatch(sectionNames[i], matcher.start(), matcher.end()));
            }
        }

        // Sort by position
        matches.sort(Comparator.comparingInt(m -> m.start));

        // Extract content between sections
        for (int i = 0; i < matches.size(); i++) {
            SectionMatch current = matches.get(i);
            int endPos = (i + 1 < matches.size()) ? matches.get(i + 1).start : text.length();
            String content = text.substring(current.end, endPos).trim();
            sections.put(current.name, content);
        }

        // If no sections found, put everything as "content"
        if (sections.isEmpty()) {
            sections.put("content", text);
        }

        return sections;
    }

    /**
     * Extract contact information from PDF text.
     */
    public Map<String, String> extractContactInfo(String text) {
        Map<String, String> contact = new HashMap<>();

        // Email pattern
        Pattern emailPattern = Pattern.compile(
                "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}");
        Matcher emailMatcher = emailPattern.matcher(text);
        if (emailMatcher.find()) {
            contact.put("email", emailMatcher.group());
        }

        // Phone pattern (various formats)
        Pattern phonePattern = Pattern.compile(
                "(?:\\+?\\d{1,3}[-.\\s]?)?\\(?\\d{2,3}\\)?[-.\\s]?\\d{3,4}[-.\\s]?\\d{4}");
        Matcher phoneMatcher = phonePattern.matcher(text);
        if (phoneMatcher.find()) {
            contact.put("phone", phoneMatcher.group().trim());
        }

        // LinkedIn pattern
        Pattern linkedinPattern = Pattern.compile(
                "(?:linkedin\\.com/in/|linkedin:\\s*)([\\w-]+)", Pattern.CASE_INSENSITIVE);
        Matcher linkedinMatcher = linkedinPattern.matcher(text);
        if (linkedinMatcher.find()) {
            contact.put("linkedin", "linkedin.com/in/" + linkedinMatcher.group(1));
        }

        // GitHub pattern
        Pattern githubPattern = Pattern.compile(
                "(?:github\\.com/|github:\\s*)([\\w-]+)", Pattern.CASE_INSENSITIVE);
        Matcher githubMatcher = githubPattern.matcher(text);
        if (githubMatcher.find()) {
            contact.put("github", "github.com/" + githubMatcher.group(1));
        }

        // Name (usually first line or first significant text)
        String[] lines = text.split("\\n");
        for (String line : lines) {
            line = line.trim();
            // Skip empty lines or lines that look like section headers
            if (line.isEmpty() || line.matches("(?i)^(summary|experience|education|skills).*")) {
                continue;
            }
            // Check if it looks like a name (2-4 capitalized words)
            if (line.matches("^[A-Z][a-z]+(?:\\s+[A-Z][a-z]+){1,3}$")) {
                contact.put("name", line);
                break;
            }
        }

        return contact;
    }

    /**
     * Extract skills as a list from the skills section.
     */
    public List<String> extractSkills(String text) {
        Map<String, String> sections = extractSections(text);
        String skillsSection = sections.getOrDefault("skills", "");

        if (skillsSection.isEmpty()) {
            // Try to find skills in the entire text
            skillsSection = text;
        }

        List<String> skills = new ArrayList<>();

        // Split by common delimiters
        String[] tokens = skillsSection.split("[,;•|\\n]+");
        for (String token : tokens) {
            token = token.trim()
                    .replaceAll("^[-–—·]\\s*", "") // Remove leading bullets
                    .replaceAll("\\s+", " ");

            // Filter valid skills (not too long, not just numbers)
            if (token.length() >= 2 && token.length() <= 50 &&
                    !token.matches("^\\d+$") &&
                    !token.matches("(?i)^(skills|technical|and|or|with|using)$")) {
                skills.add(token);
            }
        }

        return skills.stream()
                .distinct()
                .limit(50) // Cap at 50 skills
                .toList();
    }

    private static class SectionMatch {
        String name;
        int start;
        int end;

        SectionMatch(String name, int start, int end) {
            this.name = name;
            this.start = start;
            this.end = end;
        }
    }
}
