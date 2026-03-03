package com.resuna.service;

import com.resuna.model.Resume;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.interactive.annotation.PDAnnotation;
import org.apache.pdfbox.pdmodel.interactive.annotation.PDAnnotationLink;
import org.apache.pdfbox.pdmodel.interactive.action.PDActionURI;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests for clickable links in PDF exports.
 * Validates that email, phone (WhatsApp), LinkedIn, GitHub, and website
 * are properly rendered as clickable links in generated PDFs.
 */
@SpringBootTest
class PdfLinksTest {

    @Autowired
    private ExportService exportService;

    private Resume createResumeWithLinks() {
        Resume resume = new Resume();
        resume.setTitle("Test Resume with Links");

        Resume.PersonalInfo info = new Resume.PersonalInfo();
        info.setFullName("John Doe");
        info.setEmail("john.doe@example.com");
        info.setPhone("+1234567890");
        info.setLinkedin("linkedin.com/in/johndoe");
        info.setGithub("github.com/johndoe");
        info.setWebsite("johndoe.dev");
        info.setLocation("San Francisco, CA");

        resume.setPersonalInfo(info);
        resume.setSummary("Software Engineer with 5+ years of experience");

        return resume;
    }

    private List<String> extractLinksFromPdf(byte[] pdfBytes) throws IOException {
        List<String> links = new ArrayList<>();

        try (PDDocument document = Loader.loadPDF(pdfBytes)) {
            // Get first page (contact info is on first page)
            var page = document.getPage(0);
            var annotations = page.getAnnotations();

            for (PDAnnotation annotation : annotations) {
                if (annotation instanceof PDAnnotationLink) {
                    PDAnnotationLink linkAnnotation = (PDAnnotationLink) annotation;
                    var action = linkAnnotation.getAction();

                    if (action instanceof PDActionURI) {
                        PDActionURI uriAction = (PDActionURI) action;
                        links.add(uriAction.getURI());
                    }
                }
            }
        }

        return links;
    }

    @Test
    @DisplayName("PDF contains clickable email link")
    void pdf_containsEmailLink() throws Exception {
        Resume resume = createResumeWithLinks();
        byte[] pdf = exportService.exportToPdf(resume, "en");

        List<String> links = extractLinksFromPdf(pdf);

        assertTrue(
            links.stream().anyMatch(link -> link.startsWith("mailto:")),
            "PDF should contain mailto: link for email"
        );

        assertTrue(
            links.stream().anyMatch(link -> link.contains("john.doe@example.com")),
            "PDF should contain email address in mailto link"
        );
    }

    @Test
    @DisplayName("PDF contains clickable WhatsApp link for phone")
    void pdf_containsWhatsAppLink() throws Exception {
        Resume resume = createResumeWithLinks();
        byte[] pdf = exportService.exportToPdf(resume, "en");

        List<String> links = extractLinksFromPdf(pdf);

        assertTrue(
            links.stream().anyMatch(link -> link.startsWith("https://wa.me/")),
            "PDF should contain WhatsApp link for phone number"
        );

        assertTrue(
            links.stream().anyMatch(link -> link.contains("1234567890")),
            "WhatsApp link should contain phone number digits"
        );
    }

    @Test
    @DisplayName("PDF contains clickable LinkedIn link")
    void pdf_containsLinkedInLink() throws Exception {
        Resume resume = createResumeWithLinks();
        byte[] pdf = exportService.exportToPdf(resume, "en");

        List<String> links = extractLinksFromPdf(pdf);

        assertTrue(
            links.stream().anyMatch(link ->
                link.contains("linkedin.com") && link.contains("johndoe")),
            "PDF should contain clickable LinkedIn link"
        );
    }

    @Test
    @DisplayName("PDF contains clickable GitHub link")
    void pdf_containsGitHubLink() throws Exception {
        Resume resume = createResumeWithLinks();
        byte[] pdf = exportService.exportToPdf(resume, "en");

        List<String> links = extractLinksFromPdf(pdf);

        assertTrue(
            links.stream().anyMatch(link ->
                link.contains("github.com") && link.contains("johndoe")),
            "PDF should contain clickable GitHub link"
        );
    }

    @Test
    @DisplayName("PDF contains clickable website link")
    void pdf_containsWebsiteLink() throws Exception {
        Resume resume = createResumeWithLinks();
        byte[] pdf = exportService.exportToPdf(resume, "en");

        List<String> links = extractLinksFromPdf(pdf);

        assertTrue(
            links.stream().anyMatch(link -> link.contains("johndoe.dev")),
            "PDF should contain clickable website link"
        );
    }

    @Test
    @DisplayName("PDF contains exactly 5 clickable links (email, phone, LinkedIn, GitHub, website)")
    void pdf_containsAllContactLinks() throws Exception {
        Resume resume = createResumeWithLinks();
        byte[] pdf = exportService.exportToPdf(resume, "en");

        List<String> links = extractLinksFromPdf(pdf);

        assertEquals(5, links.size(),
            "PDF should contain exactly 5 clickable links for all contact methods");
    }

    @Test
    @DisplayName("PDF with missing contact info only has links for provided fields")
    void pdf_onlyLinksForProvidedFields() throws Exception {
        Resume resume = new Resume();
        resume.setTitle("Minimal Resume");

        Resume.PersonalInfo info = new Resume.PersonalInfo();
        info.setFullName("Jane Smith");
        info.setEmail("jane@example.com"); // Only email provided

        resume.setPersonalInfo(info);

        byte[] pdf = exportService.exportToPdf(resume, "en");
        List<String> links = extractLinksFromPdf(pdf);

        assertEquals(1, links.size(),
            "PDF should only contain link for email (the only contact provided)");

        assertTrue(
            links.get(0).startsWith("mailto:"),
            "The single link should be the email link"
        );
    }

    @Test
    @DisplayName("PDF links have no visible borders (clean appearance)")
    void pdf_linksHaveNoBorders() throws Exception {
        Resume resume = createResumeWithLinks();
        byte[] pdf = exportService.exportToPdf(resume, "en");

        try (PDDocument document = Loader.loadPDF(pdf)) {
            var page = document.getPage(0);
            var annotations = page.getAnnotations();

            for (PDAnnotation annotation : annotations) {
                if (annotation instanceof PDAnnotationLink) {
                    PDAnnotationLink linkAnnotation = (PDAnnotationLink) annotation;
                    var border = linkAnnotation.getBorderStyle();

                    // Border should exist but have 0 width for clean appearance
                    if (border != null) {
                        assertEquals(0, border.getWidth(),
                            "Link borders should have 0 width for clean appearance");
                    }
                }
            }
        }
    }
}
