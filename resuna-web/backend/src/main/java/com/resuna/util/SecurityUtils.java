package com.resuna.util;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

/**
 * Security utilities for IP detection and validation.
 * Prevents IP spoofing attacks via X-Forwarded-For header manipulation.
 */
@Component
public class SecurityUtils {

    @Value("${security.trust-cloudflare-ip:false}")
    private boolean trustCloudflareIp;

    // Trusted proxy IPs (configure based on your infrastructure)
    // For Cloudflare, AWS ELB, etc.
    private static final List<String> TRUSTED_PROXY_IPS = Arrays.asList(
        "127.0.0.1",
        "::1"
        // Add your reverse proxy IPs here
        // For Cloudflare: Use CF-Connecting-IP header instead
        // For AWS: Trust X-Forwarded-For only from ELB IPs
    );

    /**
     * Get client IP address securely.
     *
     * SECURITY NOTES:
     * - X-Forwarded-For can be spoofed by attackers
     * - Only trust it if request comes from known proxy
     * - Prefer CF-Connecting-IP (Cloudflare) or X-Real-IP (nginx)
     * - Default to direct connection IP for maximum security
     *
     * @param request HTTP request
     * @return Client IP address
     */
    public String getSecureClientIp(HttpServletRequest request) {
        String remoteAddr = request.getRemoteAddr();

        // Only trust CF-Connecting-IP if the immediate connection comes from a private/trusted proxy
        // (e.g. Cloud Run internal load balancer). Prevents IP spoofing when the backend is
        // accidentally exposed directly to the internet with trustCloudflareIp=true.
        if (trustCloudflareIp && (isPrivateIp(remoteAddr) || isTrustedProxy(remoteAddr))) {
            String cfIp = request.getHeader("CF-Connecting-IP");
            if (cfIp != null && !cfIp.isBlank()) {
                return sanitizeIp(cfIp);
            }
        }

        // If behind nginx/similar, use X-Real-IP (only if from trusted proxy)
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank() && isTrustedProxy(remoteAddr)) {
            return sanitizeIp(realIp);
        }

        // Only trust X-Forwarded-For if request comes from trusted proxy
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank() && isTrustedProxy(remoteAddr)) {
            // Take first IP (original client)
            String firstIp = forwardedFor.split(",")[0].trim();
            return sanitizeIp(firstIp);
        }

        // Default: use direct connection IP (most secure)
        return sanitizeIp(remoteAddr);
    }

    /**
     * Check if IP is from a trusted proxy.
     */
    private boolean isTrustedProxy(String ip) {
        return TRUSTED_PROXY_IPS.contains(ip);
    }

    /**
     * Returns true if the IP is a private/loopback address (RFC 1918 + loopback + link-local).
     * Used to guard CF-Connecting-IP: only honour the header when the immediate connection
     * originates from an internal load balancer, never from a public internet address.
     */
    private boolean isPrivateIp(String ip) {
        if (ip == null || ip.isBlank()) return false;
        // Loopback
        if (ip.equals("127.0.0.1") || ip.equals("::1") || ip.startsWith("127.")) return true;
        // RFC 1918: 10.0.0.0/8
        if (ip.startsWith("10.")) return true;
        // RFC 1918: 172.16.0.0/12  (172.16.x.x – 172.31.x.x)
        if (ip.startsWith("172.")) {
            try {
                int second = Integer.parseInt(ip.split("\\.")[1]);
                if (second >= 16 && second <= 31) return true;
            } catch (NumberFormatException | ArrayIndexOutOfBoundsException ignored) { }
        }
        // RFC 1918: 192.168.0.0/16
        if (ip.startsWith("192.168.")) return true;
        // Link-local: 169.254.0.0/16
        if (ip.startsWith("169.254.")) return true;
        // IPv6 private / link-local (fc00::/7, fe80::/10)
        String lower = ip.toLowerCase();
        if (lower.startsWith("fc") || lower.startsWith("fd") || lower.startsWith("fe80")) return true;
        return false;
    }

    /**
     * Sanitize IP address to prevent injection.
     *
     * @param ip Raw IP address
     * @return Sanitized IP
     */
    private String sanitizeIp(String ip) {
        if (ip == null) {
            return "unknown";
        }

        // Remove any non-IP characters
        String sanitized = ip.replaceAll("[^0-9.:]", "");

        // Validate format (basic check)
        if (!isValidIpFormat(sanitized)) {
            return "invalid";
        }

        return sanitized;
    }

    /**
     * Validate IP address format (IPv4 or IPv6).
     * Uses simple octet/group parsing instead of complex regex to avoid ReDoS.
     *
     * @param ip IP address
     * @return true if valid format
     */
    private boolean isValidIpFormat(String ip) {
        if (ip == null || ip.isBlank()) return false;

        // IPv4: exactly 4 decimal octets 0–255, no trailing content
        String[] ipv4Parts = ip.split("\\.", -1);
        if (ipv4Parts.length == 4) {
            for (String part : ipv4Parts) {
                if (part.isEmpty() || part.length() > 3) return false;
                for (char c : part.toCharArray()) {
                    if (c < '0' || c > '9') return false;
                }
                int val = Integer.parseInt(part);
                if (val < 0 || val > 255) return false;
            }
            return true;
        }

        // IPv6: contains colons, only hex digits and colons, reasonable length
        if (ip.contains(":") && ip.length() <= 39) {
            for (char c : ip.toCharArray()) {
                if (!Character.isDigit(c) && (c < 'a' || c > 'f') && (c < 'A' || c > 'F') && c != ':') {
                    return false;
                }
            }
            return true;
        }

        return false;
    }

    /**
     * Get client fingerprint securely.
     *
     * SECURITY NOTES:
     * - Client-provided fingerprints can be spoofed
     * - Use this only as ONE factor, not sole identifier
     * - Combine with IP, user agent, and other factors
     * - Consider server-side fingerprinting for better security
     *
     * @param request HTTP request
     * @return Client fingerprint (nullable)
     */
    public String getClientFingerprint(HttpServletRequest request) {
        String fingerprint = request.getHeader("X-Client-Fingerprint");

        if (fingerprint == null || fingerprint.isBlank()) {
            return null;
        }

        // Validate fingerprint format (should be base64 or hex)
        if (!fingerprint.matches("^[A-Za-z0-9+/=_-]{32,128}$")) {
            return null; // Invalid fingerprint
        }

        return fingerprint;
    }

    /**
     * Generate server-side composite identifier for abuse prevention.
     * Combines multiple factors to make spoofing harder.
     *
     * @param request HTTP request
     * @return Composite identifier
     */
    public String getCompositeIdentifier(HttpServletRequest request) {
        StringBuilder composite = new StringBuilder();

        // IP address
        composite.append(getSecureClientIp(request));
        composite.append("|");

        // User agent (can be spoofed but adds friction)
        String userAgent = request.getHeader("User-Agent");
        if (userAgent != null) {
            // Hash to reduce size
            composite.append(Integer.toHexString(userAgent.hashCode()));
        }
        composite.append("|");

        // Accept-Language (adds another dimension)
        String acceptLanguage = request.getHeader("Accept-Language");
        if (acceptLanguage != null) {
            composite.append(Integer.toHexString(acceptLanguage.hashCode()));
        }

        return composite.toString();
    }

    /**
     * Check if request shows signs of automation/bot.
     *
     * @param request HTTP request
     * @return true if likely a bot
     */
    public boolean isLikelyBot(HttpServletRequest request) {
        String userAgent = request.getHeader("User-Agent");

        if (userAgent == null || userAgent.isBlank()) {
            return true; // No user agent = likely bot
        }

        // Common bot indicators
        String lowerUA = userAgent.toLowerCase();
        String[] botPatterns = {
            "bot", "crawler", "spider", "scraper"
        };

        for (String pattern : botPatterns) {
            if (lowerUA.contains(pattern)) {
                return true;
            }
        }

        return false;
    }
}
