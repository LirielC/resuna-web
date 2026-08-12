package com.resuna.service;

/** Small, side-effect-free helpers shared by PDF and DOCX exports. */
public final class ResumeExportLinkFormatter {

    private ResumeExportLinkFormatter() { }

    public static String whatsappNumber(String phone) {
        if (phone == null || phone.isEmpty()) return "";
        boolean hasPlus = phone.trim().startsWith("+");
        String digits = phone.replaceAll("[^0-9]", "");
        if (digits.isEmpty()) return "";
        if (hasPlus || (digits.startsWith("55") && digits.length() >= 12)) return digits;
        return "55" + digits;
    }

    public static String sanitizeUrl(String raw) {
        if (raw == null || raw.isBlank()) return null;
        String trimmed = raw.trim();
        if (trimmed.matches("(?i)^https?://.*")
                || trimmed.matches("(?i)^mailto:.*")
                || trimmed.matches("(?i)^tel:.*")) return trimmed;
        if (!trimmed.contains("://")) return "https://" + trimmed;
        return null;
    }
}
