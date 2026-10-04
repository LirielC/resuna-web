package com.resuna.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.auth.oauth2.IdTokenCredentials;
import com.google.auth.oauth2.IdTokenProvider;
import com.resuna.model.Resume;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
public class TypstRendererService {
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final String rendererUrl;
    private volatile IdTokenCredentials idTokenCredentials;

    public TypstRendererService(RestTemplate restTemplate, ObjectMapper objectMapper,
                                @Value("${renderer.url:}") String rendererUrl) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
        this.rendererUrl = rendererUrl == null ? "" : rendererUrl.trim();
    }

    public byte[] render(Resume resume, String theme) {
        if (rendererUrl.isBlank()) {
            throw new IllegalStateException("Typst renderer is not configured");
        }
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(getRendererIdToken());
            String body = objectMapper.writeValueAsString(Map.of(
                    "resume", resume,
                    "theme", theme == null || theme.isBlank() ? "classic" : theme));
            ResponseEntity<byte[]> response = restTemplate.exchange(
                    rendererUrl.replaceAll("/+$", "") + "/render",
                    HttpMethod.POST,
                    new HttpEntity<>(body, headers),
                    byte[].class);
            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                throw new IllegalStateException("Typst renderer returned " + response.getStatusCode());
            }
            return response.getBody();
        } catch (RestClientException | java.io.IOException e) {
            throw new IllegalStateException("Typst renderer unavailable", e);
        }
    }

    private String getRendererIdToken() throws java.io.IOException {
        IdTokenCredentials credentials = idTokenCredentials;
        if (credentials == null) {
            synchronized (this) {
                credentials = idTokenCredentials;
                if (credentials == null) {
                    GoogleCredentials applicationCredentials = GoogleCredentials.getApplicationDefault();
                    if (!(applicationCredentials instanceof IdTokenProvider provider)) {
                        throw new IllegalStateException("Application credentials cannot provide an OIDC ID token");
                    }
                    credentials = IdTokenCredentials.newBuilder()
                            .setIdTokenProvider(provider)
                            .setTargetAudience(rendererUrl.replaceAll("/+$", ""))
                            .build();
                    idTokenCredentials = credentials;
                }
            }
        }
        credentials.refreshIfExpired();
        return credentials.getAccessToken().getTokenValue();
    }
}
