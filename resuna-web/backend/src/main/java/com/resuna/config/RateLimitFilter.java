package com.resuna.config;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.annotation.Order;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@Order(2)
public class RateLimitFilter implements Filter {

    private static final Logger logger = LoggerFactory.getLogger(RateLimitFilter.class);

    private static final String API_PREFIX = "/api/";
    private static final String AI_PREFIX = "/api/ai/";
    private static final String ATS_PREFIX = "/api/ats/";
    private static final String EXPORT_PREFIX = "/api/resumes/export/";
    private static final String IMPORT_PDF_PATH = "/api/resumes/import-pdf";
    private static final int STALE_ENTRY_TTL_SECONDS = 600;

    private final RateLimitConfig config;
    private final Map<String, WindowCounter> counters = new ConcurrentHashMap<>();

    public RateLimitFilter(RateLimitConfig config) {
        this.config = config;
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        if (!config.isEnabled()) {
            chain.doFilter(request, response);
            return;
        }

        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        String path = httpRequest.getRequestURI();
        if (!path.startsWith(API_PREFIX)) {
            chain.doFilter(request, response);
            return;
        }

        RateLimitRule rule = resolveRule(path);
        String clientKey = extractClientKey(httpRequest, rule.bucket);

        WindowCounter counter = counters.get(clientKey);
        if (!allowRequest(clientKey, rule)) {
            logger.warn("🚨 [RATE LIMIT] Blocked {} {} from {} (bucket: {})",
                httpRequest.getMethod(), path, clientKey, rule.bucket);

            httpResponse.setStatus(429);
            httpResponse.setContentType("application/json");

            // Adicionar headers informativos
            httpResponse.setHeader("X-RateLimit-Limit", String.valueOf(rule.maxRequests));
            httpResponse.setHeader("X-RateLimit-Window", rule.windowSeconds + "s");
            httpResponse.setHeader("Retry-After", String.valueOf(rule.windowSeconds));

            String errorMsg = String.format(
                "{\"error\":\"Too Many Requests\",\"message\":\"Limite de %d requisições por %ds excedido. Tente novamente em %ds.\",\"retryAfter\":%d}",
                rule.maxRequests, rule.windowSeconds, rule.windowSeconds, rule.windowSeconds
            );
            httpResponse.getWriter().write(errorMsg);
            return;
        }

        // Adicionar headers informativos em requisições bem-sucedidas
        if (counter != null) {
            synchronized (counter) {
                int remaining = Math.max(0, rule.maxRequests - counter.count);
                httpResponse.setHeader("X-RateLimit-Limit", String.valueOf(rule.maxRequests));
                httpResponse.setHeader("X-RateLimit-Remaining", String.valueOf(remaining));
                httpResponse.setHeader("X-RateLimit-Window", rule.windowSeconds + "s");
            }
        }

        chain.doFilter(request, response);
    }

    private RateLimitRule resolveRule(String path) {
        if (path.startsWith(AI_PREFIX)) {
            return new RateLimitRule("ai", config.getAiMaxRequests(), config.getAiWindowSeconds());
        }
        if (path.startsWith(ATS_PREFIX)) {
            return new RateLimitRule("ats", config.getAtsMaxRequests(), config.getAtsWindowSeconds());
        }
        if (path.startsWith(EXPORT_PREFIX) || path.equals(IMPORT_PDF_PATH)) {
            return new RateLimitRule("export", config.getExportMaxRequests(), config.getExportWindowSeconds());
        }
        return new RateLimitRule("general", config.getGeneralMaxRequests(), config.getGeneralWindowSeconds());
    }

    /**
     * Extracts a client key for rate limiting. Prefers authenticated userId
     * (set by AuthFilter) over IP address, since X-Forwarded-For can be spoofed.
     * Falls back to remote address only for unauthenticated requests.
     */
    private String extractClientKey(HttpServletRequest request, String bucket) {
        // Prefer userId from AuthFilter (not spoofable)
        Object userId = request.getAttribute("userId");
        if (userId != null) {
            return bucket + ":user:" + userId;
        }
        // Fallback to remote address only (ignore X-Forwarded-For to prevent spoofing)
        return bucket + ":ip:" + request.getRemoteAddr();
    }

    private boolean allowRequest(String key, RateLimitRule rule) {
        long now = Instant.now().getEpochSecond();
        WindowCounter counter = counters.computeIfAbsent(key, k -> new WindowCounter(now, 0));
        synchronized (counter) {
            if (now - counter.windowStart >= rule.windowSeconds) {
                counter.windowStart = now;
                counter.count = 0;
            }
            counter.count++;

            // Alerta quando chegar em 80% do limite
            if (counter.count == (int)(rule.maxRequests * 0.8)) {
                logger.info("⚠️  [RATE LIMIT] Client {} at 80% capacity ({}/{})",
                    key, counter.count, rule.maxRequests);
            }

            if (counter.count > rule.maxRequests) {
                logger.warn("🚨 [RATE LIMIT] Client {} exceeded limit ({}/{})",
                    key, counter.count, rule.maxRequests);
                return false;
            }
        }
        return true;
    }

    /**
     * Periodically evict stale entries from the counters map to prevent memory
     * leaks.
     * Runs every 5 minutes.
     */
    @Scheduled(fixedRate = 300_000)
    void evictStaleEntries() {
        long now = Instant.now().getEpochSecond();
        int before = counters.size();
        counters.entrySet().removeIf(entry -> {
            synchronized (entry.getValue()) {
                return now - entry.getValue().windowStart > STALE_ENTRY_TTL_SECONDS;
            }
        });
        int removed = before - counters.size();
        if (removed > 0) {
            logger.debug("Evicted {} stale rate-limit entries, {} remaining", removed, counters.size());
        }
    }

    private static class WindowCounter {
        private long windowStart;
        private int count;

        private WindowCounter(long windowStart, int count) {
            this.windowStart = windowStart;
            this.count = count;
        }
    }

    private record RateLimitRule(String bucket, int maxRequests, int windowSeconds) {
    }
}
