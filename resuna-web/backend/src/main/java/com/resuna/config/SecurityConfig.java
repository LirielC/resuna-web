package com.resuna.config;

import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Spring Security configuration — deny-by-default.
 *
 * AuthFilter is registered INSIDE Spring Security's filter chain (via addFilterBefore),
 * NOT as a standalone servlet filter. This is required in Spring Security 6 because
 * SecurityContextHolderFilter runs first in the security chain and would overwrite any
 * SecurityContextHolder state set by a pre-security standalone filter.
 *
 * By placing AuthFilter inside the chain (after SecurityContextHolderFilter establishes
 * the deferred context), setAuthentication() correctly populates the context that
 * AuthorizationFilter will later check.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final AuthFilter authFilter;

    public SecurityConfig(AuthFilter authFilter) {
        this.authFilter = authFilter;
    }

    /**
     * Prevent Spring Boot from auto-registering AuthFilter as a standalone servlet filter.
     * It is added explicitly inside the security chain below.
     */
    @Bean
    public FilterRegistrationBean<AuthFilter> authFilterRegistration() {
        FilterRegistrationBean<AuthFilter> registration = new FilterRegistrationBean<>(authFilter);
        registration.setEnabled(false);
        return registration;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // CSRF not needed — stateless JWT auth, no session cookies
            .csrf(csrf -> csrf.disable())

            // CORS — delegated to CorsConfig bean
            .cors(Customizer.withDefaults())

            // Stateless — no HTTP sessions
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )

            // Firebase JWT auth filter runs inside the security chain, after
            // SecurityContextHolderFilter establishes the deferred security context.
            .addFilterBefore(authFilter, UsernamePasswordAuthenticationFilter.class)

            // Deny-by-default: explicitly allow only public routes;
            // all other requests require authentication set by AuthFilter.
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()   // CORS preflight
                .requestMatchers("/api/health", "/error").permitAll()     // public health check
                .requestMatchers("/api/auth/**").permitAll()              // auth endpoints
                .anyRequest().authenticated()                             // everything else → deny
            );

        return http.build();
    }
}
