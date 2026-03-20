package com.resuna.config;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import com.resuna.service.UserProfileService;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

// Registered inside Spring Security's filter chain via SecurityConfig.addFilterBefore().
// FilterRegistrationBean disables standalone servlet registration.
@Component
public class AuthFilter implements Filter {

    private static final Logger logger = LoggerFactory.getLogger(AuthFilter.class);

    private final UserProfileService userProfileService;

    // Public routes that don't require authentication.
    // Matched as exact path OR exact prefix + "/" to avoid accidental exposure
    // of future endpoints that share a common prefix (e.g. /api/authorization-*).
    private static final List<String> PUBLIC_ROUTES = Arrays.asList(
            "/api/auth/",
            "/api/health",
            "/error");

    @Value("${app.super-admin-email:}")
    private String superAdminEmail;

    public AuthFilter(UserProfileService userProfileService) {
        this.userProfileService = userProfileService;
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        String path = httpRequest.getRequestURI();
        String method = httpRequest.getMethod();

        // Allow CORS preflight requests
        if ("OPTIONS".equalsIgnoreCase(method)) {
            chain.doFilter(request, response);
            return;
        }

        // Allow public routes
        if (isPublicRoute(path)) {
            chain.doFilter(request, response);
            return;
        }

        // Check for Authorization header
        String authHeader = httpRequest.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            logger.warn("Missing or invalid Authorization header for: {} {}", method, path);
            httpResponse.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            httpResponse.setContentType("application/json");
            httpResponse.getWriter()
                    .write("{\"error\":\"Unauthorized\",\"message\":\"Missing or invalid authorization token\"}");
            return;
        }

        String token = authHeader.substring(7);

        try {
            FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(token);

            // Set user info in request attributes for use in controllers
            httpRequest.setAttribute("userId", decodedToken.getUid());
            httpRequest.setAttribute("userEmail", decodedToken.getEmail());
            httpRequest.setAttribute("userName", decodedToken.getName());
            httpRequest.setAttribute("userPicture", decodedToken.getPicture());
            httpRequest.setAttribute("userClaims", decodedToken.getClaims());
            // Firebase ID token: seconds since epoch when the user last signed in or reauthenticated.
            Object authTime = decodedToken.getClaims().get("auth_time");
            if (authTime instanceof Number) {
                httpRequest.setAttribute("firebaseAuthTimeSeconds", ((Number) authTime).longValue());
            }

            // Populate Spring Security's SecurityContextHolder so that
            // anyRequest().authenticated() in SecurityConfig can verify the user is authenticated.
            UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                    decodedToken.getUid(),
                    null,
                    List.of(new SimpleGrantedAuthority("ROLE_USER")));
            SecurityContextHolder.getContext().setAuthentication(auth);

            logger.debug("Authenticated request for {} {}", method, path);

            userProfileService.recordLogin(
                    decodedToken.getUid(),
                    decodedToken.getEmail(),
                    decodedToken.getName());

            if (path.startsWith("/api/admin") && !isAdminRequestAllowed(decodedToken)) {
                httpResponse.setStatus(HttpServletResponse.SC_FORBIDDEN);
                httpResponse.setContentType("application/json");
                httpResponse.getWriter().write("{\"error\":\"Access denied\"}");
                return;
            }

            chain.doFilter(request, response);

        } catch (FirebaseAuthException e) {
            logger.warn("Invalid Firebase token: {} for {} {}", e.getMessage(), method, path);
            httpResponse.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            httpResponse.setContentType("application/json");
            httpResponse.getWriter().write("{\"error\":\"Unauthorized\",\"message\":\"Invalid or expired token\"}");
        } finally {
            // Always clear the security context after the request to prevent thread-local leaks.
            SecurityContextHolder.clearContext();
        }
    }

    private boolean isPublicRoute(String path) {
        for (String publicRoute : PUBLIC_ROUTES) {
            // Exact match (e.g. "/api/health", "/error")
            // OR path starts with the route including trailing slash
            // (e.g. "/api/auth/" matches "/api/auth/me" but NOT "/api/authorization-*")
            if (path.equals(publicRoute) || path.startsWith(publicRoute)) {
                return true;
            }
        }
        return false;
    }

    private boolean isAdminRequestAllowed(FirebaseToken decodedToken) {
        Object adminClaim = decodedToken.getClaims().get("admin");
        boolean isAdmin = Boolean.TRUE.equals(adminClaim);
        if (!isAdmin) {
            return false;
        }
        if (superAdminEmail == null || superAdminEmail.isBlank()) {
            return true;
        }
        String email = decodedToken.getEmail();
        return email != null && superAdminEmail.equalsIgnoreCase(email);
    }
}
