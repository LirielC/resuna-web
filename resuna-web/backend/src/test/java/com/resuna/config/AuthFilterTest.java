package com.resuna.config;

import com.resuna.service.UserProfileService;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Tests for AuthFilter.
 * Covers: token validation, public routes, OPTIONS bypass, missing/invalid
 * tokens.
 */
class AuthFilterTest {

    private AuthFilter authFilter;
    private FilterChain chain;
    private UserProfileService userProfileService;

    @BeforeEach
    void setUp() {
        userProfileService = mock(UserProfileService.class);
        authFilter = new AuthFilter(userProfileService);
        chain = mock(FilterChain.class);
    }

    // ── OPTIONS preflight ────────────────────────────────────────────────

    @Test
    @DisplayName("OPTIONS requests bypass authentication")
    void optionsRequest_bypasses() throws Exception {
        MockHttpServletRequest req = new MockHttpServletRequest("OPTIONS", "/api/resumes");
        MockHttpServletResponse res = new MockHttpServletResponse();

        authFilter.doFilter(req, res, chain);

        verify(chain).doFilter(req, res);
        assertNotEquals(401, res.getStatus());
    }

    // ── Public routes ────────────────────────────────────────────────────

    @Test
    @DisplayName("Public route /api/auth bypasses authentication")
    void publicRoute_auth_bypasses() throws Exception {
        MockHttpServletRequest req = new MockHttpServletRequest("GET", "/api/auth/status");
        MockHttpServletResponse res = new MockHttpServletResponse();

        authFilter.doFilter(req, res, chain);

        verify(chain).doFilter(req, res);
    }

    @Test
    @DisplayName("Public route /api/health bypasses authentication")
    void publicRoute_health_bypasses() throws Exception {
        MockHttpServletRequest req = new MockHttpServletRequest("GET", "/api/health");
        MockHttpServletResponse res = new MockHttpServletResponse();

        authFilter.doFilter(req, res, chain);

        verify(chain).doFilter(req, res);
    }

    @Test
    @DisplayName("Public route /error bypasses authentication")
    void publicRoute_error_bypasses() throws Exception {
        MockHttpServletRequest req = new MockHttpServletRequest("GET", "/error");
        MockHttpServletResponse res = new MockHttpServletResponse();

        authFilter.doFilter(req, res, chain);

        verify(chain).doFilter(req, res);
    }

    // ── Missing token ────────────────────────────────────────────────────

    @Test
    @DisplayName("Missing Authorization header returns 401")
    void missingAuthHeader_returns401() throws Exception {
        MockHttpServletRequest req = new MockHttpServletRequest("GET", "/api/resumes");
        MockHttpServletResponse res = new MockHttpServletResponse();

        authFilter.doFilter(req, res, chain);

        assertEquals(401, res.getStatus());
        assertEquals("application/json", res.getContentType());
        assertTrue(res.getContentAsString().contains("Unauthorized"));
        verify(chain, never()).doFilter(any(), any());
    }

    @Test
    @DisplayName("Invalid Authorization header (not Bearer) returns 401")
    void invalidAuthScheme_returns401() throws Exception {
        MockHttpServletRequest req = new MockHttpServletRequest("GET", "/api/resumes");
        req.addHeader("Authorization", "Basic abc123");
        MockHttpServletResponse res = new MockHttpServletResponse();

        authFilter.doFilter(req, res, chain);

        assertEquals(401, res.getStatus());
        verify(chain, never()).doFilter(any(), any());
    }

    // Note: Testing with an actual Bearer token (empty or invalid) requires
    // Firebase SDK initialization. These tests must be done as integration tests
    // with a Firebase emulator. The existing tests above cover:
    // - Missing Authorization header → 401
    // - Non-Bearer auth scheme → 401
    // - Public routes bypass → 200
    // - OPTIONS preflight → bypass

    @Test
    @DisplayName("Non-public API route requires authentication")
    void protectedRoute_requiresAuth() throws Exception {
        MockHttpServletRequest req = new MockHttpServletRequest("POST", "/api/resumes");
        MockHttpServletResponse res = new MockHttpServletResponse();

        authFilter.doFilter(req, res, chain);

        assertEquals(401, res.getStatus());
    }

    @Test
    @DisplayName("Admin route requires authentication")
    void adminRoute_requiresAuth() throws Exception {
        MockHttpServletRequest req = new MockHttpServletRequest("GET", "/api/admin/users");
        MockHttpServletResponse res = new MockHttpServletResponse();

        authFilter.doFilter(req, res, chain);

        assertEquals(401, res.getStatus());
    }

    // ── Error response format ────────────────────────────────────────────

    @Test
    @DisplayName("401 error response contains structured JSON")
    void errorResponse_hasJson() throws Exception {
        MockHttpServletRequest req = new MockHttpServletRequest("GET", "/api/resumes");
        MockHttpServletResponse res = new MockHttpServletResponse();

        authFilter.doFilter(req, res, chain);

        String body = res.getContentAsString();
        assertTrue(body.contains("\"error\""), "Response should contain error field");
        assertTrue(body.contains("\"message\""), "Response should contain message field");
    }
}
