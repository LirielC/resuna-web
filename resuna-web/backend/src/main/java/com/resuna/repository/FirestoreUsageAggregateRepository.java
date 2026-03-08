package com.resuna.repository;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.resuna.model.UsageAggregate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ExecutionException;

@Repository
@Profile("!dev")
public class FirestoreUsageAggregateRepository implements UsageAggregateRepository {

    private static final Logger logger = LoggerFactory.getLogger(FirestoreUsageAggregateRepository.class);
    private static final String COLLECTION_NAME = "usage_aggregates";

    private final Firestore firestore;

    public FirestoreUsageAggregateRepository(Firestore firestore) {
        this.firestore = firestore;
    }

    @Override
    public Optional<UsageAggregate> findById(String id) {
        try {
            DocumentSnapshot doc = firestore.collection(COLLECTION_NAME).document(id).get().get();
            if (!doc.exists()) {
                return Optional.empty();
            }
            try {
                return Optional.ofNullable(doc.toObject(UsageAggregate.class));
            } catch (RuntimeException e) {
                logger.warn("Failed to deserialize UsageAggregate {}: {}", id, e.getMessage());
                return Optional.empty();
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return Optional.empty();
        } catch (ExecutionException e) {
            logger.error("Error loading usage aggregate {}", id, e);
            return Optional.empty();
        }
    }

    @Override
    public UsageAggregate save(UsageAggregate aggregate) {
        try {
            ApiFuture<WriteResult> result = firestore
                    .collection(COLLECTION_NAME)
                    .document(aggregate.getId())
                    .set(aggregate);
            result.get();
            return aggregate;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Failed to save usage aggregate", e);
        } catch (ExecutionException e) {
            throw new RuntimeException("Failed to save usage aggregate", e);
        }
    }

    @Override
    public List<UsageAggregate> findByPeriodTypeSince(String periodType, String sinceKey) {
        try {
            ApiFuture<QuerySnapshot> query = firestore.collection(COLLECTION_NAME)
                    .whereEqualTo("periodType", periodType)
                    .whereGreaterThanOrEqualTo("periodKey", sinceKey)
                    .orderBy("periodKey", Query.Direction.ASCENDING)
                    .get();
            List<UsageAggregate> result = new ArrayList<>();
            for (DocumentSnapshot doc : query.get().getDocuments()) {
                try {
                    UsageAggregate aggregate = doc.toObject(UsageAggregate.class);
                    if (aggregate != null) {
                        result.add(aggregate);
                    }
                } catch (RuntimeException e) {
                    logger.warn("Failed to deserialize UsageAggregate {}: {}", doc.getId(), e.getMessage());
                }
            }
            return result;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return List.of();
        } catch (ExecutionException e) {
            logger.error("Error querying usage aggregates", e);
            return List.of();
        }
    }
}
