package com.resuna.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.cloud.FirestoreClient;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Configuration
public class FirebaseConfig {

    private static final Logger logger = LoggerFactory.getLogger(FirebaseConfig.class);

    @Value("${firebase.credentials-path:}")
    private String credentialsPath;

    @Value("${firebase.credentials-json:}")
    private String credentialsJson;

    @Value("${firebase.project-id}")
    private String projectId;

    private final ResourceLoader resourceLoader;
    private Firestore firestoreInstance;

    @Autowired
    public FirebaseConfig(ResourceLoader resourceLoader) {
        this.resourceLoader = resourceLoader;
    }

    @PostConstruct
    public void initialize() throws IOException {
        try {
            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseOptions options = FirebaseOptions.builder()
                        .setCredentials(loadCredentials())
                        .setProjectId(projectId)
                        .build();
                FirebaseApp.initializeApp(options);
                logger.info("🔥 Firebase initialized successfully with project: {}", projectId);
            } else {
                logger.info("🔥 Firebase already initialized, reusing existing instance");
            }

            // Obter Firestore do FirebaseApp default (mais seguro)
            firestoreInstance = FirestoreClient.getFirestore(FirebaseApp.getInstance());
            logger.info("✅ Firestore client initialized successfully");

        } catch (Exception e) {
            logger.error("❌ Failed to initialize Firebase/Firestore", e);
            throw e;
        }
    }

    @Bean
    public Firestore firestore() {
        if (firestoreInstance == null) {
            throw new IllegalStateException("Firestore instance not initialized. Check Firebase configuration.");
        }
        return firestoreInstance;
    }

    @PreDestroy
    public void cleanup() {
        logger.info("🔥 Firebase shutting down gracefully");
        // Não fechar o Firestore aqui, deixar o Firebase gerenciar
    }

    private GoogleCredentials loadCredentials() throws IOException {
        if (credentialsJson != null && !credentialsJson.isBlank()) {
            return GoogleCredentials.fromStream(
                    new ByteArrayInputStream(credentialsJson.getBytes(StandardCharsets.UTF_8)));
        }

        if (credentialsPath != null && !credentialsPath.isBlank()) {
            Resource resource = resourceLoader.getResource(credentialsPath);
            if (resource.exists()) {
                return GoogleCredentials.fromStream(resource.getInputStream());
            }
        }

        return GoogleCredentials.getApplicationDefault();
    }
}
