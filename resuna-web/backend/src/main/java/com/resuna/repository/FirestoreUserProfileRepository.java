package com.resuna.repository;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.firestore.WriteResult;
import com.resuna.model.UserProfile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ExecutionException;

@Repository
@Profile("!dev")
public class FirestoreUserProfileRepository implements UserProfileRepository {

    private static final Logger logger = LoggerFactory.getLogger(FirestoreUserProfileRepository.class);
    private static final String COLLECTION_NAME = "user_profiles";

    private final Firestore firestore;

    public FirestoreUserProfileRepository(Firestore firestore) {
        this.firestore = firestore;
    }

    @Override
    public Optional<UserProfile> findByUserId(String userId) {
        try {
            DocumentSnapshot doc = firestore.collection(COLLECTION_NAME).document(userId).get().get();
            if (!doc.exists()) {
                return Optional.empty();
            }
            return Optional.ofNullable(doc.toObject(UserProfile.class));
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return Optional.empty();
        } catch (ExecutionException e) {
            logger.error("Error loading user profile {}", userId, e);
            return Optional.empty();
        }
    }

    @Override
    public UserProfile save(UserProfile profile) {
        try {
            ApiFuture<WriteResult> result = firestore
                    .collection(COLLECTION_NAME)
                    .document(profile.getUserId())
                    .set(profile);
            result.get();
            return profile;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Failed to save user profile", e);
        } catch (ExecutionException e) {
            throw new RuntimeException("Failed to save user profile", e);
        }
    }

    public void deleteByUserId(String userId) throws ExecutionException, InterruptedException {
        firestore.collection(COLLECTION_NAME).document(userId).delete().get();
    }

    @Override
    public Map<String, UserProfile> findAll() {
        try {
            ApiFuture<QuerySnapshot> query = firestore.collection(COLLECTION_NAME).get();
            Map<String, UserProfile> result = new LinkedHashMap<>();
            for (DocumentSnapshot doc : query.get().getDocuments()) {
                UserProfile profile = doc.toObject(UserProfile.class);
                if (profile != null && profile.getUserId() != null) {
                    result.put(profile.getUserId(), profile);
                }
            }
            return result;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return Map.of();
        } catch (ExecutionException e) {
            logger.error("Error loading user profiles", e);
            return Map.of();
        }
    }
}
