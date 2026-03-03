package com.resuna.service;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashMap;
import java.util.Map;

@Service
public class FirebaseAuthService {
    
    private static final Logger logger = LoggerFactory.getLogger(FirebaseAuthService.class);

    /**
     * Verify a Firebase ID token and return user information
     */
    public Map<String, Object> verifyToken(String idToken) throws FirebaseAuthException {
        FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(idToken);
        
        Map<String, Object> user = new HashMap<>();
        user.put("uid", decodedToken.getUid());
        user.put("email", decodedToken.getEmail());
        user.put("name", decodedToken.getName());
        user.put("picture", decodedToken.getPicture());
        user.put("emailVerified", decodedToken.isEmailVerified());
        
        logger.info("Verified token");
        return user;
    }

    /**
     * Extract the token from Authorization header
     */
    public String extractToken(String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }
        return null;
    }

    /**
     * Verify token and return user UID, or null if invalid
     */
    public String verifyAndGetUid(String authHeader) {
        String token = extractToken(authHeader);
        if (token == null) {
            return null;
        }
        
        try {
            FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(token);
            return decodedToken.getUid();
        } catch (FirebaseAuthException e) {
            logger.warn("Invalid Firebase token: {}", e.getMessage());
            return null;
        }
    }
}
