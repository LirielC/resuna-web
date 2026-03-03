package com.resuna.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;

@Component
public class FileValidator {

    private static final Logger logger = LoggerFactory.getLogger(FileValidator.class);

    // PDF magic bytes: %PDF
    private static final byte[] PDF_MAGIC_BYTES = {0x25, 0x50, 0x44, 0x46};

    // Limites
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    private static final long MIN_FILE_SIZE = 100; // 100 bytes

    /**
     * Valida se o arquivo é um PDF legítimo
     */
    public void validatePdfFile(MultipartFile file) throws IllegalArgumentException {
        if (file == null || file.isEmpty()) {
            logger.warn("🚨 [SECURITY] Upload rejected: file is null or empty");
            throw new IllegalArgumentException("File is required");
        }

        // 1. Validar tamanho
        long size = file.getSize();
        if (size > MAX_FILE_SIZE) {
            logger.warn("🚨 [SECURITY] Upload rejected: file too large ({}MB)", size / 1024 / 1024);
            throw new IllegalArgumentException("File too large. Maximum size is 10MB");
        }

        if (size < MIN_FILE_SIZE) {
            logger.warn("🚨 [SECURITY] Upload rejected: file too small ({}B)", size);
            throw new IllegalArgumentException("File too small. Minimum size is 100 bytes");
        }

        // 2. Validar nome do arquivo
        String filename = file.getOriginalFilename();
        if (filename == null || !filename.toLowerCase().endsWith(".pdf")) {
            logger.warn("🚨 [SECURITY] Upload rejected: invalid filename '{}'", filename);
            throw new IllegalArgumentException("Only PDF files are allowed");
        }

        // 3. Validar content-type (pode ser burlado)
        String contentType = file.getContentType();
        if (contentType == null || !contentType.equals("application/pdf")) {
            logger.warn("🚨 [SECURITY] Upload rejected: invalid content-type '{}'", contentType);
            throw new IllegalArgumentException("Invalid file type. Only PDF files are allowed");
        }

        // 4. Validar MAGIC BYTES (assinatura real do arquivo - não pode ser burlada)
        try (InputStream is = file.getInputStream()) {
            byte[] header = new byte[PDF_MAGIC_BYTES.length];
            int bytesRead = is.read(header);

            if (bytesRead < PDF_MAGIC_BYTES.length) {
                logger.warn("🚨 [SECURITY] Upload rejected: file too short to read header");
                throw new IllegalArgumentException("Invalid PDF file");
            }

            // Comparar magic bytes
            for (int i = 0; i < PDF_MAGIC_BYTES.length; i++) {
                if (header[i] != PDF_MAGIC_BYTES[i]) {
                    logger.warn("🚨 [SECURITY] Upload rejected: invalid PDF magic bytes. " +
                                "Expected %PDF, got: {}", new String(header));
                    throw new IllegalArgumentException("File is not a valid PDF");
                }
            }

            logger.info("✅ File validated: {} ({}KB)", filename, size / 1024);

        } catch (IOException e) {
            logger.error("❌ [SECURITY] Error reading file: {}", e.getMessage());
            throw new IllegalArgumentException("Error reading file: " + e.getMessage());
        }
    }

    /**
     * Sanitiza nome do arquivo para evitar path traversal
     */
    public String sanitizeFilename(String filename) {
        if (filename == null) {
            return "unnamed.pdf";
        }

        // Remove caracteres perigosos
        String safe = filename.replaceAll("[^a-zA-Z0-9._-]", "_");

        // Remove path traversal
        safe = safe.replaceAll("\\.\\.", "");

        // Limite de tamanho
        if (safe.length() > 100) {
            safe = safe.substring(0, 100);
        }

        logger.debug("Filename sanitized: '{}' → '{}'", filename, safe);
        return safe;
    }
}
