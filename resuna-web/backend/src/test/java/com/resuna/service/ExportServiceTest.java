package com.resuna.service;

import com.resuna.model.Resume;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests for ExportService — PDF and DOCX resume generation.
 * Uses PDFBox (PDFTextStripper) and Apache POI to parse the generated
 * bytes and verify that the expected content is present.
 */
class ExportServiceTest {

    private ExportService exportService;

    @BeforeEach
    void setUp() {
        exportService = new ExportService();
    }

    // ── Builders ──────────────────────────────────────────────────────────

    private Resume.PersonalInfo personalInfo(String name, String email) {
        Resume.PersonalInfo info = new Resume.PersonalInfo();
        info.setFullName(name);
        info.setEmail(email);
        return info;
    }

    private Resume.PersonalInfo fullPersonalInfo() {
        Resume.PersonalInfo info = new Resume.PersonalInfo();
        info.setFullName("John Doe");
        info.setEmail("john@example.com");
        info.setPhone("+1 555-0100");
        info.setLocation("San Francisco, CA");
        info.setLinkedin("https://linkedin.com/in/johndoe");
        info.setGithub("https://github.com/johndoe");
        info.setWebsite("https://johndoe.dev");
        return info;
    }

    private Resume fullResume() {
        Resume resume = new Resume();
        resume.setTitle("Software Engineer Resume");
        resume.setPersonalInfo(fullPersonalInfo());
        resume.setSummary("Experienced software engineer with 5+ years building scalable systems.");

        Resume.Experience exp = new Resume.Experience();
        exp.setTitle("Senior Software Engineer");
        exp.setCompany("Acme Corp");
        exp.setLocation("Remote");
        exp.setStartDate("2021-03");
        exp.setCurrent(true);
        exp.setBullets(List.of(
                "Led migration to microservices architecture",
                "Reduced API latency by 40%"));

        Resume.Experience exp2 = new Resume.Experience();
        exp2.setTitle("Software Engineer");
        exp2.setCompany("StartupXYZ");
        exp2.setStartDate("2019-01");
        exp2.setEndDate("2021-02");
        exp2.setBullets(List.of("Built REST APIs serving 1M+ requests/day"));

        resume.setExperience(List.of(exp, exp2));

        Resume.Project proj = new Resume.Project();
        proj.setName("Open Source CLI Tool");
        proj.setDescription("A CLI tool for developer productivity");
        proj.setTechnologies(List.of("Go", "Docker"));
        proj.setStartDate("2022-06");
        proj.setBullets(List.of("500+ GitHub stars"));
        resume.setProjects(List.of(proj));

        Resume.Education edu = new Resume.Education();
        edu.setDegree("BS Computer Science");
        edu.setInstitution("MIT");
        edu.setLocation("Cambridge, MA");
        edu.setGraduationDate("2019");
        resume.setEducation(List.of(edu));

        resume.setSkills(List.of("Java", "Spring Boot", "React", "Docker", "PostgreSQL"));

        Resume.Certification cert = new Resume.Certification();
        cert.setName("AWS Solutions Architect");
        cert.setIssuer("Amazon");
        cert.setDate("2023-05");
        resume.setCertifications(List.of(cert));

        Resume.Language lang1 = new Resume.Language();
        lang1.setName("English");
        lang1.setLevel("native");
        Resume.Language lang2 = new Resume.Language();
        lang2.setName("Portuguese");
        lang2.setLevel("fluent");
        resume.setLanguages(List.of(lang1, lang2));

        return resume;
    }

    private Resume minimalResume() {
        Resume resume = new Resume();
        resume.setTitle("Minimal");
        resume.setPersonalInfo(personalInfo("Jane Smith", "jane@test.com"));
        return resume;
    }

    // ── Helper: extract text from PDF bytes ───────────────────────────────

    private String extractPdfText(byte[] pdfBytes) throws Exception {
        try (PDDocument doc = Loader.loadPDF(pdfBytes)) {
            return new PDFTextStripper().getText(doc);
        }
    }

    private int getPdfPageCount(byte[] pdfBytes) throws Exception {
        try (PDDocument doc = Loader.loadPDF(pdfBytes)) {
            return doc.getNumberOfPages();
        }
    }

    // ── Helper: extract text from DOCX bytes ──────────────────────────────

    private String extractDocxText(byte[] docxBytes) throws Exception {
        try (XWPFDocument doc = new XWPFDocument(new ByteArrayInputStream(docxBytes))) {
            StringBuilder sb = new StringBuilder();
            for (XWPFParagraph p : doc.getParagraphs()) {
                sb.append(p.getText()).append("\n");
            }
            return sb.toString();
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PDF TESTS
    // ═══════════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("PDF Export — exportToPdf")
    class PdfTests {

        @Test
        @DisplayName("Full resume generates a valid, non-empty PDF")
        void fullResume_generatesValidPdf() throws Exception {
            byte[] pdf = exportService.exportToPdf(fullResume());

            assertNotNull(pdf);
            assertTrue(pdf.length > 0, "PDF should not be empty");
            // PDF magic bytes: %PDF
            assertEquals('%', (char) pdf[0]);
            assertEquals('P', (char) pdf[1]);
            assertEquals('D', (char) pdf[2]);
            assertEquals('F', (char) pdf[3]);
        }

        @Test
        @DisplayName("PDF contains at least one page")
        void fullResume_hasPages() throws Exception {
            byte[] pdf = exportService.exportToPdf(fullResume());
            assertTrue(getPdfPageCount(pdf) >= 1);
        }

        @Test
        @DisplayName("PDF contains the candidate's full name")
        void pdf_containsFullName() throws Exception {
            byte[] pdf = exportService.exportToPdf(fullResume());
            String text = extractPdfText(pdf);
            assertTrue(text.contains("John Doe"), "PDF should contain full name");
        }

        @Test
        @DisplayName("PDF contains contact information")
        void pdf_containsContactInfo() throws Exception {
            byte[] pdf = exportService.exportToPdf(fullResume());
            String text = extractPdfText(pdf);

            assertTrue(text.contains("john@example.com"), "PDF should contain email");
            assertTrue(text.contains("+1 555-0100"), "PDF should contain phone");
            assertTrue(text.contains("San Francisco"), "PDF should contain location");
        }

        @Test
        @DisplayName("PDF contains linkedin and github (cleaned URLs)")
        void pdf_containsLinks() throws Exception {
            byte[] pdf = exportService.exportToPdf(fullResume());
            String text = extractPdfText(pdf);

            assertTrue(text.contains("linkedin.com/in/johndoe"), "PDF should contain linkedin");
            assertTrue(text.contains("github.com/johndoe"), "PDF should contain github");
        }

        @Test
        @DisplayName("PDF contains summary section")
        void pdf_containsSummary() throws Exception {
            byte[] pdf = exportService.exportToPdf(fullResume(), "en");
            String text = extractPdfText(pdf);

            assertTrue(text.contains("SUMMARY"), "PDF should have SUMMARY header");
            assertTrue(text.contains("Experienced software engineer"),
                    "PDF should contain summary text");
        }

        @Test
        @DisplayName("PDF contains experience section with details")
        void pdf_containsExperience() throws Exception {
            byte[] pdf = exportService.exportToPdf(fullResume(), "en");
            String text = extractPdfText(pdf);

            assertTrue(text.contains("EXPERIENCE"), "PDF should have EXPERIENCE header");
            assertTrue(text.contains("Senior Software Engineer"), "Should contain job title");
            assertTrue(text.contains("ACME CORP"), "Should contain company name (uppercased in PDF)");
            assertTrue(text.contains("Present"), "Current job should show 'Present'");
            assertTrue(text.contains("microservices"), "Should contain bullet content");
        }

        @Test
        @DisplayName("PDF contains projects section")
        void pdf_containsProjects() throws Exception {
            byte[] pdf = exportService.exportToPdf(fullResume(), "en");
            String text = extractPdfText(pdf);

            assertTrue(text.contains("PROJECTS"), "PDF should have PROJECTS header");
            assertTrue(text.contains("OPEN SOURCE CLI TOOL"), "Should contain project name (uppercased in PDF)");
            assertTrue(text.contains("Go"), "Should contain technology");
        }

        @Test
        @DisplayName("PDF contains education section")
        void pdf_containsEducation() throws Exception {
            byte[] pdf = exportService.exportToPdf(fullResume(), "en");
            String text = extractPdfText(pdf);

            assertTrue(text.contains("EDUCATION"), "PDF should have EDUCATION header");
            assertTrue(text.contains("MIT"), "Should contain institution");
            assertTrue(text.contains("BS Computer Science"), "Should contain degree");
        }

        @Test
        @DisplayName("PDF contains skills section")
        void pdf_containsSkills() throws Exception {
            byte[] pdf = exportService.exportToPdf(fullResume(), "en");
            String text = extractPdfText(pdf);

            assertTrue(text.contains("SKILLS"), "PDF should have SKILLS header");
            assertTrue(text.contains("Java"), "Should contain a skill");
            assertTrue(text.contains("Spring Boot"), "Should contain another skill");
        }

        @Test
        @DisplayName("PDF contains certifications section")
        void pdf_containsCertifications() throws Exception {
            byte[] pdf = exportService.exportToPdf(fullResume(), "en");
            String text = extractPdfText(pdf);

            assertTrue(text.contains("CERTIFICATIONS"), "PDF should have CERTIFICATIONS header");
            assertTrue(text.contains("AWS Solutions Architect"), "Should contain cert name");
            assertTrue(text.contains("Amazon"), "Should contain issuer");
        }

        @Test
        @DisplayName("PDF contains languages section")
        void pdf_containsLanguages() throws Exception {
            byte[] pdf = exportService.exportToPdf(fullResume(), "en");
            String text = extractPdfText(pdf);

            assertTrue(text.contains("LANGUAGES"), "PDF should have LANGUAGES header");
            assertTrue(text.contains("English"), "Should contain language");
            assertTrue(text.contains("Native"), "Should contain capitalized level");
        }

        // ── Edge cases ──────────────────────────────────────────────────

        @Test
        @DisplayName("Minimal resume (name + email only) generates valid PDF")
        void minimalResume_generatesValidPdf() throws Exception {
            byte[] pdf = exportService.exportToPdf(minimalResume());

            assertNotNull(pdf);
            assertTrue(pdf.length > 0);
            String text = extractPdfText(pdf);
            assertTrue(text.contains("Jane Smith"));
        }

        @Test
        @DisplayName("Resume with null sections generates PDF without errors")
        void nullSections_noError() throws Exception {
            Resume resume = new Resume();
            resume.setPersonalInfo(personalInfo("Test User", "test@x.com"));
            // All other fields are null

            byte[] pdf = exportService.exportToPdf(resume);
            assertNotNull(pdf);
            assertTrue(pdf.length > 0);
        }

        @Test
        @DisplayName("Resume with empty lists generates PDF without errors")
        void emptySections_noError() throws Exception {
            Resume resume = new Resume();
            resume.setPersonalInfo(personalInfo("Test User", "test@x.com"));
            resume.setExperience(List.of());
            resume.setEducation(List.of());
            resume.setSkills(List.of());
            resume.setProjects(List.of());
            resume.setCertifications(List.of());
            resume.setLanguages(List.of());

            byte[] pdf = exportService.exportToPdf(resume);
            assertNotNull(pdf);
            assertTrue(pdf.length > 0);

            String text = extractPdfText(pdf);
            // Should NOT contain section headers for empty sections
            assertFalse(text.contains("EXPERIENCE"), "Empty experience → no header");
            assertFalse(text.contains("EDUCATION"), "Empty education → no header");
        }

        @Test
        @DisplayName("Date formatting: YYYY-MM → 'Mon YYYY'")
        void dateFormatting_correct() throws Exception {
            Resume resume = minimalResume();
            Resume.Experience exp = new Resume.Experience();
            exp.setTitle("Dev");
            exp.setCompany("Company");
            exp.setStartDate("2023-03");
            exp.setEndDate("2024-11");
            resume.setExperience(List.of(exp));

            byte[] pdf = exportService.exportToPdf(resume);
            String text = extractPdfText(pdf);

            assertTrue(text.contains("Mar 2023"), "Should format start date as 'Mar 2023'");
            assertTrue(text.contains("Nov 2024"), "Should format end date as 'Nov 2024'");
        }

        @Test
        @DisplayName("Current position shows 'Present' instead of end date")
        void currentPosition_showsPresent() throws Exception {
            Resume resume = minimalResume();
            Resume.Experience exp = new Resume.Experience();
            exp.setTitle("Dev");
            exp.setCompany("Company");
            exp.setStartDate("2023-01");
            exp.setCurrent(true);
            resume.setExperience(List.of(exp));

            byte[] pdf = exportService.exportToPdf(resume, "en");
            String text = extractPdfText(pdf);

            assertTrue(text.contains("Present"), "Current job should show 'Present'");
        }

        @Test
        @DisplayName("Null personalInfo generates PDF without crash")
        void nullPersonalInfo_noError() throws Exception {
            Resume resume = new Resume();
            resume.setPersonalInfo(null);

            byte[] pdf = exportService.exportToPdf(resume);
            assertNotNull(pdf);
            assertTrue(pdf.length > 0);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // DOCX TESTS
    // ═══════════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("DOCX Export — exportToDocx")
    class DocxTests {

        @Test
        @DisplayName("Full resume generates a valid, non-empty DOCX")
        void fullResume_generatesValidDocx() throws Exception {
            byte[] docx = exportService.exportToDocx(fullResume(), "pt-BR");

            assertNotNull(docx);
            assertTrue(docx.length > 0, "DOCX should not be empty");
            // DOCX is a ZIP → magic bytes PK (0x50 0x4B)
            assertEquals(0x50, docx[0] & 0xFF);
            assertEquals(0x4B, docx[1] & 0xFF);
        }

        @Test
        @DisplayName("DOCX contains the candidate's full name")
        void docx_containsFullName() throws Exception {
            byte[] docx = exportService.exportToDocx(fullResume(), "pt-BR");
            String text = extractDocxText(docx);
            assertTrue(text.contains("John Doe"), "DOCX should contain full name");
        }

        @Test
        @DisplayName("DOCX contains contact information")
        void docx_containsContactInfo() throws Exception {
            byte[] docx = exportService.exportToDocx(fullResume(), "pt-BR");
            String text = extractDocxText(docx);

            assertTrue(text.contains("john@example.com"), "Should contain email");
            assertTrue(text.contains("+1 555-0100"), "Should contain phone");
        }

        @Test
        @DisplayName("DOCX contains all section headers (pt-BR)")
        void docx_containsSectionHeaders() throws Exception {
            byte[] docx = exportService.exportToDocx(fullResume(), "pt-BR");
            String text = extractDocxText(docx);

            assertTrue(text.contains("RESUMO"));
            assertTrue(text.contains("EXPERIÊNCIA"));
            assertTrue(text.contains("PROJETOS"));
            assertTrue(text.contains("FORMAÇÃO"));
            assertTrue(text.contains("COMPETÊNCIAS"));
            assertTrue(text.contains("CERTIFICAÇÕES"));
            assertTrue(text.contains("IDIOMAS"));
        }

        @Test
        @DisplayName("DOCX contains all section headers (en)")
        void docx_containsSectionHeaders_en() throws Exception {
            byte[] docx = exportService.exportToDocx(fullResume(), "en");
            String text = extractDocxText(docx);

            assertTrue(text.contains("SUMMARY"));
            assertTrue(text.contains("EXPERIENCE"));
            assertTrue(text.contains("PROJECTS"));
            assertTrue(text.contains("EDUCATION"));
            assertTrue(text.contains("TECHNICAL SKILLS"));
            assertTrue(text.contains("COURSES / CERTIFICATIONS"));
            assertTrue(text.contains("LANGUAGES"));
        }

        @Test
        @DisplayName("DOCX contains experience details")
        void docx_containsExperience() throws Exception {
            byte[] docx = exportService.exportToDocx(fullResume(), "pt-BR");
            String text = extractDocxText(docx);

            assertTrue(text.contains("Senior Software Engineer"));
            assertTrue(text.contains("ACME CORP")); // company names are uppercased in DOCX
            assertTrue(text.contains("microservices"));
        }

        @Test
        @DisplayName("DOCX contains skills list")
        void docx_containsSkills() throws Exception {
            byte[] docx = exportService.exportToDocx(fullResume(), "pt-BR");
            String text = extractDocxText(docx);

            assertTrue(text.contains("Java"));
            assertTrue(text.contains("Docker"));
        }

        @Test
        @DisplayName("Minimal resume generates valid DOCX")
        void minimalResume_generatesValidDocx() throws Exception {
            byte[] docx = exportService.exportToDocx(minimalResume(), "pt-BR");

            assertNotNull(docx);
            assertTrue(docx.length > 0);
            String text = extractDocxText(docx);
            assertTrue(text.contains("Jane Smith"));
        }

        @Test
        @DisplayName("Empty sections do not generate headers in DOCX")
        void emptySections_noHeaders() throws Exception {
            byte[] docx = exportService.exportToDocx(minimalResume(), "pt-BR");
            String text = extractDocxText(docx);

            assertFalse(text.contains("EXPERIÊNCIA"));
            assertFalse(text.contains("FORMAÇÃO"));
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // UNICODE / ACCENTED CHARACTERS TESTS
    // ═══════════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("Unicode & Accented Characters")
    class UnicodeTests {

        private Resume portugueseResume() {
            Resume resume = new Resume();
            resume.setTitle("Currículo");

            Resume.PersonalInfo info = new Resume.PersonalInfo();
            info.setFullName("João da Conceição");
            info.setEmail("joao@exemplo.com.br");
            info.setPhone("+55 11 99999-0000");
            info.setLocation("São Paulo, SP");
            resume.setPersonalInfo(info);

            resume.setSummary("Engenheiro de software com experiência em aplicações de larga escala. "
                    + "Apaixonado por inovação tecnológica e soluções escaláveis.");

            Resume.Experience exp = new Resume.Experience();
            exp.setTitle("Desenvolvedor Sênior");
            exp.setCompany("Organização Finanças");
            exp.setLocation("São Paulo, SP");
            exp.setStartDate("2020-03");
            exp.setCurrent(true);
            exp.setBullets(List.of(
                    "Implementação de microsserviços com comunicação assíncrona",
                    "Redução de latência em 40% através de otimização de consultas"));
            resume.setExperience(List.of(exp));

            Resume.Education edu = new Resume.Education();
            edu.setDegree("Bacharelado em Ciência da Computação");
            edu.setInstitution("Universidade de São Paulo");
            edu.setLocation("São Paulo, SP");
            edu.setGraduationDate("2019");
            resume.setEducation(List.of(edu));

            resume.setSkills(List.of("Java", "Spring Boot", "PostgreSQL", "Microsserviços"));

            Resume.Certification cert = new Resume.Certification();
            cert.setName("Certificação AWS");
            cert.setIssuer("Amazon");
            cert.setDate("2023-01");
            resume.setCertifications(List.of(cert));

            Resume.Language lang1 = new Resume.Language();
            lang1.setName("Português");
            lang1.setLevel("nativo");
            Resume.Language lang2 = new Resume.Language();
            lang2.setName("Inglês");
            lang2.setLevel("fluente");
            resume.setLanguages(List.of(lang1, lang2));

            return resume;
        }

        @Test
        @DisplayName("PDF handles Portuguese name with cedilla and tilde (João, Conceição)")
        void pdf_portugueseName() throws Exception {
            byte[] pdf = exportService.exportToPdf(portugueseResume());
            String text = extractPdfText(pdf);

            assertTrue(text.contains("João"), "Should render ã correctly");
            assertTrue(text.contains("Conceição"), "Should render ç and ã correctly");
        }

        @Test
        @DisplayName("PDF handles Portuguese location (São Paulo)")
        void pdf_portugueseLocation() throws Exception {
            byte[] pdf = exportService.exportToPdf(portugueseResume());
            String text = extractPdfText(pdf);

            assertTrue(text.contains("São Paulo"), "Should render ã in São correctly");
        }

        @Test
        @DisplayName("PDF handles Portuguese summary with accents (experiência, soluções)")
        void pdf_portugueseSummary() throws Exception {
            byte[] pdf = exportService.exportToPdf(portugueseResume());
            String text = extractPdfText(pdf);

            assertTrue(text.contains("experiência"), "Should render ê correctly");
            assertTrue(text.contains("inovação"), "Should render ç and ã correctly");
        }

        @Test
        @DisplayName("PDF handles Portuguese bullets (microsserviços, otimização)")
        void pdf_portugueseBullets() throws Exception {
            byte[] pdf = exportService.exportToPdf(portugueseResume());
            String text = extractPdfText(pdf);

            assertTrue(text.contains("microsserviços"), "Should render ç in bullets");
            assertTrue(text.contains("otimização"), "Should render ã and ç in bullets");
        }

        @Test
        @DisplayName("PDF handles Portuguese education (Ciência, Computação)")
        void pdf_portugueseEducation() throws Exception {
            byte[] pdf = exportService.exportToPdf(portugueseResume());
            String text = extractPdfText(pdf);

            assertTrue(text.contains("Ciência"), "Should render ê correctly");
            assertTrue(text.contains("Computação"), "Should render ã and ç correctly");
        }

        @Test
        @DisplayName("PDF handles Portuguese language names (Português, Inglês)")
        void pdf_portugueseLanguageNames() throws Exception {
            byte[] pdf = exportService.exportToPdf(portugueseResume());
            String text = extractPdfText(pdf);

            assertTrue(text.contains("Português"), "Should render ê correctly");
            assertTrue(text.contains("Inglês"), "Should render ê correctly");
        }

        @Test
        @DisplayName("PDF handles Spanish characters (ñ, ¿, ¡)")
        void pdf_spanishChars() throws Exception {
            Resume resume = minimalResume();
            resume.getPersonalInfo().setFullName("María Muñoz");
            resume.setSummary("Diseñadora con años de experiencia");

            byte[] pdf = exportService.exportToPdf(resume);
            String text = extractPdfText(pdf);

            assertTrue(text.contains("Muñoz"), "Should render ñ correctly");
            assertTrue(text.contains("Diseñadora"), "Should render ñ in summary");
        }

        @Test
        @DisplayName("PDF handles French characters (è, ê, ë, ù, ô)")
        void pdf_frenchChars() throws Exception {
            Resume resume = minimalResume();
            resume.getPersonalInfo().setFullName("Hélène Côté");
            resume.setSummary("Ingénieure réseau à Montréal");

            byte[] pdf = exportService.exportToPdf(resume);
            String text = extractPdfText(pdf);

            assertTrue(text.contains("Hélène"), "Should render è and é correctly");
            assertTrue(text.contains("Côté"), "Should render ô and é correctly");
        }

        @Test
        @DisplayName("PDF handles German characters (ä, ö, ü, ß)")
        void pdf_germanChars() throws Exception {
            Resume resume = minimalResume();
            resume.getPersonalInfo().setFullName("Jürgen Müller");
            resume.setSummary("Softwareentwickler bei München Straße");

            byte[] pdf = exportService.exportToPdf(resume);
            String text = extractPdfText(pdf);

            assertTrue(text.contains("Jürgen"), "Should render ü correctly");
            assertTrue(text.contains("Müller"), "Should render ü correctly");
            assertTrue(text.contains("Straße"), "Should render ß correctly");
        }

        @Test
        @DisplayName("DOCX also handles Portuguese accented characters")
        void docx_portugueseChars() throws Exception {
            byte[] docx = exportService.exportToDocx(portugueseResume(), "pt-BR");
            String text = extractDocxText(docx);

            assertTrue(text.contains("João"), "DOCX should render ã correctly");
            assertTrue(text.contains("Conceição"), "DOCX should render ç correctly");
            assertTrue(text.contains("São Paulo"), "DOCX should render ã in location");
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STRESS TESTS — MULTI-PAGE PDF
    // ═══════════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("Stress Tests — Large Resumes")
    class StressTests {

        private Resume largeResume() {
            Resume resume = new Resume();
            resume.setTitle("Senior Engineer Resume");
            resume.setPersonalInfo(fullPersonalInfo());
            resume.setSummary("Highly experienced engineer with over 15 years building enterprise "
                    + "systems across finance, healthcare, and e-commerce sectors. Proven track record "
                    + "of leading cross-functional teams and delivering high-impact projects on time.");

            // 12 experiences
            List<Resume.Experience> experiences = new java.util.ArrayList<>();
            for (int i = 1; i <= 12; i++) {
                Resume.Experience exp = new Resume.Experience();
                exp.setTitle("Software Engineer " + (i <= 6 ? "III" : "II") + " — Team " + i);
                exp.setCompany("Company " + i + " Inc.");
                exp.setLocation("City " + i + ", State " + i);
                exp.setStartDate("20" + String.format("%02d", 10 + i) + "-01");
                exp.setEndDate(i < 12 ? "20" + String.format("%02d", 11 + i) + "-12" : null);
                exp.setCurrent(i == 12);
                exp.setBullets(List.of(
                        "Delivered feature " + i + " serving millions of daily active users",
                        "Reduced infrastructure costs by " + (5 + i) + "% through optimization",
                        "Led a team of " + (3 + i) + " engineers across multiple time zones"));
                experiences.add(exp);
            }
            resume.setExperience(experiences);

            // 5 projects
            List<Resume.Project> projects = new java.util.ArrayList<>();
            for (int i = 1; i <= 5; i++) {
                Resume.Project proj = new Resume.Project();
                proj.setName("Project Alpha " + i);
                proj.setTechnologies(List.of("Go", "Rust", "Terraform", "Kubernetes"));
                proj.setStartDate("202" + i + "-06");
                proj.setBullets(List.of(
                        "Implemented core feature set with full test coverage",
                        "Achieved " + (i * 100) + "+ stars on GitHub"));
                projects.add(proj);
            }
            resume.setProjects(projects);

            // 3 education entries
            List<Resume.Education> educations = new java.util.ArrayList<>();
            for (int i = 1; i <= 3; i++) {
                Resume.Education edu = new Resume.Education();
                edu.setDegree(i == 1 ? "PhD Computer Science" : i == 2 ? "MS Computer Science" : "BS Computer Science");
                edu.setInstitution("University " + i);
                edu.setLocation("City " + i);
                edu.setGraduationDate("200" + i);
                educations.add(edu);
            }
            resume.setEducation(educations);

            resume.setSkills(List.of("Java", "Go", "Rust", "Python", "Spring Boot",
                    "Kubernetes", "Terraform", "AWS", "GCP", "PostgreSQL",
                    "Redis", "Kafka", "Docker", "CI/CD", "Microservices"));

            // 5 certifications
            List<Resume.Certification> certs = new java.util.ArrayList<>();
            for (int i = 1; i <= 5; i++) {
                Resume.Certification cert = new Resume.Certification();
                cert.setName("Certification " + i);
                cert.setIssuer("Issuer " + i);
                cert.setDate("202" + i + "-01");
                certs.add(cert);
            }
            resume.setCertifications(certs);

            List<Resume.Language> langs = List.of(
                    createLang("English", "native"),
                    createLang("Portuguese", "fluent"),
                    createLang("Spanish", "intermediate"),
                    createLang("German", "basic"));
            resume.setLanguages(langs);

            return resume;
        }

        private Resume.Language createLang(String name, String level) {
            Resume.Language lang = new Resume.Language();
            lang.setName(name);
            lang.setLevel(level);
            return lang;
        }

        @Test
        @DisplayName("Large resume generates multi-page PDF (>1 page)")
        void largeResume_generatesMultiPagePdf() throws Exception {
            byte[] pdf = exportService.exportToPdf(largeResume());

            assertNotNull(pdf);
            assertTrue(pdf.length > 0);
            int pages = getPdfPageCount(pdf);
            assertTrue(pages > 1,
                    "A resume with 12 experiences + 5 projects should span multiple pages, got " + pages);
        }

        @Test
        @DisplayName("Multi-page PDF contains content from both first and last sections")
        void largeResume_containsAllSections() throws Exception {
            byte[] pdf = exportService.exportToPdf(largeResume(), "en");
            String text = extractPdfText(pdf);

            // First section content
            assertTrue(text.contains("EXPERIENCE"), "Should have EXPERIENCE header");
            assertTrue(text.contains("COMPANY 1 INC."), "Should contain first company (uppercased in PDF)");

            // Last experience
            assertTrue(text.contains("COMPANY 12 INC."), "Should contain last company (page 2+, uppercased in PDF)");

            // Later sections that flow to page 2+
            assertTrue(text.contains("PROJECTS"), "Should have PROJECTS header");
            assertTrue(text.contains("EDUCATION"), "Should have EDUCATION header");
            assertTrue(text.contains("SKILLS"), "Should have SKILLS header");
        }

        @Test
        @DisplayName("Large resume DOCX generates without errors")
        void largeResume_docxGenerates() throws Exception {
            byte[] docx = exportService.exportToDocx(largeResume(), "pt-BR");

            assertNotNull(docx);
            assertTrue(docx.length > 0);
            String text = extractDocxText(docx);
            assertTrue(text.contains("COMPANY 12 INC."), "DOCX should contain all 12 companies (uppercased)");
        }

        @Test
        @DisplayName("Large resume PDF is a reasonable size (< 500KB)")
        void largeResume_reasonableSize() throws Exception {
            byte[] pdf = exportService.exportToPdf(largeResume());
            // Embedded TTF adds size, but should still be reasonable for a text PDF
            assertTrue(pdf.length < 500 * 1024,
                    "PDF should be under 500KB, got " + (pdf.length / 1024) + "KB");
        }
    }
}
