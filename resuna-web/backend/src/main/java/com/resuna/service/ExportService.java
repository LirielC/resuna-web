package com.resuna.service;

import com.resuna.model.Resume;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.apache.pdfbox.pdmodel.font.PDType0Font;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.apache.pdfbox.pdmodel.interactive.action.PDActionURI;
import org.apache.pdfbox.pdmodel.interactive.annotation.PDAnnotationLink;
import org.apache.pdfbox.pdmodel.interactive.annotation.PDBorderStyleDictionary;
import org.apache.poi.xwpf.usermodel.*;
import org.apache.poi.xwpf.usermodel.XWPFRelation;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

@Service
public class ExportService {

    private static final Logger logger = LoggerFactory.getLogger(ExportService.class);

    // A4 size page constants
    private static final float PAGE_WIDTH = 595.28f;
    private static final float PAGE_HEIGHT = 841.89f;
    // 1.27 cm = 36 pt (narrow ATS margins)
    private static final float MARGIN_LEFT = 36;
    private static final float MARGIN_RIGHT = 36;
    private static final float MARGIN_TOP = 36;
    private static final float MARGIN_BOTTOM = 36;
    private static final float CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;

    private static final float LINE_HEIGHT = 13.2f; // ~120% of 11pt body text (headers/titles)
    private static final float BULLET_LINE_HEIGHT = 11.5f; // tighter spacing for bullet lists
    private static final float SECTION_SPACING = 17; // ~12pt before section header

    // ── Mutable state for multi-page rendering ──────────────────────────

    private final ThreadLocal<PDDocument> currentDocument = new ThreadLocal<>();
    private final ThreadLocal<PDPageContentStream> currentContentStream = new ThreadLocal<>();
    private final ThreadLocal<float[]> currentY = new ThreadLocal<>();

    // ── Font loading ─────────────────────────────────────────────────────

    /**
     * Loads an embedded TrueType font from classpath resources.
     * Falls back to built-in Helvetica if the TTF is not found.
     */
    private PDFont loadFont(PDDocument document, String resourcePath, Standard14Fonts.FontName fallback)
            throws IOException {
        try (InputStream is = getClass().getResourceAsStream(resourcePath)) {
            if (is != null) {
                return PDType0Font.load(document, is);
            }
        } catch (Exception e) {
            logger.warn("Failed to load font {}: {}", resourcePath, e.getMessage());
        }
        logger.warn("Font {} not found on classpath, falling back to {}", resourcePath, fallback);
        return new PDType1Font(fallback);
    }

    // ── Multi-page helpers ───────────────────────────────────────────────

    /**
     * Checks if the current y position is too low and, if so, creates
     * a new page and returns the fresh y coordinate.
     */
    private float ensureSpace(float y, float requiredHeight, PDFont font) throws IOException {
        if (y - requiredHeight < MARGIN_BOTTOM) {
            currentContentStream.get().close();
            PDPage newPage = new PDPage(PDRectangle.A4);
            currentDocument.get().addPage(newPage);
            currentContentStream.set(new PDPageContentStream(currentDocument.get(), newPage));
            return PAGE_HEIGHT - MARGIN_TOP;
        }
        return y;
    }

    // ═════════════════════════════════════════════════════════════════════
    // PDF EXPORT
    // ═════════════════════════════════════════════════════════════════════

    public byte[] exportToPdf(Resume resume) throws IOException {
        return exportToPdf(resume, "pt-BR");
    }

    public byte[] exportToPdf(Resume resume, String locale) throws IOException {
        try (PDDocument document = new PDDocument();
                ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {

            currentDocument.set(document);

            // Load Unicode-capable TTF fonts from classpath
            PDFont fontBold = loadFont(document, "/fonts/timesbd.ttf", Standard14Fonts.FontName.TIMES_BOLD);
            PDFont fontRegular = loadFont(document, "/fonts/times.ttf", Standard14Fonts.FontName.TIMES_ROMAN);
            PDFont fontItalic = loadFont(document, "/fonts/timesi.ttf", Standard14Fonts.FontName.TIMES_ITALIC);

            PDPage firstPage = new PDPage(PDRectangle.A4);
            document.addPage(firstPage);
            currentContentStream.set(new PDPageContentStream(document, firstPage));
            currentY.set(new float[]{PAGE_HEIGHT - MARGIN_TOP});

            try {
                // ============ HEADER - CENTERED NAME ============
                if (resume.getPersonalInfo() != null && resume.getPersonalInfo().getFullName() != null) {
                    String name = resume.getPersonalInfo().getFullName();
                    float nameWidth = fontBold.getStringWidth(name) / 1000 * 16;
                    float nameX = (PAGE_WIDTH - nameWidth) / 2;

                    currentContentStream.get().beginText();
                    currentContentStream.get().setFont(fontBold, 16);
                    currentContentStream.get().newLineAtOffset(nameX, currentY.get()[0]);
                    currentContentStream.get().showText(name);
                    currentContentStream.get().endText();
                    currentY.get()[0] -= 20;
                }

                // ============ CONTACT INFO LINE - CENTERED WITH CLICKABLE LINKS ============
                if (resume.getPersonalInfo() != null) {
                    Resume.PersonalInfo info = resume.getPersonalInfo();

                    // Location on its own line between name and contacts (never gets pushed off-page)
                    if (info.getLocation() != null && !info.getLocation().isEmpty()) {
                        float locFontSize = 11f;
                        float locWidth = fontItalic.getStringWidth(info.getLocation()) / 1000 * locFontSize;
                        float locX = (PAGE_WIDTH - locWidth) / 2;
                        currentContentStream.get().beginText();
                        currentContentStream.get().setFont(fontItalic, locFontSize);
                        currentContentStream.get().newLineAtOffset(locX, currentY.get()[0]);
                        currentContentStream.get().showText(info.getLocation());
                        currentContentStream.get().endText();
                        currentY.get()[0] -= 16;
                    }

                    float contactFontSize = 10.5f;
                    String separator = " | ";
                    float separatorWidth = fontRegular.getStringWidth(separator) / 1000 * contactFontSize;

                    // Build contact parts with metadata for links (location excluded — rendered above)
                    List<ContactPart> contactParts = new ArrayList<>();

                    if (info.getPhone() != null && !info.getPhone().isEmpty()) {
                        String whatsappNumber = formatWhatsAppNumber(info.getPhone());
                        contactParts.add(new ContactPart(info.getPhone(), "https://wa.me/" + whatsappNumber));
                    }
                    if (info.getEmail() != null && !info.getEmail().isEmpty()) {
                        contactParts.add(new ContactPart(info.getEmail(), "mailto:" + info.getEmail()));
                    }
                    if (info.getLinkedin() != null && !info.getLinkedin().isEmpty()) {
                        String displayLinkedin = info.getLinkedin().replace("https://", "").replace("http://", "")
                                .replace("www.", "");
                        String fullUrl = sanitizeUrl(info.getLinkedin());
                        contactParts.add(new ContactPart(displayLinkedin, fullUrl));
                    }
                    if (info.getGithub() != null && !info.getGithub().isEmpty()) {
                        String displayGithub = info.getGithub().replace("https://", "").replace("http://", "")
                                .replace("www.", "");
                        String fullUrl = sanitizeUrl(info.getGithub());
                        contactParts.add(new ContactPart(displayGithub, fullUrl));
                    }
                    if (info.getWebsite() != null && !info.getWebsite().isEmpty()) {
                        String displayWebsite = info.getWebsite().replace("https://", "").replace("http://", "")
                                .replace("www.", "");
                        String fullUrl = sanitizeUrl(info.getWebsite());
                        contactParts.add(new ContactPart(displayWebsite, fullUrl));
                    }

                    if (!contactParts.isEmpty()) {
                        // Calculate total width
                        float totalWidth = 0;
                        for (int i = 0; i < contactParts.size(); i++) {
                            totalWidth += fontRegular.getStringWidth(contactParts.get(i).text) / 1000 * contactFontSize;
                            if (i < contactParts.size() - 1) {
                                totalWidth += separatorWidth;
                            }
                        }

                        // Start position (centered)
                        float currentX = (PAGE_WIDTH - totalWidth) / 2;
                        float linkY = currentY.get()[0];

                        // Draw each contact part with links
                        currentContentStream.get().setFont(fontRegular, contactFontSize);
                        for (int i = 0; i < contactParts.size(); i++) {
                            ContactPart part = contactParts.get(i);
                            float partWidth = fontRegular.getStringWidth(part.text) / 1000 * contactFontSize;

                            // Draw text (blue for links, black for plain)
                            if (part.url != null) {
                                currentContentStream.get().setNonStrokingColor(26f/255f, 115f/255f, 232f/255f);
                            }
                            currentContentStream.get().beginText();
                            currentContentStream.get().newLineAtOffset(currentX, currentY.get()[0]);
                            currentContentStream.get().showText(part.text);
                            currentContentStream.get().endText();
                            if (part.url != null) {
                                currentContentStream.get().setNonStrokingColor(0, 0, 0);
                            }

                            // Add clickable link if URL exists
                            if (part.url != null) {
                                addClickableLink(part.url, currentX, linkY, partWidth, contactFontSize + 2, firstPage);
                            }

                            currentX += partWidth;

                            // Add separator
                            if (i < contactParts.size() - 1) {
                                currentContentStream.get().beginText();
                                currentContentStream.get().newLineAtOffset(currentX, currentY.get()[0]);
                                currentContentStream.get().showText(separator);
                                currentContentStream.get().endText();
                                currentX += separatorWidth;
                            }
                        }

                        currentY.get()[0] -= 22;
                    }
                }

                // ============ SUMMARY SECTION ============
                if (resume.getSummary() != null && !resume.getSummary().trim().isEmpty()) {
                    currentY.get()[0] -= SECTION_SPACING;
                    currentY.get()[0] = ensureSpace(currentY.get()[0], 30, fontBold);
                    currentY.get()[0] = drawSectionHeader(currentContentStream.get(), isPtBr(locale) ? "RESUMO" : "SUMMARY", currentY.get()[0],
                            fontBold);
                    currentY.get()[0] = drawWrappedText(resume.getSummary(), currentY.get()[0], fontRegular, 11, CONTENT_WIDTH,
                            MARGIN_LEFT);
                }

                // ============ EXPERIENCE SECTION ============
                if (resume.getExperience() != null && !resume.getExperience().isEmpty()) {
                    currentY.get()[0] -= SECTION_SPACING;
                    currentY.get()[0] = ensureSpace(currentY.get()[0], 30, fontBold);
                    currentY.get()[0] = drawSectionHeader(currentContentStream.get(), isPtBr(locale) ? "EXPERIÊNCIA" : "EXPERIENCE",
                            currentY.get()[0], fontBold);

                    for (Resume.Experience exp : resume.getExperience()) {
                        currentY.get()[0] = ensureSpace(currentY.get()[0], 36, fontBold);

                        String company = safeString(exp.getCompany()).toUpperCase();
                        String title = safeString(exp.getTitle());
                        String dateRange = formatDateRange(exp.getStartDate(), exp.getEndDate(), exp.isCurrent(),
                                locale);
                        String location = exp.getLocation() != null ? exp.getLocation() : "";

                        // Company (Título 2): Bold + Uppercase + date range right-aligned
                        currentContentStream.get().beginText();
                        currentContentStream.get().setFont(fontBold, 11);
                        currentContentStream.get().newLineAtOffset(MARGIN_LEFT, currentY.get()[0]);
                        currentContentStream.get().showText(company);
                        currentContentStream.get().endText();

                        if (!dateRange.isEmpty()) {
                            float dateWidth = fontBold.getStringWidth(dateRange) / 1000 * 11;
                            currentContentStream.get().beginText();
                            currentContentStream.get().setFont(fontBold, 11);
                            currentContentStream.get().newLineAtOffset(PAGE_WIDTH - MARGIN_RIGHT - dateWidth, currentY.get()[0]);
                            currentContentStream.get().showText(dateRange);
                            currentContentStream.get().endText();
                        }
                        currentY.get()[0] -= LINE_HEIGHT;

                        // Job title (Título 3): Italic + location right-aligned
                        if (!title.isEmpty()) {
                            currentY.get()[0] = ensureSpace(currentY.get()[0], LINE_HEIGHT, fontItalic);
                            currentContentStream.get().beginText();
                            currentContentStream.get().setFont(fontItalic, 11);
                            currentContentStream.get().newLineAtOffset(MARGIN_LEFT, currentY.get()[0]);
                            currentContentStream.get().showText(title);
                            currentContentStream.get().endText();

                            if (!location.isEmpty()) {
                                float locWidth = fontItalic.getStringWidth(location) / 1000 * 11;
                                currentContentStream.get().beginText();
                                currentContentStream.get().setFont(fontItalic, 11);
                                currentContentStream.get().newLineAtOffset(PAGE_WIDTH - MARGIN_RIGHT - locWidth, currentY.get()[0]);
                                currentContentStream.get().showText(location);
                                currentContentStream.get().endText();
                            }
                            currentY.get()[0] -= LINE_HEIGHT;
                        }

                        if (exp.getBullets() != null) {
                            for (String bullet : exp.getBullets()) {
                                if (bullet != null && !bullet.trim().isEmpty()) {
                                    currentY.get()[0] = ensureSpace(currentY.get()[0], BULLET_LINE_HEIGHT, fontRegular);
                                    String cleanBullet = bullet.trim().replaceFirst("^[•\\-\\*]\\s*", "");
                                    String bulletText = "\u2022 " + cleanBullet;
                                    currentY.get()[0] = drawWrappedText(bulletText, currentY.get()[0], fontRegular, 11,
                                            CONTENT_WIDTH, MARGIN_LEFT, BULLET_LINE_HEIGHT);
                                }
                            }
                        }
                        currentY.get()[0] -= 4;
                    }
                }

                // ============ PROJECTS SECTION ============
                if (resume.getProjects() != null && !resume.getProjects().isEmpty()) {
                    currentY.get()[0] -= SECTION_SPACING;
                    currentY.get()[0] = ensureSpace(currentY.get()[0], 30, fontBold);
                    currentY.get()[0] = drawSectionHeader(currentContentStream.get(), isPtBr(locale) ? "PROJETOS" : "PROJECTS",
                            currentY.get()[0], fontBold);

                    for (Resume.Project proj : resume.getProjects()) {
                        currentY.get()[0] = ensureSpace(currentY.get()[0], 36, fontBold);

                        String name = safeString(proj.getName());
                        String dateRange = formatDateRange(proj.getStartDate(), proj.getEndDate(), false, locale);
                        String projUrl = sanitizeUrl(proj.getUrl());

                        // Project name — bold, left-aligned
                        currentContentStream.get().beginText();
                        currentContentStream.get().setFont(fontBold, 11);
                        currentContentStream.get().newLineAtOffset(MARGIN_LEFT, currentY.get()[0]);
                        currentContentStream.get().showText(name.toUpperCase());
                        currentContentStream.get().endText();

                        // URL right-aligned on same line as name (blue, clickable)
                        if (projUrl != null) {
                            String displayUrl = proj.getUrl().trim()
                                    .replaceFirst("(?i)^https?://", "").replaceFirst("^www\\.", "");
                            float urlFontSize = 10f;
                            float urlWidth = fontRegular.getStringWidth(displayUrl) / 1000 * urlFontSize;
                            float urlX = PAGE_WIDTH - MARGIN_RIGHT - urlWidth;
                            float urlLinkY = currentY.get()[0];
                            currentContentStream.get().setNonStrokingColor(26f / 255f, 115f / 255f, 232f / 255f);
                            currentContentStream.get().beginText();
                            currentContentStream.get().setFont(fontRegular, urlFontSize);
                            currentContentStream.get().newLineAtOffset(urlX, currentY.get()[0]);
                            currentContentStream.get().showText(displayUrl);
                            currentContentStream.get().endText();
                            currentContentStream.get().setNonStrokingColor(0, 0, 0);
                            PDPage activePage = currentDocument.get()
                                    .getPage(currentDocument.get().getNumberOfPages() - 1);
                            addClickableLink(projUrl, urlX, urlLinkY, urlWidth, urlFontSize + 2, activePage);
                        } else if (!dateRange.isEmpty()) {
                            // No URL: show date range right-aligned instead
                            float dateWidth = fontBold.getStringWidth(dateRange) / 1000 * 11;
                            currentContentStream.get().beginText();
                            currentContentStream.get().setFont(fontBold, 11);
                            currentContentStream.get().newLineAtOffset(PAGE_WIDTH - MARGIN_RIGHT - dateWidth, currentY.get()[0]);
                            currentContentStream.get().showText(dateRange);
                            currentContentStream.get().endText();
                        }
                        currentY.get()[0] -= LINE_HEIGHT;

                        // Technologies (italic, below title)
                        if (proj.getTechnologies() != null && !proj.getTechnologies().isEmpty()) {
                            currentY.get()[0] = ensureSpace(currentY.get()[0], LINE_HEIGHT, fontItalic);
                            String techStr = String.join(", ", proj.getTechnologies());
                            currentContentStream.get().beginText();
                            currentContentStream.get().setFont(fontItalic, 11);
                            currentContentStream.get().newLineAtOffset(MARGIN_LEFT, currentY.get()[0]);
                            currentContentStream.get().showText(techStr);
                            currentContentStream.get().endText();
                            currentY.get()[0] -= LINE_HEIGHT;
                        }

                        // Description (wrapped, regular text)
                        if (proj.getDescription() != null && !proj.getDescription().trim().isEmpty()) {
                            currentY.get()[0] = drawWrappedText(proj.getDescription().trim(),
                                    currentY.get()[0], fontRegular, 11, CONTENT_WIDTH, MARGIN_LEFT, BULLET_LINE_HEIGHT);
                        }

                        if (proj.getBullets() != null) {
                            for (String bullet : proj.getBullets()) {
                                if (bullet != null && !bullet.trim().isEmpty()) {
                                    currentY.get()[0] = ensureSpace(currentY.get()[0], BULLET_LINE_HEIGHT, fontRegular);
                                    String cleanBullet = bullet.trim().replaceFirst("^[•\\-\\*]\\s*", "");
                                    String bulletText = "\u2022 " + cleanBullet;
                                    currentY.get()[0] = drawWrappedText(bulletText, currentY.get()[0], fontRegular, 11,
                                            CONTENT_WIDTH, MARGIN_LEFT, BULLET_LINE_HEIGHT);
                                }
                            }
                        }
                        currentY.get()[0] -= 4;
                    }
                }

                // ============ EDUCATION SECTION ============
                if (resume.getEducation() != null && !resume.getEducation().isEmpty()) {
                    currentY.get()[0] -= SECTION_SPACING;
                    currentY.get()[0] = ensureSpace(currentY.get()[0], 30, fontBold);
                    currentY.get()[0] = drawSectionHeader(currentContentStream.get(), isPtBr(locale) ? "FORMAÇÃO" : "EDUCATION",
                            currentY.get()[0], fontBold);

                    for (Resume.Education edu : resume.getEducation()) {
                        currentY.get()[0] = ensureSpace(currentY.get()[0], 30, fontBold);

                        String institution = safeString(edu.getInstitution());
                        String location = edu.getLocation() != null ? edu.getLocation() : "";

                        currentContentStream.get().beginText();
                        currentContentStream.get().setFont(fontBold, 11);
                        currentContentStream.get().newLineAtOffset(MARGIN_LEFT, currentY.get()[0]);
                        currentContentStream.get().showText(institution.toUpperCase());
                        currentContentStream.get().endText();

                        if (!location.isEmpty()) {
                            float locWidth = fontBold.getStringWidth(location) / 1000 * 11;
                            currentContentStream.get().beginText();
                            currentContentStream.get().setFont(fontBold, 11);
                            currentContentStream.get().newLineAtOffset(PAGE_WIDTH - MARGIN_RIGHT - locWidth, currentY.get()[0]);
                            currentContentStream.get().showText(location);
                            currentContentStream.get().endText();
                        }
                        currentY.get()[0] -= LINE_HEIGHT;

                        String degree = safeString(edu.getDegree());
                        String gradDate = formatMonthYear(edu.getGraduationDate(), locale);
                        String eduStart = formatMonthYear(edu.getStartDate(), locale);
                        String eduDateRange = (!eduStart.isEmpty() && !gradDate.isEmpty())
                                ? eduStart + " \u2014 " + gradDate
                                : gradDate;

                        currentY.get()[0] = ensureSpace(currentY.get()[0], LINE_HEIGHT, fontItalic);
                        currentContentStream.get().beginText();
                        currentContentStream.get().setFont(fontItalic, 11);
                        currentContentStream.get().newLineAtOffset(MARGIN_LEFT, currentY.get()[0]);
                        currentContentStream.get().showText(degree);
                        currentContentStream.get().endText();

                        if (!eduDateRange.isEmpty()) {
                            float dateWidth = fontItalic.getStringWidth(eduDateRange) / 1000 * 11;
                            currentContentStream.get().beginText();
                            currentContentStream.get().setFont(fontItalic, 11);
                            currentContentStream.get().newLineAtOffset(PAGE_WIDTH - MARGIN_RIGHT - dateWidth, currentY.get()[0]);
                            currentContentStream.get().showText(eduDateRange);
                            currentContentStream.get().endText();
                        }
                        currentY.get()[0] -= LINE_HEIGHT;

                        // GPA (if set)
                        if (edu.getGpa() != null && !edu.getGpa().isBlank()) {
                            currentY.get()[0] = ensureSpace(currentY.get()[0], LINE_HEIGHT, fontRegular);
                            String gpaLabel = isPtBr(locale) ? "CRA: " : "GPA: ";
                            currentContentStream.get().beginText();
                            currentContentStream.get().setFont(fontRegular, 11);
                            currentContentStream.get().newLineAtOffset(MARGIN_LEFT, currentY.get()[0]);
                            currentContentStream.get().showText(gpaLabel + edu.getGpa());
                            currentContentStream.get().endText();
                            currentY.get()[0] -= LINE_HEIGHT;
                        }
                        currentY.get()[0] -= 4;
                    }
                }

                // ============ SKILLS SECTION ============
                boolean hasSkillGroups = resume.getSkillGroups() != null && !resume.getSkillGroups().isEmpty();
                boolean hasSkills = resume.getSkills() != null && !resume.getSkills().isEmpty();
                if (hasSkillGroups || hasSkills) {
                    currentY.get()[0] -= SECTION_SPACING;
                    currentY.get()[0] = ensureSpace(currentY.get()[0], 30, fontBold);
                    currentY.get()[0] = drawSectionHeader(currentContentStream.get(),
                            isPtBr(locale) ? "HABILIDADES TÉCNICAS" : "TECHNICAL SKILLS", currentY.get()[0], fontBold);

                    if (hasSkillGroups) {
                        // Grouped layout: "Category  item1, item2, ..." one row per group
                        float labelWidth = 120f; // fixed width for category label column
                        float itemsX = MARGIN_LEFT + labelWidth;
                        float itemsWidth = CONTENT_WIDTH - labelWidth;
                        for (Resume.SkillGroup group : resume.getSkillGroups()) {
                            if (group.getCategory() == null || group.getItems() == null || group.getItems().isEmpty())
                                continue;
                            currentY.get()[0] = ensureSpace(currentY.get()[0], BULLET_LINE_HEIGHT, fontRegular);
                            // Category label bold
                            currentContentStream.get().beginText();
                            currentContentStream.get().setFont(fontBold, 11);
                            currentContentStream.get().newLineAtOffset(MARGIN_LEFT, currentY.get()[0]);
                            currentContentStream.get().showText(group.getCategory());
                            currentContentStream.get().endText();
                            // Items as wrapped text to the right
                            String itemsStr = String.join(", ", group.getItems());
                            currentY.get()[0] = drawWrappedText(itemsStr, currentY.get()[0], fontRegular, 11,
                                    itemsWidth, itemsX, BULLET_LINE_HEIGHT);
                        }
                    } else {
                        // Flat 2-column bullet layout (legacy)
                        List<String> skillList = resume.getSkills();
                        float colWidth = (CONTENT_WIDTH - 10) / 2;
                        float col2X = MARGIN_LEFT + colWidth + 10;
                        for (int si = 0; si < skillList.size(); si += 2) {
                            currentY.get()[0] = ensureSpace(currentY.get()[0], BULLET_LINE_HEIGHT, fontRegular);
                            String leftSkill = "\u2022 " + skillList.get(si);
                            currentContentStream.get().beginText();
                            currentContentStream.get().setFont(fontRegular, 11);
                            currentContentStream.get().newLineAtOffset(MARGIN_LEFT, currentY.get()[0]);
                            currentContentStream.get().showText(leftSkill);
                            currentContentStream.get().endText();
                            if (si + 1 < skillList.size()) {
                                String rightSkill = "\u2022 " + skillList.get(si + 1);
                                currentContentStream.get().beginText();
                                currentContentStream.get().setFont(fontRegular, 11);
                                currentContentStream.get().newLineAtOffset(col2X, currentY.get()[0]);
                                currentContentStream.get().showText(rightSkill);
                                currentContentStream.get().endText();
                            }
                            currentY.get()[0] -= BULLET_LINE_HEIGHT;
                        }
                    }
                }

                // ============ CERTIFICATIONS SECTION ============
                if (resume.getCertifications() != null && !resume.getCertifications().isEmpty()) {
                    currentY.get()[0] -= SECTION_SPACING;
                    currentY.get()[0] = ensureSpace(currentY.get()[0], 30, fontBold);
                    currentY.get()[0] = drawSectionHeader(currentContentStream.get(),
                            isPtBr(locale) ? "CURSOS / CERTIFICAÇÕES" : "COURSES / CERTIFICATIONS", currentY.get()[0], fontBold);

                    for (Resume.Certification cert : resume.getCertifications()) {
                        currentY.get()[0] = ensureSpace(currentY.get()[0], LINE_HEIGHT, fontRegular);
                        StringBuilder certLine = new StringBuilder("\u2022 " + safeString(cert.getName()));
                        if (cert.getIssuer() != null && !cert.getIssuer().isEmpty()) {
                            certLine.append(" - ").append(cert.getIssuer());
                        }
                        if (cert.getDate() != null && !cert.getDate().isEmpty()) {
                            certLine.append(" (").append(cert.getDate()).append(")");
                        }
                        currentContentStream.get().beginText();
                        currentContentStream.get().setFont(fontRegular, 11);
                        currentContentStream.get().newLineAtOffset(MARGIN_LEFT, currentY.get()[0]);
                        currentContentStream.get().showText(certLine.toString());
                        currentContentStream.get().endText();

                        // URL right-aligned on same line (blue, clickable)
                        String certUrl = sanitizeUrl(cert.getUrl());
                        if (certUrl != null) {
                            String displayUrl = cert.getUrl().trim()
                                    .replaceFirst("(?i)^https?://", "").replaceFirst("^www\\.", "");
                            float urlFontSize = 10f;
                            float urlWidth = fontRegular.getStringWidth(displayUrl) / 1000 * urlFontSize;
                            float urlX = PAGE_WIDTH - MARGIN_RIGHT - urlWidth;
                            float urlLinkY = currentY.get()[0];
                            currentContentStream.get().setNonStrokingColor(26f / 255f, 115f / 255f, 232f / 255f);
                            currentContentStream.get().beginText();
                            currentContentStream.get().setFont(fontRegular, urlFontSize);
                            currentContentStream.get().newLineAtOffset(urlX, currentY.get()[0]);
                            currentContentStream.get().showText(displayUrl);
                            currentContentStream.get().endText();
                            currentContentStream.get().setNonStrokingColor(0, 0, 0);
                            PDPage activePage = currentDocument.get()
                                    .getPage(currentDocument.get().getNumberOfPages() - 1);
                            addClickableLink(certUrl, urlX, urlLinkY, urlWidth, urlFontSize + 2, activePage);
                        }

                        currentY.get()[0] -= LINE_HEIGHT;
                    }
                }

                // ============ LANGUAGES SECTION ============
                if (resume.getLanguages() != null && !resume.getLanguages().isEmpty()) {
                    currentY.get()[0] -= SECTION_SPACING;
                    currentY.get()[0] = ensureSpace(currentY.get()[0], 30, fontBold);
                    currentY.get()[0] = drawSectionHeader(currentContentStream.get(), isPtBr(locale) ? "IDIOMAS" : "LANGUAGES",
                            currentY.get()[0], fontBold);

                    for (Resume.Language lang : resume.getLanguages()) {
                        currentY.get()[0] = ensureSpace(currentY.get()[0], LINE_HEIGHT, fontRegular);
                        StringBuilder langStr = new StringBuilder("\u2022 " + safeString(lang.getName()));
                        if (lang.getLevel() != null && !lang.getLevel().isEmpty()) {
                            langStr.append(" \u2014 ").append(translateLevel(lang.getLevel(), locale));
                        }
                        currentContentStream.get().beginText();
                        currentContentStream.get().setFont(fontRegular, 11);
                        currentContentStream.get().newLineAtOffset(MARGIN_LEFT, currentY.get()[0]);
                        currentContentStream.get().showText(langStr.toString());
                        currentContentStream.get().endText();
                        currentY.get()[0] -= LINE_HEIGHT;
                    }
                }

            } finally {
                currentContentStream.get().close();
                currentDocument.remove();
                currentContentStream.remove();
                currentY.remove();
            }

            document.save(outputStream);
            return outputStream.toByteArray();
        }
    }

    // ── PDF helpers ──────────────────────────────────────────────────────

    /**
     * Adds a clickable link annotation to the current page at the specified
     * position.
     */
    private void addClickableLink(String url, float x, float y, float width, float height, PDPage page) {
        if (url == null) return;
        try {
            PDAnnotationLink link = new PDAnnotationLink();

            // Set the rectangle area for the link (x, y-height, x+width, y)
            PDRectangle position = new PDRectangle(x, y - height, width, height);
            link.setRectangle(position);

            // Remove border for cleaner look
            PDBorderStyleDictionary borderStyle = new PDBorderStyleDictionary();
            borderStyle.setStyle(PDBorderStyleDictionary.STYLE_UNDERLINE);
            borderStyle.setWidth(0);
            link.setBorderStyle(borderStyle);

            // Set the URI action
            PDActionURI action = new PDActionURI();
            action.setURI(url);
            link.setAction(action);

            // Add the annotation to the page
            page.getAnnotations().add(link);
        } catch (Exception e) {
            logger.warn("Failed to add clickable link for {}: {}", url, e.getMessage());
        }
    }

    private float drawSectionHeader(PDPageContentStream cs, String title, float y, PDFont font) throws IOException {
        // Title in dark blue #2E3A59
        cs.setNonStrokingColor(46f/255f, 58f/255f, 89f/255f);
        cs.beginText();
        cs.setFont(font, 12);
        cs.newLineAtOffset(MARGIN_LEFT, y);
        cs.showText(title);
        cs.endText();
        cs.setNonStrokingColor(0, 0, 0);

        // Horizontal rule in dark blue
        float lineY = y - 3;
        cs.setStrokingColor(46f/255f, 58f/255f, 89f/255f);
        cs.setLineWidth(0.75f);
        cs.moveTo(MARGIN_LEFT, lineY);
        cs.lineTo(PAGE_WIDTH - MARGIN_RIGHT, lineY);
        cs.stroke();
        cs.setStrokingColor(0, 0, 0);

        return y - 18;
    }

    /**
     * Draws wrapped text, handling page breaks automatically.
     */
    private float drawWrappedText(String text, float y, PDFont font,
            float fontSize, float maxWidth, float startX) throws IOException {
        return drawWrappedText(text, y, font, fontSize, maxWidth, startX, LINE_HEIGHT);
    }

    private float drawWrappedText(String text, float y, PDFont font,
            float fontSize, float maxWidth, float startX, float lineHeight) throws IOException {
        if (text == null || text.isEmpty())
            return y;

        List<String> lines = wrapText(text, font, fontSize, maxWidth);
        for (String line : lines) {
            y = ensureSpace(y, lineHeight, font);
            currentContentStream.get().beginText();
            currentContentStream.get().setFont(font, fontSize);
            currentContentStream.get().newLineAtOffset(startX, y);
            currentContentStream.get().showText(line);
            currentContentStream.get().endText();
            y -= lineHeight;
        }
        return y;
    }

    private List<String> wrapText(String text, PDFont font, float fontSize, float maxWidth) throws IOException {
        List<String> lines = new ArrayList<>();
        String[] words = text.split("\\s+");
        StringBuilder currentLine = new StringBuilder();

        for (String word : words) {
            String testLine = currentLine.length() > 0 ? currentLine + " " + word : word;
            float testWidth = font.getStringWidth(testLine) / 1000 * fontSize;

            if (testWidth > maxWidth && currentLine.length() > 0) {
                lines.add(currentLine.toString());
                currentLine = new StringBuilder(word);
            } else {
                currentLine = new StringBuilder(testLine);
            }
        }

        if (currentLine.length() > 0) {
            lines.add(currentLine.toString());
        }

        return lines;
    }

    private String formatDateRange(String start, String end, boolean current) {
        return formatDateRange(start, end, current, "en");
    }

    private String formatDateRange(String start, String end, boolean current, String locale) {
        String startStr = formatMonthYear(start, locale);
        String presentLabel = isPtBr(locale) ? "Atual" : "Present";
        String endStr = current ? presentLabel : formatMonthYear(end, locale);

        if (startStr.isEmpty() && endStr.isEmpty())
            return "";
        if (startStr.isEmpty())
            return endStr;
        if (endStr.isEmpty())
            return startStr;
        return startStr + " - " + endStr;
    }

    private String formatMonthYear(String date) {
        return formatMonthYear(date, "en");
    }

    private String formatMonthYear(String date, String locale) {
        if (date == null || date.isEmpty())
            return "";
        String[] parts = date.split("-");
        if (parts.length >= 2) {
            String[] monthsEn = { "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" };
            String[] monthsPt = { "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez" };
            String[] months = isPtBr(locale) ? monthsPt : monthsEn;
            try {
                int monthNum = Integer.parseInt(parts[1]);
                if (monthNum >= 1 && monthNum <= 12) {
                    return months[monthNum - 1] + " " + parts[0];
                }
            } catch (NumberFormatException e) {
                // Fall through to return original
            }
        }
        return date;
    }

    private boolean isPtBr(String locale) {
        return locale != null && (locale.startsWith("pt") || locale.equals("pt-BR"));
    }

    private String capitalizeFirst(String s) {
        if (s == null || s.isEmpty())
            return s;
        return s.substring(0, 1).toUpperCase() + s.substring(1).toLowerCase();
    }

    private String translateLevel(String level, String locale) {
        if (level == null || level.isEmpty()) return "";
        if (isPtBr(locale)) {
            switch (level.toLowerCase()) {
                case "basic": return "Básico";
                case "intermediate": return "Intermediário";
                case "advanced": return "Avançado";
                case "fluent": return "Fluente";
                case "native": return "Nativo";
                case "professional": return "Profissional";
                default: return capitalizeFirst(level);
            }
        }
        switch (level.toLowerCase()) {
            case "basic": return "Basic";
            case "intermediate": return "Intermediate";
            case "advanced": return "Advanced";
            case "fluent": return "Fluent";
            case "native": return "Native";
            case "professional": return "Professional";
            default: return capitalizeFirst(level);
        }
    }

    private String safeString(String s) {
        return s != null ? s : "";
    }

    /**
     * Formats a phone number for WhatsApp links.
     * Strips non-numeric characters and prepends Brazil country code (+55)
     * if the number doesn't already include an international prefix.
     *
     * Examples:
     * "(11) 98765-4321" → "5511987654321"
     * "+5511987654321" → "5511987654321"
     * "5511987654321" → "5511987654321"
     * "+1 555 123 4567" → "15551234567" (non-BR number preserved)
     */
    private String formatWhatsAppNumber(String phone) {
        if (phone == null || phone.isEmpty())
            return "";

        // Check if number has explicit + prefix before stripping
        boolean hasPlus = phone.trim().startsWith("+");

        // Remove all non-digit characters
        String digits = phone.replaceAll("[^0-9]", "");

        if (digits.isEmpty())
            return "";

        if (hasPlus) {
            // Number already has international prefix (e.g. +55, +1), use as-is
            return digits;
        }

        if (digits.startsWith("55") && digits.length() >= 12) {
            // Already has Brazil country code (55 + 2-digit DDD + 8-9 digit number)
            return digits;
        }

        // Brazilian number without country code — prepend 55
        return "55" + digits;
    }

    private static String sanitizeUrl(String raw) {
        if (raw == null || raw.isBlank()) return null;
        String trimmed = raw.trim();
        if (trimmed.matches("(?i)^https?://.*")) return trimmed;
        if (trimmed.matches("(?i)^mailto:.*") || trimmed.matches("(?i)^tel:.*")) return trimmed;
        if (!trimmed.contains("://")) return "https://" + trimmed;
        return null;
    }

    // ── Helper class for contact parts with optional links ──────────────

    private static class ContactPart {
        final String text;
        final String url;

        ContactPart(String text, String url) {
            this.text = text;
            this.url = url;
        }
    }

    // ═════════════════════════════════════════════════════════════════════
    // DOCX EXPORT
    // ═════════════════════════════════════════════════════════════════════

    public byte[] exportToDocx(Resume resume, String locale) throws IOException {
        try (XWPFDocument document = new XWPFDocument();
                ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {

            // Narrow margins: 1.27 cm = 720 twips (ATS standard)
            org.openxmlformats.schemas.wordprocessingml.x2006.main.CTBody body = document.getDocument().getBody();
            org.openxmlformats.schemas.wordprocessingml.x2006.main.CTSectPr sectPr =
                    body.isSetSectPr() ? body.getSectPr() : body.addNewSectPr();
            org.openxmlformats.schemas.wordprocessingml.x2006.main.CTPageMar pageMar =
                    sectPr.isSetPgMar() ? sectPr.getPgMar() : sectPr.addNewPgMar();
            pageMar.setTop(java.math.BigInteger.valueOf(720));
            pageMar.setBottom(java.math.BigInteger.valueOf(720));
            pageMar.setLeft(java.math.BigInteger.valueOf(720));
            pageMar.setRight(java.math.BigInteger.valueOf(720));

            // Header - Name centered
            if (resume.getPersonalInfo() != null && resume.getPersonalInfo().getFullName() != null) {
                XWPFParagraph namePara = document.createParagraph();
                namePara.setAlignment(ParagraphAlignment.CENTER);
                namePara.setSpacingAfter(60); // 3pt = 60 twips
                XWPFRun nameRun = namePara.createRun();
                nameRun.setBold(true);
                nameRun.setFontSize(16);
                nameRun.setFontFamily("Times New Roman");
                nameRun.setText(resume.getPersonalInfo().getFullName());
            }

            // Location on its own line between name and contacts
            if (resume.getPersonalInfo() != null
                    && resume.getPersonalInfo().getLocation() != null
                    && !resume.getPersonalInfo().getLocation().isEmpty()) {
                XWPFParagraph locPara = document.createParagraph();
                locPara.setAlignment(ParagraphAlignment.CENTER);
                locPara.setSpacingBefore(0);
                locPara.setSpacingAfter(40);
                XWPFRun locRun = locPara.createRun();
                locRun.setItalic(true);
                locRun.setFontSize(11);
                locRun.setFontFamily("Times New Roman");
                locRun.setText(resume.getPersonalInfo().getLocation());
            }

            // Contact Info centered with clickable links
            if (resume.getPersonalInfo() != null) {
                XWPFParagraph contactPara = document.createParagraph();
                contactPara.setAlignment(ParagraphAlignment.CENTER);
                contactPara.setSpacingBefore(0);
                contactPara.setSpacingAfter(240); // 12pt = 240 twips

                Resume.PersonalInfo info = resume.getPersonalInfo();
                boolean first = true;

                // Phone with WhatsApp link
                if (info.getPhone() != null && !info.getPhone().isEmpty()) {
                    if (!first)
                        addDocxSeparator(contactPara);
                    String whatsappNumber = formatWhatsAppNumber(info.getPhone());
                    addDocxLink(contactPara, info.getPhone(), "https://wa.me/" + whatsappNumber);
                    first = false;
                }

                // Email with mailto link
                if (info.getEmail() != null && !info.getEmail().isEmpty()) {
                    if (!first)
                        addDocxSeparator(contactPara);
                    addDocxLink(contactPara, info.getEmail(), "mailto:" + info.getEmail());
                    first = false;
                }

                // LinkedIn
                if (info.getLinkedin() != null && !info.getLinkedin().isEmpty()) {
                    if (!first)
                        addDocxSeparator(contactPara);
                    String displayLinkedin = info.getLinkedin().replace("https://", "").replace("http://", "")
                            .replace("www.", "");
                    String fullUrl = info.getLinkedin().startsWith("http") ? info.getLinkedin()
                            : "https://" + info.getLinkedin();
                    addDocxLink(contactPara, displayLinkedin, fullUrl);
                    first = false;
                }

                // GitHub
                if (info.getGithub() != null && !info.getGithub().isEmpty()) {
                    if (!first)
                        addDocxSeparator(contactPara);
                    String displayGithub = info.getGithub().replace("https://", "").replace("http://", "")
                            .replace("www.", "");
                    String fullUrl = info.getGithub().startsWith("http") ? info.getGithub()
                            : "https://" + info.getGithub();
                    addDocxLink(contactPara, displayGithub, fullUrl);
                    first = false;
                }

                // Website
                if (info.getWebsite() != null && !info.getWebsite().isEmpty()) {
                    if (!first)
                        addDocxSeparator(contactPara);
                    String displayWebsite = info.getWebsite().replace("https://", "").replace("http://", "")
                            .replace("www.", "");
                    String fullUrl = info.getWebsite().startsWith("http") ? info.getWebsite()
                            : "https://" + info.getWebsite();
                    addDocxLink(contactPara, displayWebsite, fullUrl);
                    first = false;
                }

            }

            // Summary
            if (resume.getSummary() != null && !resume.getSummary().isEmpty()) {
                addDocxSectionWithBorder(document, isPtBr(locale) ? "RESUMO" : "SUMMARY");
                XWPFParagraph summaryPara = document.createParagraph();
                summaryPara.setSpacingAfter(100);
                XWPFRun summaryRun = summaryPara.createRun();
                summaryRun.setFontSize(11);
                summaryRun.setFontFamily("Times New Roman");
                summaryRun.setText(resume.getSummary());
            }

            // Experience
            if (resume.getExperience() != null && !resume.getExperience().isEmpty()) {
                addDocxSectionWithBorder(document, isPtBr(locale) ? "EXPERIÊNCIA" : "EXPERIENCE");
                for (Resume.Experience exp : resume.getExperience()) {
                    // Company (Título 2): Bold + Uppercase + date range right-aligned
                    XWPFParagraph companyPara = document.createParagraph();
                    companyPara.setSpacingBefore(120); // 6pt = 120 twips
                    companyPara.setSpacingAfter(0);
                    XWPFRun companyRun = companyPara.createRun();
                    companyRun.setBold(true);
                    companyRun.setFontSize(11);
                    companyRun.setFontFamily("Times New Roman");
                    companyRun.setText(safeString(exp.getCompany()).toUpperCase());
                    companyRun.addTab();
                    companyRun.setText(formatDateRange(exp.getStartDate(), exp.getEndDate(), exp.isCurrent()));

                    // Job title (Título 3): Italic
                    XWPFParagraph titlePara = document.createParagraph();
                    titlePara.setSpacingAfter(50);
                    XWPFRun titleRun = titlePara.createRun();
                    titleRun.setItalic(true);
                    titleRun.setFontSize(11);
                    titleRun.setFontFamily("Times New Roman");
                    titleRun.setText(safeString(exp.getTitle()));

                    if (exp.getBullets() != null) {
                        for (String bullet : exp.getBullets()) {
                            if (bullet != null && !bullet.trim().isEmpty()) {
                                XWPFParagraph bulletPara = document.createParagraph();
                                bulletPara.setIndentationLeft(0);
                                bulletPara.setSpacingAfter(20);
                                XWPFRun bulletRun = bulletPara.createRun();
                                bulletRun.setFontSize(11);
                                bulletRun.setFontFamily("Times New Roman");
                                bulletRun.setText("\u2022 " + bullet.trim());
                            }
                        }
                    }
                }
            }

            // Projects
            if (resume.getProjects() != null && !resume.getProjects().isEmpty()) {
                addDocxSectionWithBorder(document, isPtBr(locale) ? "PROJETOS" : "PROJECTS");
                for (Resume.Project proj : resume.getProjects()) {
                    XWPFParagraph titlePara = document.createParagraph();
                    titlePara.setSpacingBefore(120); // 6pt = 120 twips
                    titlePara.setSpacingAfter(0);

                    XWPFRun titleRun = titlePara.createRun();
                    titleRun.setBold(true);
                    titleRun.setFontSize(11);
                    titleRun.setFontFamily("Times New Roman");
                    titleRun.setText(safeString(proj.getName()).toUpperCase());

                    // URL right-aligned on same line as name (tab-separated); date only if no URL
                    String projDocxUrl = proj.getUrl() != null ? proj.getUrl().trim() : null;
                    if (projDocxUrl != null && !projDocxUrl.isEmpty()) {
                        String fullUrl = projDocxUrl.startsWith("http") ? projDocxUrl : "https://" + projDocxUrl;
                        String displayUrl = projDocxUrl.replaceFirst("(?i)^https?://", "").replaceFirst("^www\\.", "");
                        titleRun.addTab();
                        addDocxLink(titlePara, displayUrl, fullUrl);
                    } else {
                        String dateRange = formatDateRange(proj.getStartDate(), proj.getEndDate(), false);
                        if (!dateRange.isEmpty()) {
                            titleRun.addTab();
                            titleRun.setText(dateRange);
                        }
                    }

                    if (proj.getTechnologies() != null && !proj.getTechnologies().isEmpty()) {
                        XWPFParagraph techPara = document.createParagraph();
                        techPara.setSpacingAfter(50);
                        XWPFRun techRun = techPara.createRun();
                        techRun.setItalic(true);
                        techRun.setFontSize(11);
                        techRun.setFontFamily("Times New Roman");
                        techRun.setText(String.join(", ", proj.getTechnologies()));
                    }

                    if (proj.getDescription() != null && !proj.getDescription().trim().isEmpty()) {
                        XWPFParagraph descPara = document.createParagraph();
                        descPara.setSpacingAfter(50);
                        XWPFRun descRun = descPara.createRun();
                        descRun.setFontSize(11);
                        descRun.setFontFamily("Times New Roman");
                        descRun.setText(proj.getDescription().trim());
                    }

                    if (proj.getBullets() != null) {
                        for (String bullet : proj.getBullets()) {
                            if (bullet != null && !bullet.trim().isEmpty()) {
                                XWPFParagraph bulletPara = document.createParagraph();
                                bulletPara.setIndentationLeft(0);
                                bulletPara.setSpacingAfter(20);
                                XWPFRun bulletRun = bulletPara.createRun();
                                bulletRun.setFontSize(11);
                                bulletRun.setFontFamily("Times New Roman");
                                bulletRun.setText("\u2022 " + bullet.trim());
                            }
                        }
                    }
                }
            }

            // Education
            if (resume.getEducation() != null && !resume.getEducation().isEmpty()) {
                addDocxSectionWithBorder(document, isPtBr(locale) ? "FORMAÇÃO" : "EDUCATION");
                for (Resume.Education edu : resume.getEducation()) {
                    XWPFParagraph instPara = document.createParagraph();
                    instPara.setSpacingBefore(120); // 6pt = 120 twips
                    instPara.setSpacingAfter(0);
                    XWPFRun instRun = instPara.createRun();
                    instRun.setBold(true);
                    instRun.setFontSize(11);
                    instRun.setFontFamily("Times New Roman");
                    instRun.setText(safeString(edu.getInstitution()).toUpperCase());

                    if (edu.getLocation() != null) {
                        instRun.addTab();
                        instRun.setText(edu.getLocation());
                    }

                    XWPFParagraph degreePara = document.createParagraph();
                    degreePara.setSpacingAfter(100);
                    XWPFRun degreeRun = degreePara.createRun();
                    degreeRun.setItalic(true);
                    degreeRun.setFontSize(11);
                    degreeRun.setFontFamily("Times New Roman");
                    degreeRun.setText(safeString(edu.getDegree()));

                    String eduDocxStart = formatMonthYear(edu.getStartDate());
                    String eduDocxGrad = formatMonthYear(edu.getGraduationDate());
                    String eduDocxDateRange = (!eduDocxStart.isEmpty() && !eduDocxGrad.isEmpty())
                            ? eduDocxStart + " \u2014 " + eduDocxGrad : eduDocxGrad;
                    if (!eduDocxDateRange.isEmpty()) {
                        degreeRun.addTab();
                        degreeRun.setText(eduDocxDateRange);
                    }

                    // GPA (if set)
                    if (edu.getGpa() != null && !edu.getGpa().isBlank()) {
                        XWPFParagraph gpaPara = document.createParagraph();
                        gpaPara.setSpacingAfter(100);
                        XWPFRun gpaRun = gpaPara.createRun();
                        gpaRun.setFontSize(11);
                        gpaRun.setFontFamily("Times New Roman");
                        String gpaLabel = isPtBr(locale) ? "CRA: " : "GPA: ";
                        gpaRun.setText(gpaLabel + edu.getGpa());
                    }
                }
            }

            // Skills
            boolean docxHasGroups = resume.getSkillGroups() != null && !resume.getSkillGroups().isEmpty();
            boolean docxHasSkills = resume.getSkills() != null && !resume.getSkills().isEmpty();
            if (docxHasGroups || docxHasSkills) {
                addDocxSectionWithBorder(document, isPtBr(locale) ? "COMPETÊNCIAS" : "TECHNICAL SKILLS");
                if (docxHasGroups) {
                    for (Resume.SkillGroup group : resume.getSkillGroups()) {
                        if (group.getCategory() == null || group.getItems() == null || group.getItems().isEmpty())
                            continue;
                        XWPFParagraph grpPara = document.createParagraph();
                        grpPara.setSpacingAfter(20);
                        XWPFRun labelRun = grpPara.createRun();
                        labelRun.setBold(true);
                        labelRun.setFontSize(11);
                        labelRun.setFontFamily("Times New Roman");
                        labelRun.setText(group.getCategory() + ": ");
                        XWPFRun itemsRun = grpPara.createRun();
                        itemsRun.setFontSize(11);
                        itemsRun.setFontFamily("Times New Roman");
                        itemsRun.setText(String.join(", ", group.getItems()));
                    }
                } else {
                    XWPFParagraph skillsPara = document.createParagraph();
                    XWPFRun skillsRun = skillsPara.createRun();
                    skillsRun.setFontSize(11);
                    skillsRun.setFontFamily("Times New Roman");
                    skillsRun.setText(String.join(", ", resume.getSkills()));
                }
            }

            // Certifications
            if (resume.getCertifications() != null && !resume.getCertifications().isEmpty()) {
                addDocxSectionWithBorder(document, isPtBr(locale) ? "CERTIFICAÇÕES" : "COURSES / CERTIFICATIONS");
                for (Resume.Certification cert : resume.getCertifications()) {
                    XWPFParagraph certPara = document.createParagraph();
                    certPara.setIndentationLeft(360);
                    XWPFRun certRun = certPara.createRun();
                    certRun.setFontSize(11);
                    certRun.setFontFamily("Times New Roman");

                    StringBuilder certText = new StringBuilder("\u2022 " + safeString(cert.getName()));
                    if (cert.getIssuer() != null && !cert.getIssuer().isEmpty()) {
                        certText.append(" - ").append(cert.getIssuer());
                    }
                    if (cert.getDate() != null && !cert.getDate().isEmpty()) {
                        certText.append(" (").append(cert.getDate()).append(")");
                    }
                    certRun.setText(certText.toString());

                    // URL right-aligned on same line via tab
                    String certDocxUrl = cert.getUrl() != null ? cert.getUrl().trim() : null;
                    if (certDocxUrl != null && !certDocxUrl.isEmpty()) {
                        String fullUrl = certDocxUrl.startsWith("http") ? certDocxUrl : "https://" + certDocxUrl;
                        String displayUrl = certDocxUrl.replaceFirst("(?i)^https?://", "").replaceFirst("^www\\.", "");
                        certRun.addTab();
                        addDocxLink(certPara, displayUrl, fullUrl);
                    }
                }
            }

            // Languages
            if (resume.getLanguages() != null && !resume.getLanguages().isEmpty()) {
                addDocxSectionWithBorder(document, isPtBr(locale) ? "IDIOMAS" : "LANGUAGES");
                XWPFParagraph langPara = document.createParagraph();
                XWPFRun langRun = langPara.createRun();
                langRun.setFontSize(11);
                langRun.setFontFamily("Times New Roman");

                List<String> langStrings = new ArrayList<>();
                for (Resume.Language lang : resume.getLanguages()) {
                    String langStr = safeString(lang.getName());
                    if (lang.getLevel() != null && !lang.getLevel().isEmpty()) {
                        langStr += " \u2014 " + translateLevel(lang.getLevel(), "pt-BR");
                    }
                    langStrings.add("\u2022 " + langStr);
                }
                langRun.setText(String.join("   ", langStrings));
            }

            document.write(outputStream);
            return outputStream.toByteArray();
        }
    }

    private void addDocxSectionWithBorder(XWPFDocument document, String title) {
        XWPFParagraph sectionPara = document.createParagraph();
        sectionPara.setSpacingBefore(240); // 12pt = 240 twips
        sectionPara.setSpacingAfter(60);
        sectionPara.setBorderBottom(Borders.SINGLE);

        XWPFRun sectionRun = sectionPara.createRun();
        sectionRun.setBold(true);
        sectionRun.setFontSize(12);
        sectionRun.setFontFamily("Times New Roman");
        sectionRun.setText(title);
    }

    /**
     * Adds a clickable hyperlink to a DOCX paragraph.
     */
    private void addDocxLink(XWPFParagraph paragraph, String text, String url) {
        String rId = paragraph.getDocument().getPackagePart()
                .addExternalRelationship(url, XWPFRelation.HYPERLINK.getRelation()).getId();

        org.openxmlformats.schemas.wordprocessingml.x2006.main.CTHyperlink ctHyperlink = paragraph.getCTP()
                .addNewHyperlink();
        ctHyperlink.setId(rId);

        org.openxmlformats.schemas.wordprocessingml.x2006.main.CTR ctr = ctHyperlink.addNewR();
        org.openxmlformats.schemas.wordprocessingml.x2006.main.CTRPr rPr = ctr.addNewRPr();

        // Style: underline and blue color
        org.openxmlformats.schemas.wordprocessingml.x2006.main.CTUnderline u = rPr.addNewU();
        u.setVal(org.openxmlformats.schemas.wordprocessingml.x2006.main.STUnderline.SINGLE);

        org.openxmlformats.schemas.wordprocessingml.x2006.main.CTColor color = rPr.addNewColor();
        color.setVal("0000FF");

        // Font
        org.openxmlformats.schemas.wordprocessingml.x2006.main.CTFonts fonts = rPr.addNewRFonts();
        fonts.setAscii("Times New Roman");
        fonts.setHAnsi("Times New Roman");

        org.openxmlformats.schemas.wordprocessingml.x2006.main.CTHpsMeasure sz = rPr.addNewSz();
        sz.setVal(java.math.BigInteger.valueOf(20)); // 10pt = 20 half-points

        // Text
        org.openxmlformats.schemas.wordprocessingml.x2006.main.CTText ctText = ctr.addNewT();
        ctText.setStringValue(text);
    }

    /**
     * Adds a separator " | " to a DOCX paragraph.
     */
    private void addDocxSeparator(XWPFParagraph paragraph) {
        XWPFRun separatorRun = paragraph.createRun();
        separatorRun.setFontSize(10);
        separatorRun.setFontFamily("Times New Roman");
        separatorRun.setText(" | ");
    }
}
