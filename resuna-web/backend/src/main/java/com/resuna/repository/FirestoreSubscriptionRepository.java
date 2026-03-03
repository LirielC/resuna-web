package com.resuna.repository;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.resuna.model.UserSubscription;
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
public class FirestoreSubscriptionRepository implements SubscriptionRepository {

    private static final Logger logger = LoggerFactory.getLogger(FirestoreSubscriptionRepository.class);
    private static final String COLLECTION_NAME = "user_subscriptions";

    private final Firestore firestore;

    public FirestoreSubscriptionRepository(Firestore firestore) {
        this.firestore = firestore;
    }

    @Override
    public Optional<UserSubscription> findByUserId(String userId) {
        try {
            DocumentSnapshot doc = firestore.collection(COLLECTION_NAME).document(userId).get().get();
            if (!doc.exists()) {
                return Optional.empty();
            }
            UserSubscription subscription = doc.toObject(UserSubscription.class);
            return Optional.ofNullable(subscription);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return Optional.empty();
        } catch (ExecutionException e) {
            logger.error("Error loading subscription for user {}", userId, e);
            return Optional.empty();
        }
    }

    @Override
    public UserSubscription save(UserSubscription subscription) {
        try {
            if (subscription.getUserId() == null || subscription.getUserId().isBlank()) {
                throw new IllegalArgumentException("Subscription userId is required");
            }
            ApiFuture<WriteResult> result = firestore
                    .collection(COLLECTION_NAME)
                    .document(subscription.getUserId())
                    .set(subscription);
            result.get();
            return subscription;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Failed to save subscription", e);
        } catch (ExecutionException e) {
            throw new RuntimeException("Failed to save subscription", e);
        }
    }

    @Override
    public Map<String, UserSubscription> findAll() {
        try {
            ApiFuture<QuerySnapshot> query = firestore.collection(COLLECTION_NAME).get();
            Map<String, UserSubscription> result = new LinkedHashMap<>();
            for (DocumentSnapshot doc : query.get().getDocuments()) {
                UserSubscription subscription = doc.toObject(UserSubscription.class);
                if (subscription != null && subscription.getUserId() != null) {
                    result.put(subscription.getUserId(), subscription);
                }
            }
            return result;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return Map.of();
        } catch (ExecutionException e) {
            logger.error("Error loading subscriptions", e);
            return Map.of();
        }
    }
}
