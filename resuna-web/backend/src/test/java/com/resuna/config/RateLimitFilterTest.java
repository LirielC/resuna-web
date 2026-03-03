package com.resuna.config;

import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Tests for RateLimitFilter.
 * Covers: userId-based keying (#3), rate limiting logic, eviction (#6),
 * disabled mode, non-API bypass, and bucket resolution.
 */
class RateLimitFilterTest {

    private RateLimitFilter filter;
    private FilterChain chain;

    @BeforeEach
    void setUp() {
        RateLimitConfig config = mock(RateLimitConfig.class);
        when(config.isEnabled()).thenReturn(true);
        when(config.getGeneralMaxRequests()).thenReturn(3);
        when(config.getGeneralWindowSeconds()).thenReturn(60);
        when(config.getAiMaxRequests()).thenReturn(2);
        when(config.getAiWindowSeconds()).thenReturn(60);
        when(config.getAtsMaxRequests()).thenReturn(2);
        when(config.getAtsWindowSeconds()).thenReturn(60);

        filter = new RateLimitFilter(config);
        chain = mock(FilterChain.class);
    }

    // ── userId‑based keying ───────────────────────────────────────────────

    @Test
    @DisplayName("Authenticated user rate‑limited by userId, not IP")
    void authenticatedUser_usesUserId() throws Exception {
        for (int i = 0; i < 3; i++) {
            MockHttpServletRequest req = apiRequest("/api/resumes");
            req.setAttribute("userId", "user-123");
            req.setRemoteAddr("1.1.1." + i); // different IPs
            MockHttpServletResponse res = new MockHttpServletResponse();
            filter.doFilter(req, res, chain);
            assertEquals(200, res.getStatus(), "Request " + (i + 1) + " should pass");
        }

        // 4th request from same userId → should be blocked
        MockHttpServletRequest req = apiRequest("/api/resumes");
        req.setAttribute("userId", "user-123");
        req.setRemoteAddr("9.9.9.9");
        MockHttpServletResponse res = new MockHttpServletResponse();
        filter.doFilter(req, res, chain);
        assertEquals(429, res.getStatus(), "4th request should be rate-limited");
    }

    @Test
    @DisplayName("Different users have independent limits")
    void differentUsers_independentLimits() throws Exception {
        for (int i = 0; i < 3; i++) {
            MockHttpServletRequest req = apiRequest("/api/resumes");
            req.setAttribute("userId", "user-A");
            filter.doFilter(req, new MockHttpServletResponse(), chain);
        }

        // user-B should still be allowed
        MockHttpServletRequest req = apiRequest("/api/resumes");
        req.setAttribute("userId", "user-B");
        MockHttpServletResponse res = new MockHttpServletResponse();
        filter.doFilter(req, res, chain);
        assertEquals(200, res.getStatus(), "Different user should not be affected");
    }

    @Test
    @DisplayName("Unauthenticated request falls back to remoteAddr, ignores X-Forwarded-For")
    void unauthenticated_ignoresXForwardedFor() throws Exception {
        for (int i = 0; i < 3; i++) {
            MockHttpServletRequest req = apiRequest("/api/resumes");
            // No userId attribute set
            req.addHeader("X-Forwarded-For", "spoofed-" + i); // different spoofed IPs each time
            req.setRemoteAddr("10.0.0.1"); // same real IP
            filter.doFilter(req, new MockHttpServletResponse(), chain);
        }

        // 4th request — same remoteAddr — should be blocked regardless of
        // X-Forwarded-For
        MockHttpServletRequest req = apiRequest("/api/resumes");
        req.addHeader("X-Forwarded-For", "spoofed-new");
        req.setRemoteAddr("10.0.0.1");
        MockHttpServletResponse res = new MockHttpServletResponse();
        filter.doFilter(req, res, chain);
        assertEquals(429, res.getStatus(), "Should rate-limit by remoteAddr, not X-Forwarded-For");
    }

    // ── Rate limiting logic ──────────────────────────────────────────────

    @Test
    @DisplayName("Requests within limit pass through")
    void withinLimit_passesThrough() throws Exception {
        MockHttpServletRequest req = apiRequest("/api/resumes");
        req.setAttribute("userId", "user-ok");
        MockHttpServletResponse res = new MockHttpServletResponse();
        filter.doFilter(req, res, chain);

        assertEquals(200, res.getStatus());
        verify(chain, times(1)).doFilter(req, res);
    }

    @Test
    @DisplayName("Rate-limited response returns 429 with JSON body")
    void overLimit_returns429WithJsonBody() throws Exception {
        for (int i = 0; i < 3; i++) {
            MockHttpServletRequest req = apiRequest("/api/resumes");
            req.setAttribute("userId", "user-flood");
            filter.doFilter(req, new MockHttpServletResponse(), chain);
        }

        MockHttpServletRequest req = apiRequest("/api/resumes");
        req.setAttribute("userId", "user-flood");
        MockHttpServletResponse res = new MockHttpServletResponse();
        filter.doFilter(req, res, chain);

        assertEquals(429, res.getStatus());
        assertEquals("application/json", res.getContentType());
        assertTrue(res.getContentAsString().contains("Too Many Requests"));
    }

    // ── Bucket resolution ────────────────────────────────────────────────

    @Test
    @DisplayName("AI endpoints use separate rate-limit bucket")
    void aiEndpoint_usesSeparateBucket() throws Exception {
        // Exhaust AI bucket (max 2)
        for (int i = 0; i < 2; i++) {
            MockHttpServletRequest req = apiRequest("/api/ai/refine");
            req.setAttribute("userId", "user-multi");
            filter.doFilter(req, new MockHttpServletResponse(), chain);
        }

        // AI should be blocked
        MockHttpServletRequest aiReq = apiRequest("/api/ai/refine");
        aiReq.setAttribute("userId", "user-multi");
        MockHttpServletResponse aiRes = new MockHttpServletResponse();
        filter.doFilter(aiReq, aiRes, chain);
        assertEquals(429, aiRes.getStatus(), "AI bucket should be exhausted");

        // General endpoint should still work (different bucket)
        MockHttpServletRequest genReq = apiRequest("/api/resumes");
        genReq.setAttribute("userId", "user-multi");
        MockHttpServletResponse genRes = new MockHttpServletResponse();
        filter.doFilter(genReq, genRes, chain);
        assertEquals(200, genRes.getStatus(), "General bucket should be independent");
    }

    // ── Bypass scenarios ─────────────────────────────────────────────────

    @Test
    @DisplayName("Non-API paths bypass rate limiting")
    void nonApiPath_bypasses() throws Exception {
        MockHttpServletRequest req = new MockHttpServletRequest("GET", "/index.html");
        MockHttpServletResponse res = new MockHttpServletResponse();
        filter.doFilter(req, res, chain);

        verify(chain).doFilter(req, res);
        assertEquals(200, res.getStatus());
    }

    @Test
    @DisplayName("Disabled filter bypasses all requests")
    void disabledFilter_bypasses() throws Exception {
        RateLimitConfig disabledConfig = mock(RateLimitConfig.class);
        when(disabledConfig.isEnabled()).thenReturn(false);
        RateLimitFilter disabledFilter = new RateLimitFilter(disabledConfig);

        MockHttpServletRequest req = apiRequest("/api/resumes");
        MockHttpServletResponse res = new MockHttpServletResponse();
        disabledFilter.doFilter(req, res, chain);

        verify(chain).doFilter(req, res);
    }

    // ── Eviction ──────────────────────────────────────────────────────────

    @Test
    @DisplayName("evictStaleEntries runs without exception on empty counters")
    void evictStaleEntries_emptyCounters_noException() {
        assertDoesNotThrow(() -> filter.evictStaleEntries());
    }

    @Test
    @DisplayName("evictStaleEntries runs without exception after requests")
    void evictStaleEntries_afterRequests_noException() throws Exception {
        MockHttpServletRequest req = apiRequest("/api/resumes");
        req.setAttribute("userId", "user-evict");
        filter.doFilter(req, new MockHttpServletResponse(), chain);

        assertDoesNotThrow(() -> filter.evictStaleEntries());
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private MockHttpServletRequest apiRequest(String path) {
        MockHttpServletRequest req = new MockHttpServletRequest("GET", path);
        req.setRemoteAddr("127.0.0.1");
        return req;
    }
}
