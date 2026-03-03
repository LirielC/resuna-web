package com.resuna.config;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.UserRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Sets up initial admin user on application startup.
 * Configure admin email in application.yml:
 * 
 * app:
 * initial-admin-email: your-email@gmail.com
 */
@Component
public class InitialAdminSetup implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(InitialAdminSetup.class);

    @Value("${app.initial-admin-email:}")
    private String initialAdminEmail;

    @Override
    public void run(String... args) {
        if (initialAdminEmail == null || initialAdminEmail.isBlank()) {
            logger.info("No initial admin email configured. Skipping admin setup.");
            return;
        }

        try {
            // Find user by email
            UserRecord user = FirebaseAuth.getInstance().getUserByEmail(initialAdminEmail);

            // Check if already admin
            Object adminClaim = user.getCustomClaims().get("admin");
            if (Boolean.TRUE.equals(adminClaim)) {
                logger.info("User {} is already an admin", initialAdminEmail);
                return;
            }

            // Set admin claim
            Map<String, Object> claims = Map.of("admin", true);
            FirebaseAuth.getInstance().setCustomUserClaims(user.getUid(), claims);
            logger.info("✅ Successfully set admin privileges for: {}", initialAdminEmail);

        } catch (com.google.firebase.auth.FirebaseAuthException e) {
            if (e.getMessage().contains("USER_NOT_FOUND") || e.getMessage().contains("No user record")) {
                logger.warn("⚠️ Admin user not found: {}. User must sign in first, then restart the app.",
                        initialAdminEmail);
            } else {
                logger.error("Error setting up initial admin: {}", e.getMessage());
            }
        } catch (Exception e) {
            logger.error("Error during initial admin setup: {}", e.getMessage());
        }
    }
}
