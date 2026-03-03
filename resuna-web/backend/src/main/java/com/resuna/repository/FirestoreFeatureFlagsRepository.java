package com.resuna.repository;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.WriteResult;
import com.resuna.model.FeatureFlags;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.concurrent.ExecutionException;

@Repository
@Profile("!dev")
public class FirestoreFeatureFlagsRepository implements FeatureFlagsRepository {

    private static final Logger logger = LoggerFactory.getLogger(FirestoreFeatureFlagsRepository.class);
    private static final String COLLECTION_NAME = "feature_flags";

    private final Firestore firestore;

    public FirestoreFeatureFlagsRepository(Firestore firestore) {
        this.firestore = firestore;
    }

    @Override
    public Optional<FeatureFlags> findByUserId(String userId) {
        try {
            DocumentSnapshot doc = firestore.collection(COLLECTION_NAME).document(userId).get().get();
            if (!doc.exists()) {
                return Optional.empty();
            }
            return Optional.ofNullable(doc.toObject(FeatureFlags.class));
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return Optional.empty();
        } catch (ExecutionException e) {
            logger.error("Error loading feature flags for user {}", userId, e);
            return Optional.empty();
        }
    }

    @Override
    public FeatureFlags save(FeatureFlags flags) {
        try {
            ApiFuture<WriteResult> result = firestore
                    .collection(COLLECTION_NAME)
                    .document(flags.getUserId())
                    .set(flags);
            result.get();
            return flags;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Failed to save feature flags", e);
        } catch (ExecutionException e) {
            throw new RuntimeException("Failed to save feature flags", e);
        }
    }
}
