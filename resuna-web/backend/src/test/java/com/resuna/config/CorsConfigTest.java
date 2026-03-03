package com.resuna.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.lang.reflect.Field;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests for CorsConfig.
 * Verifies credentials, allowed headers (including x-client-fingerprint),
 * allowed origins, and methods.
 */
class CorsConfigTest {

    /**
     * Creates a CorsConfig with the given values using reflection,
     * since the fields are normally injected by Spring @Value.
     */
    private CorsConfig createConfig(String origins, String methods, String headers, boolean credentials)
            throws Exception {
        CorsConfig config = new CorsConfig();
        setField(config, "allowedOrigins", origins);
        setField(config, "allowedMethods", methods);
        setField(config, "allowedHeaders", headers);
        setField(config, "allowCredentials", credentials);
        return config;
    }

    private void setField(Object obj, String fieldName, Object value) throws Exception {
        Field field = obj.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(obj, value);
    }

    private CorsConfiguration extractCorsConfig(CorsFilter filter) throws Exception {
        Field sourceField = CorsFilter.class.getDeclaredField("configSource");
        sourceField.setAccessible(true);
        UrlBasedCorsConfigurationSource source = (UrlBasedCorsConfigurationSource) sourceField.get(filter);

        Field configsField = UrlBasedCorsConfigurationSource.class.getDeclaredField("corsConfigurations");
        configsField.setAccessible(true);
        @SuppressWarnings("unchecked")
        Map<?, CorsConfiguration> configs = (Map<?, CorsConfiguration>) configsField.get(source);

        assertFalse(configs.isEmpty(), "Should have CORS configuration registered");
        return configs.values().iterator().next();
    }

    @Test
    @DisplayName("CORS allows credentials (Fix #1)")
    void allowsCredentials() throws Exception {
        CorsConfig config = createConfig(
                "http://localhost:3000",
                "GET,POST,PUT,DELETE,OPTIONS",
                "Authorization,Content-Type,x-client-fingerprint",
                true);

        CorsFilter filter = config.corsFilter();
        CorsConfiguration corsConfig = extractCorsConfig(filter);

        assertTrue(corsConfig.getAllowCredentials(), "Credentials should be allowed");
    }

    @Test
    @DisplayName("CORS allows x-client-fingerprint header")
    void allowsClientFingerprintHeader() throws Exception {
        CorsConfig config = createConfig(
                "http://localhost:3000",
                "GET,POST",
                "Authorization,Content-Type,x-client-fingerprint",
                true);

        CorsFilter filter = config.corsFilter();
        CorsConfiguration corsConfig = extractCorsConfig(filter);

        assertTrue(corsConfig.getAllowedHeaders().contains("x-client-fingerprint"),
                "x-client-fingerprint should be in allowed headers");
    }

    @Test
    @DisplayName("CORS includes localhost origin")
    void includesLocalhostOrigin() throws Exception {
        CorsConfig config = createConfig(
                "http://localhost:3000",
                "GET,POST",
                "Authorization,Content-Type",
                true);

        CorsFilter filter = config.corsFilter();
        CorsConfiguration corsConfig = extractCorsConfig(filter);

        assertTrue(corsConfig.getAllowedOrigins().contains("http://localhost:3000"));
    }

    @Test
    @DisplayName("CORS allows all required HTTP methods")
    void allowsRequiredMethods() throws Exception {
        CorsConfig config = createConfig(
                "http://localhost:3000",
                "GET,POST,PUT,DELETE,OPTIONS",
                "Authorization,Content-Type",
                true);

        CorsFilter filter = config.corsFilter();
        CorsConfiguration corsConfig = extractCorsConfig(filter);

        assertTrue(corsConfig.getAllowedMethods().containsAll(
                java.util.List.of("GET", "POST", "PUT", "DELETE", "OPTIONS")));
    }

    @Test
    @DisplayName("CORS sets maxAge for preflight caching")
    void setsMaxAge() throws Exception {
        CorsConfig config = createConfig(
                "http://localhost:3000",
                "GET",
                "Authorization",
                true);

        CorsFilter filter = config.corsFilter();
        CorsConfiguration corsConfig = extractCorsConfig(filter);

        assertEquals(3600L, corsConfig.getMaxAge(), "Max age should be 3600 seconds");
    }
}
