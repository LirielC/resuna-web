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
 * Tests for SecurityHeadersFilter.
 * Verifies all security response headers are correctly set.
 */
class SecurityHeadersFilterTest {

    private SecurityHeadersFilter filter;
    private FilterChain chain;

    @BeforeEach
    void setUp() {
        filter = new SecurityHeadersFilter();
        chain = mock(FilterChain.class);
    }

    @Test
    @DisplayName("Sets X-Content-Type-Options: nosniff")
    void setsContentTypeOptions() throws Exception {
        MockHttpServletRequest req = new MockHttpServletRequest();
        MockHttpServletResponse res = new MockHttpServletResponse();

        filter.doFilterInternal(req, res, chain);

        assertEquals("nosniff", res.getHeader("X-Content-Type-Options"));
    }

    @Test
    @DisplayName("Sets X-Frame-Options: DENY")
    void setsFrameOptions() throws Exception {
        MockHttpServletRequest req = new MockHttpServletRequest();
        MockHttpServletResponse res = new MockHttpServletResponse();

        filter.doFilterInternal(req, res, chain);

        assertEquals("DENY", res.getHeader("X-Frame-Options"));
    }

    @Test
    @DisplayName("Sets Referrer-Policy: same-origin")
    void setsReferrerPolicy() throws Exception {
        MockHttpServletRequest req = new MockHttpServletRequest();
        MockHttpServletResponse res = new MockHttpServletResponse();

        filter.doFilterInternal(req, res, chain);

        assertEquals("same-origin", res.getHeader("Referrer-Policy"));
    }

    @Test
    @DisplayName("Sets Permissions-Policy")
    void setsPermissionsPolicy() throws Exception {
        MockHttpServletRequest req = new MockHttpServletRequest();
        MockHttpServletResponse res = new MockHttpServletResponse();

        filter.doFilterInternal(req, res, chain);

        String policy = res.getHeader("Permissions-Policy");
        assertNotNull(policy);
        assertTrue(policy.contains("camera=()"));
        assertTrue(policy.contains("microphone=()"));
        assertTrue(policy.contains("geolocation=()"));
    }

    @Test
    @DisplayName("Sets Content-Security-Policy")
    void setsCSP() throws Exception {
        MockHttpServletRequest req = new MockHttpServletRequest();
        MockHttpServletResponse res = new MockHttpServletResponse();

        filter.doFilterInternal(req, res, chain);

        String csp = res.getHeader("Content-Security-Policy");
        assertNotNull(csp);
        assertTrue(csp.contains("default-src 'none'"));
        assertTrue(csp.contains("frame-ancestors 'none'"));
    }

    @Test
    @DisplayName("Sets HSTS only for secure (HTTPS) requests")
    void setsHSTS_onlyForSecure() throws Exception {
        // HTTP request — no HSTS
        MockHttpServletRequest httpReq = new MockHttpServletRequest();
        httpReq.setSecure(false);
        MockHttpServletResponse httpRes = new MockHttpServletResponse();
        filter.doFilterInternal(httpReq, httpRes, chain);
        assertNull(httpRes.getHeader("Strict-Transport-Security"),
                "HSTS should not be set for HTTP");

        // HTTPS request — HSTS should be set
        MockHttpServletRequest httpsReq = new MockHttpServletRequest();
        httpsReq.setSecure(true);
        MockHttpServletResponse httpsRes = new MockHttpServletResponse();
        filter.doFilterInternal(httpsReq, httpsRes, chain);
        String hsts = httpsRes.getHeader("Strict-Transport-Security");
        assertNotNull(hsts, "HSTS should be set for HTTPS");
        assertTrue(hsts.contains("max-age="));
        assertTrue(hsts.contains("includeSubDomains"));
    }

    @Test
    @DisplayName("Continues filter chain after setting headers")
    void continuesChain() throws Exception {
        MockHttpServletRequest req = new MockHttpServletRequest();
        MockHttpServletResponse res = new MockHttpServletResponse();

        filter.doFilterInternal(req, res, chain);

        verify(chain).doFilter(req, res);
    }
}
