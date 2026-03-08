package com.resuna.repository;

import com.google.cloud.firestore.Firestore;
import com.resuna.model.UserProfile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Repository;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Repository
@Primary
public class FirebaseUserProfileRepository implements UserProfileRepository {

    private static final Logger logger = LoggerFactory.getLogger(FirebaseUserProfileRepository.class);
    private static final String COLLECTION_NAME = "users";

    private final Firestore firestore;

    public FirebaseUserProfileRepository(Firestore firestore) {
        this.firestore = firestore;
    }

    @Override
    public Optional<UserProfile> findByUserId(String userId) {
        try {
            var docRef = firestore.collection(COLLECTION_NAME).document(userId);
            var docSnapshot = docRef.get().get();

            if (docSnapshot.exists()) {
                UserProfile profile = docSnapshot.toObject(UserProfile.class);
                return Optional.ofNullable(profile);
            }
            return Optional.empty();

        } catch (Exception e) {
            logger.error("Error finding user profile for userId: {}", userId, e);
            return Optional.empty();
        }
    }

    @Override
    public UserProfile save(UserProfile profile) {
        try {
            logger.debug("Attempting to save user profile for userId: {}", profile.getUserId());

            if (firestore == null) {
                throw new IllegalStateException("Firestore instance is null");
            }

            var docRef = firestore.collection(COLLECTION_NAME).document(profile.getUserId());
            docRef.set(profile).get();

            logger.info("✅ User profile saved successfully for userId: {}", profile.getUserId());
            return profile;

        } catch (Exception e) {
            logger.error("❌ Error saving user profile for userId: {}. Error: {}",
                        profile.getUserId(), e.getMessage(), e);
            throw new RuntimeException("Failed to save user profile: " + e.getMessage(), e);
        }
    }

    @Override
    public Map<String, UserProfile> findAll() {
        Map<String, UserProfile> profiles = new ConcurrentHashMap<>();

        try {
            var querySnapshot = firestore.collection(COLLECTION_NAME).get().get();
            querySnapshot.forEach(doc -> {
                UserProfile profile = doc.toObject(UserProfile.class);
                profiles.put(profile.getUserId(), profile);
            });

            logger.debug("Found {} user profiles", profiles.size());
            return profiles;

        } catch (Exception e) {
            logger.error("Error finding all user profiles", e);
            return profiles;
        }
    }

    @Override
    public void deleteByUserId(String userId) throws Exception {
        firestore.collection(COLLECTION_NAME).document(userId).delete().get();
    }
}
