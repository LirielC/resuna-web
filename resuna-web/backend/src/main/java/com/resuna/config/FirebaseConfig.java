package com.resuna.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.auth.FirebaseAuth;
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

    @Value("${firebase.auth-project-id:${firebase.project-id}}")
    private String authProjectId;

    private final ResourceLoader resourceLoader;
    private Firestore firestoreInstance;
    private FirebaseAuth tokenVerifier;

    @Autowired
    public FirebaseConfig(ResourceLoader resourceLoader) {
        this.resourceLoader = resourceLoader;
    }

    @PostConstruct
    public void initialize() throws IOException {
        try {
            GoogleCredentials credentials = loadCredentials();
            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseOptions options = FirebaseOptions.builder()
                        .setCredentials(credentials)
                        .setProjectId(projectId)
                        .build();
                FirebaseApp.initializeApp(options);
                logger.info("🔥 Firebase initialized successfully with project: {}", projectId);
            } else {
                logger.info("🔥 Firebase already initialized, reusing existing instance");
            }

            // Keep Firestore on its existing project; frontend ID tokens belong to authProjectId.
            FirebaseApp dataApp = FirebaseApp.getInstance();
            firestoreInstance = FirestoreClient.getFirestore(dataApp);
            FirebaseApp authApp = FirebaseApp.getApps().stream()
                    .filter(app -> "resuna-token-verifier".equals(app.getName()))
                    .findFirst()
                    .orElseGet(() -> FirebaseApp.initializeApp(
                            FirebaseOptions.builder()
                                    .setCredentials(credentials)
                                    .setProjectId(authProjectId)
                                    .build(),
                            "resuna-token-verifier"));
            tokenVerifier = FirebaseAuth.getInstance(authApp);
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

    @Bean
    public FirebaseAuth firebaseTokenVerifier() {
        if (tokenVerifier == null) {
            throw new IllegalStateException("Firebase token verifier is not initialized");
        }
        return tokenVerifier;
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
