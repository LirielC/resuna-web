package com.resuna.repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ExecutionException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Query;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.firestore.WriteResult;
import com.resuna.model.BillingEvent;

@Repository
@Profile("!dev")
public class FirestoreBillingEventRepository implements BillingEventRepository {

    private static final Logger logger = LoggerFactory.getLogger(FirestoreBillingEventRepository.class);
    private static final String COLLECTION_NAME = "billing_events";

    private final Firestore firestore;

    public FirestoreBillingEventRepository(Firestore firestore) {
        this.firestore = firestore;
    }

    @Override
    public BillingEvent save(BillingEvent event) {
        try {
            ApiFuture<WriteResult> result = firestore
                    .collection(COLLECTION_NAME)
                    .document(event.getId())
                    .set(event);
            result.get();
            return event;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Failed to save billing event", e);
        } catch (ExecutionException e) {
            throw new RuntimeException("Failed to save billing event", e);
        }
    }

    @Override
    public List<BillingEvent> findByUserId(String userId, int limit) {
        try {
            ApiFuture<QuerySnapshot> query = firestore.collection(COLLECTION_NAME)
                    .whereEqualTo("userId", userId)
                    .orderBy("createdAt", Query.Direction.DESCENDING)
                    .limit(limit)
                    .get();
            List<BillingEvent> result = new ArrayList<>();
            for (DocumentSnapshot doc : query.get().getDocuments()) {
                BillingEvent event = doc.toObject(BillingEvent.class);
                if (event != null) {
                    result.add(event);
                }
            }
            return result;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return List.of();
        } catch (ExecutionException e) {
            logger.error("Error loading billing events", e);
            return List.of();
        }
    }

    @Override
    public List<BillingEvent> findRecent(int limit) {
        try {
            ApiFuture<QuerySnapshot> query = firestore.collection(COLLECTION_NAME)
                    .orderBy("createdAt", Query.Direction.DESCENDING)
                    .limit(limit)
                    .get();
            List<BillingEvent> result = new ArrayList<>();
            for (DocumentSnapshot doc : query.get().getDocuments()) {
                BillingEvent event = doc.toObject(BillingEvent.class);
                if (event != null) {
                    result.add(event);
                }
            }
            return result;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return List.of();
        } catch (ExecutionException e) {
            logger.error("Error loading billing events", e);
            return List.of();
        }
    }

    @Override
    public Optional<BillingEvent> findLatestByUserId(String userId) {
        try {
            ApiFuture<QuerySnapshot> query = firestore.collection(COLLECTION_NAME)
                    .whereEqualTo("userId", userId)
                    .orderBy("createdAt", Query.Direction.DESCENDING)
                    .limit(1)
                    .get();
            QuerySnapshot snapshot = query.get();
            if (snapshot.isEmpty()) {
                return Optional.empty();
            }
            BillingEvent event = snapshot.getDocuments().get(0).toObject(BillingEvent.class);
            return Optional.ofNullable(event);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return Optional.empty();
        } catch (ExecutionException e) {
            logger.error("Error loading latest billing event", e);
            return Optional.empty();
        }
    }

    @Override
    public long countByUserIdSince(String userId, java.time.Instant since) {
        try {
            ApiFuture<QuerySnapshot> query = firestore.collection(COLLECTION_NAME)
                    .whereEqualTo("userId", userId)
                    .whereGreaterThanOrEqualTo("createdAt", since)
                    .get();
            return query.get().size();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return 0;
        } catch (ExecutionException e) {
            logger.error("Error counting billing events", e);
            return 0;
        }
    }
}
